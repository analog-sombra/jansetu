"use server";

import { MeetingApprovalStatus, MeetingType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminUser } from "../_shared";
import { ApproveAdminMeetingInput, ApproveAdminMeetingResult } from "./types";

export async function approveAdminMeetingAction(
  payload: ApproveAdminMeetingInput,
): Promise<ApproveAdminMeetingResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  const meetingId = Number(payload.meetingId);
  const meetingPlace = payload.meetingPlace?.trim();
  const approvalRemarks = payload.approvalRemarks?.trim() || null;
  const meetingDateTime = payload.meetingDateTime
    ? new Date(payload.meetingDateTime)
    : null;

  if (!Number.isInteger(meetingId) || meetingId <= 0) {
    return { ok: false, error: "Invalid meeting selected." };
  }

  if (!meetingDateTime || Number.isNaN(meetingDateTime.getTime())) {
    return { ok: false, error: "Please select a valid meeting date and time." };
  }

  if (!meetingPlace) {
    return { ok: false, error: "Meeting place is required." };
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
      return { ok: false, error: "Only citizen meetings require approval." };
    }

    if (meeting.approvalStatus !== MeetingApprovalStatus.PENDING) {
      return { ok: false, error: "Only pending meetings can be approved." };
    }

    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        meetingDateTime,
        meetingPlace,
        approvalRemarks,
        approvalStatus: MeetingApprovalStatus.APPROVED,
        approvedAt: new Date(),
        rejectedAt: null,
      },
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to approve meeting." };
  }
}
