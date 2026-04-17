import { ComplaintStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { requireCitizen } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confirmResolutionSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await requireCitizen();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = confirmResolutionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id: parsed.data.complaintId },
  });

  if (!complaint || complaint.userId !== session.userId) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  const nextStatus = parsed.data.confirmed
    ? ComplaintStatus.RESOLVED
    : ComplaintStatus.ESCALATED;

  await prisma.complaint.update({
    where: { id: complaint.id },
    data: { status: nextStatus },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.userId,
      complaintId: complaint.id,
      action: parsed.data.confirmed
        ? "CITIZEN_CONFIRMED_RESOLUTION"
        : "CITIZEN_REJECTED_RESOLUTION",
      meta: {
        message: parsed.data.message ? sanitizeHtml(parsed.data.message) : null,
      },
    },
  });

  return NextResponse.json({ ok: true, status: nextStatus });
}
