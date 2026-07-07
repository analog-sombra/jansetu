"use server";

import { MlaPaMeetingType } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  canEditOrDeleteMeeting,
  requireMlaPaMeetingUser,
  validateAssignableMeetingUsers,
  validateMeetingPayload,
} from "./_shared";
import { UpdateMlaPaMeetingInput, UpdateMlaPaMeetingResult } from "./types";

export async function updateMlaPaMeetingAction(
  payload: UpdateMlaPaMeetingInput,
): Promise<UpdateMlaPaMeetingResult> {
  const auth = await requireMlaPaMeetingUser();
  if (!auth.ok) {
    return auth;
  }

  const roleError = canEditOrDeleteMeeting(auth.user.role);
  if (roleError) {
    return roleError;
  }

  const validationError = validateMeetingPayload(payload);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const userError = await validateAssignableMeetingUsers(
    payload.mlaUserId.trim(),
    payload.campHeadUserId.trim(),
  );
  if (userError) {
    return { ok: false, error: userError };
  }

  try {
    const existing = await prisma.mlaPaMeeting.findUnique({
      where: { id: payload.meetingId },
      select: { id: true },
    });

    if (!existing) {
      return { ok: false, error: "Meeting not found." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.mlaPaMeeting.update({
        where: { id: payload.meetingId },
        data: {
          mlaUserId: payload.mlaUserId.trim(),
          campHeadUserId: payload.campHeadUserId.trim(),
          type: payload.type,
          invitationSubtype:
            payload.type === MlaPaMeetingType.INVITATION
              ? payload.invitationSubtype ?? null
              : null,
          invitationOtherPurpose:
            payload.type === MlaPaMeetingType.INVITATION
              ? payload.invitationOtherPurpose?.trim() || null
              : null,
          purpose: payload.purpose.trim(),
          scheduledAt: new Date(payload.scheduledAt),
          meetingPlace: payload.meetingPlace.trim(),
        },
      });

      if (payload.type === MlaPaMeetingType.INVITATION) {
        await tx.mlaPaMeetingInvitationDetail.upsert({
          where: { meetingId: payload.meetingId },
          update: {
            giftToCarry: payload.giftToCarry?.trim() || null,
            selfDraftedLetter: payload.selfDraftedLetter?.trim() || null,
          },
          create: {
            meetingId: payload.meetingId,
            giftToCarry: payload.giftToCarry?.trim() || null,
            selfDraftedLetter: payload.selfDraftedLetter?.trim() || null,
          },
        });
      } else {
        await tx.mlaPaMeetingInvitationDetail.deleteMany({
          where: { meetingId: payload.meetingId },
        });
      }
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to update meeting." };
  }
}
