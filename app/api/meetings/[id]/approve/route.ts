import { MeetingApprovalStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { approveMeetingSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const meetingId = Number(id);
  if (!Number.isInteger(meetingId) || meetingId <= 0) {
    return NextResponse.json({ error: "Invalid meeting id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = approveMeetingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid approval payload" }, { status: 400 });
  }

  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  if (meeting.type !== "CITIZEN_MEET") {
    return NextResponse.json({ error: "Only citizen meetings can be approved" }, { status: 400 });
  }

  const updated = await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      approvalStatus: MeetingApprovalStatus.APPROVED,
      approvedAt: new Date(),
      rejectedAt: null,
      meetingDateTime: new Date(parsed.data.meetingDateTime),
      meetingPlace: sanitizeHtml(parsed.data.meetingPlace),
      approvalRemarks: parsed.data.approvalRemarks
        ? sanitizeHtml(parsed.data.approvalRemarks)
        : "Approved by admin",
    },
    include: {
      createdByUser: { select: { id: true, name: true, mobile: true, role: true } },
      assignedToUser: { select: { id: true, name: true, mobile: true, role: true } },
    },
  });

  return NextResponse.json({ ok: true, meeting: updated });
}
