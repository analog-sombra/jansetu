"use server";

import prisma from "@/lib/prisma";
import { canEditOrDeleteMeeting, requireMlaPaMeetingUser } from "./_shared";
import { DeleteMlaPaMeetingInput, DeleteMlaPaMeetingResult } from "./types";

export async function deleteMlaPaMeetingAction(
  payload: DeleteMlaPaMeetingInput,
): Promise<DeleteMlaPaMeetingResult> {
  const auth = await requireMlaPaMeetingUser();
  if (!auth.ok) {
    return auth;
  }

  const roleError = canEditOrDeleteMeeting(auth.user.role);
  if (roleError) {
    return roleError;
  }

  try {
    const existing = await prisma.mla_pa_meeting.findUnique({
      where: { id: payload.meetingId },
      select: { id: true },
    });

    if (!existing) {
      return { ok: false, error: "Meeting not found." };
    }

    await prisma.mla_pa_meeting.delete({
      where: { id: payload.meetingId },
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to delete meeting." };
  }
}
