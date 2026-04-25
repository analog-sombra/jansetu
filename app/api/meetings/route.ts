import { MeetingApprovalStatus, MeetingType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMeetingSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("approvalStatus");
  const type = request.nextUrl.searchParams.get("type");

  const meetings = await prisma.meeting.findMany({
    where: {
      approvalStatus:
        status && Object.values(MeetingApprovalStatus).includes(status as MeetingApprovalStatus)
          ? (status as MeetingApprovalStatus)
          : undefined,
      type:
        type && Object.values(MeetingType).includes(type as MeetingType)
          ? (type as MeetingType)
          : undefined,
    },
    include: {
      createdByUser: {
        select: { id: true, name: true, mobile: true, role: true },
      },
      assignedToUser: {
        select: { id: true, name: true, mobile: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ ok: true, meetings });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createMeetingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid meeting payload" }, { status: 400 });
  }

  const assignedUser = await prisma.user.findUnique({
    where: { id: parsed.data.assignedToUserId },
    select: { id: true },
  });

  if (!assignedUser) {
    return NextResponse.json({ error: "Assigned user not found" }, { status: 404 });
  }

  const isCitizenMeet = parsed.data.type === "CITIZEN_MEET";

  const meeting = await prisma.meeting.create({
    data: {
      createdByUserId: session.userId,
      assignedToUserId: parsed.data.assignedToUserId,
      type: parsed.data.type as never,
      purpose: sanitizeHtml(parsed.data.purpose),
      meetingDateTime:
        !isCitizenMeet && parsed.data.meetingDateTime
          ? new Date(parsed.data.meetingDateTime)
          : null,
      meetingPlace:
        !isCitizenMeet && parsed.data.meetingPlace
          ? sanitizeHtml(parsed.data.meetingPlace)
          : null,
      approvalStatus: isCitizenMeet
        ? MeetingApprovalStatus.PENDING
        : MeetingApprovalStatus.NOT_REQUIRED,
      preferredDateTime:
        isCitizenMeet && parsed.data.preferredDateTime
          ? new Date(parsed.data.preferredDateTime)
          : null,
      priority: isCitizenMeet ? (parsed.data.priority as never) : null,
      citizenName: isCitizenMeet ? sanitizeHtml(parsed.data.citizenName ?? "") : null,
      citizenMobile: isCitizenMeet ? sanitizeHtml(parsed.data.citizenMobile ?? "") : null,
      citizenArea: isCitizenMeet ? sanitizeHtml(parsed.data.citizenArea ?? "") : null,
      citizenDetails: isCitizenMeet ? sanitizeHtml(parsed.data.citizenDetails ?? "") : null,
      contactName: !isCitizenMeet ? sanitizeHtml(parsed.data.contactName ?? "") : null,
      contactMobile: !isCitizenMeet ? sanitizeHtml(parsed.data.contactMobile ?? "") : null,
      contactDesignation: !isCitizenMeet
        ? sanitizeHtml(parsed.data.contactDesignation ?? "")
        : null,
      contactDepartment: !isCitizenMeet
        ? sanitizeHtml(parsed.data.contactDepartment ?? "")
        : null,
    },
    include: {
      createdByUser: { select: { id: true, name: true, mobile: true, role: true } },
      assignedToUser: { select: { id: true, name: true, mobile: true, role: true } },
    },
  });

  return NextResponse.json({ ok: true, meeting });
}
