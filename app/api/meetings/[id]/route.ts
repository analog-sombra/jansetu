import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
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

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      createdByUser: { select: { id: true, name: true, mobile: true, role: true } },
      assignedToUser: { select: { id: true, name: true, mobile: true, role: true } },
    },
  });

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, meeting });
}
