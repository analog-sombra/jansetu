import { ComplaintStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { requireAdmin, requireCitizen } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createComplaintSchema } from "@/lib/validators";
import { findDuplicateComplaints } from "@/services/duplicate-service";

export async function POST(request: Request) {
  try {
    const session = await requireCitizen();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createComplaintSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid complaint fields" }, { status: 400 });
    }

    const duplicateMatches = await findDuplicateComplaints({
      category: parsed.data.category,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
    });

    const complaint = await prisma.complaint.create({
      data: {
        userId: session.userId,
        category: sanitizeHtml(parsed.data.category),
        subcategory: parsed.data.subcategory ? sanitizeHtml(parsed.data.subcategory) : null,
        description: sanitizeHtml(parsed.data.description),
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        area: parsed.data.area ? sanitizeHtml(parsed.data.area) : null,
        status: duplicateMatches.length > 0 ? ComplaintStatus.IN_PROGRESS : ComplaintStatus.PENDING,
        media: {
          create: parsed.data.media.map((m) => ({
            fileUrl: sanitizeHtml(m.fileUrl),
            type: m.type,
          })),
        },
      },
      include: {
        media: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.userId,
        complaintId: complaint.id,
        action: "COMPLAINT_CREATED",
        meta: {
          duplicateCount: duplicateMatches.length,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      complaint,
      duplicateMatches,
    });
  } catch (error) {
    console.error("Complaint creation error:", error);
    return NextResponse.json(
      { error: "Failed to create complaint" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl;
  const rawStatus = url.searchParams.get("status");
  const status = rawStatus
    ? (Object.values(ComplaintStatus).includes(rawStatus as ComplaintStatus)
        ? (rawStatus as ComplaintStatus)
        : undefined)
    : undefined;
  const rawCategory = url.searchParams.get("category");
  const rawArea = url.searchParams.get("area");
  const category = rawCategory && rawCategory.trim() ? rawCategory.trim() : undefined;
  const area = rawArea && rawArea.trim() ? rawArea.trim() : undefined;

  const complaints = await prisma.complaint.findMany({
    where: {
      status: status ?? undefined,
      category: category ?? undefined,
      area: area ?? undefined,
    },
    include: {
      user: {
        select: { id: true, name: true, mobile: true, address: true },
      },
      media: true,
      assignments: {
        include: {
          officer: {
            include: { department: true },
          },
          responses: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ ok: true, complaints });
}
