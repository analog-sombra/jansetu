"use server";

import prisma from "@/lib/prisma";
import {
  canMarkMeetingCompleted,
  requireMlaPaMeetingUser,
} from "./_shared";
import {
  CompleteMlaPaMeetingInput,
  CompleteMlaPaMeetingResult,
} from "./types";

export async function completeMlaPaMeetingAction(
  payload: CompleteMlaPaMeetingInput,
): Promise<CompleteMlaPaMeetingResult> {
  const auth = await requireMlaPaMeetingUser();
  if (!auth.ok) {
    return auth;
  }

  const roleError = canMarkMeetingCompleted(auth.user.role);
  if (roleError) {
    return roleError;
  }

  try {
    const meeting = await prisma.mlaPaMeeting.findUnique({
      where: { id: payload.meetingId },
      select: {
        id: true,
        campHeadUserId: true,
        completedAt: true,
      },
    });

    if (!meeting) {
      return { ok: false, error: "Meeting not found." };
    }

    if (
      auth.user.role === "CAMP_HEAD" &&
      meeting.campHeadUserId !== auth.user.id
    ) {
      return { ok: false, error: "You can only complete your assigned meetings." };
    }

    if (meeting.completedAt) {
      return { ok: true };
    }

    await prisma.mlaPaMeeting.update({
      where: { id: payload.meetingId },
      data: {
        completedAt: new Date(),
      },
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to complete meeting." };
  }
}
