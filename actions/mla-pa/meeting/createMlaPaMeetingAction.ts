"use server";

import { MLAPAMEETINGTYPE } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  requireMlaPaMeetingUser,
  validateAssignableMeetingUsers,
  validateMeetingPayload,
} from "./_shared";
import { CreateMlaPaMeetingInput, CreateMlaPaMeetingResult } from "./types";

export async function createMlaPaMeetingAction(
  payload: CreateMlaPaMeetingInput,
): Promise<CreateMlaPaMeetingResult> {
  const auth = await requireMlaPaMeetingUser();
  if (!auth.ok) {
    return auth;
  }

  if (auth.user.role !== "MLA_PA") {
    return { ok: false, error: "Only MLA-PA can create meetings." };
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
    const meeting = await prisma.mla_pa_meeting.create({
      data: {
        createdByUserId: auth.user.id,
        mlaUserId: payload.mlaUserId.trim(),
        campHeadUserId: payload.campHeadUserId.trim(),
        type: payload.type,
        invitationSubtype:
          payload.type === MLAPAMEETINGTYPE.INVITATION
            ? payload.invitationSubtype ?? null
            : null,
        invitationOtherPurpose:
          payload.type === MLAPAMEETINGTYPE.INVITATION
            ? payload.invitationOtherPurpose?.trim() || null
            : null,
        purpose: payload.purpose.trim(),
        scheduledAt: new Date(payload.scheduledAt),
        meetingPlace: payload.meetingPlace.trim(),
        invitationDetail:
          payload.type === MLAPAMEETINGTYPE.INVITATION
            ? {
                create: {
                  giftToCarry: payload.giftToCarry?.trim() || null,
                  selfDraftedLetter: payload.selfDraftedLetter?.trim() || null,
                },
              }
            : undefined,
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
      },
    });

    return {
      ok: true,
      meeting: {
        id: meeting.id,
        type: meeting.type,
        createdAt: meeting.createdAt.toISOString(),
      },
    };
  } catch {
    return { ok: false, error: "Failed to create meeting." };
  }
}
