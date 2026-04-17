import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const complaintId = Number(id);

  if (!Number.isInteger(complaintId)) {
    return NextResponse.json({ error: "Invalid complaint id" }, { status: 400 });
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          mobile: true,
          address: true,
          voterId: true,
        },
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
      auditLogs: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  if (session.role !== "ADMIN" && complaint.userId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, complaint });
}
