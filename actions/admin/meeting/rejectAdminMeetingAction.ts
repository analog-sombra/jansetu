"use server";

import { MeetingApprovalStatus, MeetingType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminUser } from "../_shared";
import { RejectAdminMeetingInput, RejectAdminMeetingResult } from "./types";

export async function rejectAdminMeetingAction(
  payload: RejectAdminMeetingInput,
): Promise<RejectAdminMeetingResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  const meetingId = Number(payload.meetingId);
  const rejectionRemarks = payload.rejectionRemarks?.trim();

  if (!Number.isInteger(meetingId) || meetingId <= 0) {
    return { ok: false, error: "Invalid meeting selected." };
  }

  if (!rejectionRemarks) {
    return { ok: false, error: "Rejection remarks are required." };
  }

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: {
        id: true,
        type: true,
        approvalStatus: true,
      },
    });

    if (!meeting) {
      return { ok: false, error: "Meeting not found." };
    }

    if (meeting.type !== MeetingType.CITIZEN_MEET) {
      return { ok: false, error: "Only citizen meetings can be rejected." };
    }

    if (meeting.approvalStatus !== MeetingApprovalStatus.PENDING) {
      return { ok: false, error: "Only pending meetings can be rejected." };
    }

    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        approvalStatus: MeetingApprovalStatus.REJECTED,
        rejectedAt: new Date(),
        approvedAt: null,
        approvalRemarks: rejectionRemarks,
      },
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to reject meeting." };
  }
}
