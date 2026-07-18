import { INVITATIONSUBTYPE, MLAPAMEETINGTYPE, ROLE } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireMlaPaRouteUser } from "../_shared";
import {
  CreateMlaPaMeetingInput,
  MlaPaMeetingRecord,
  MlaPaRouteAuthResult,
} from "./types";

const MLA_ROLE: ROLE = "MLA";
const CAMP_HEAD_ROLE: ROLE = "CAMP_HEAD";

export async function requireMlaPaMeetingUser() {
  return requireMlaPaRouteUser();
}

export async function validateAssignableMeetingUsers(
  mlaUserId: string,
  campHeadUserId: string,
): Promise<string | null> {
  const [mlaUser, campHeadUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: mlaUserId },
      select: { id: true, role: true },
    }),
    prisma.user.findUnique({
      where: { id: campHeadUserId },
      select: { id: true, role: true },
    }),
  ]);

  if (!mlaUser || mlaUser.role !== MLA_ROLE) {
    return "Please select a valid MLA user.";
  }

  if (!campHeadUser || campHeadUser.role !== CAMP_HEAD_ROLE) {
    return "Please select a valid CAMP_HEAD user.";
  }

  return null;
}

export function validateMeetingPayload(
  payload: CreateMlaPaMeetingInput,
): string | null {
  if (!payload.mlaUserId.trim()) {
    return "Please select MLA user.";
  }

  if (!payload.campHeadUserId.trim()) {
    return "Please select CAMP_HEAD user.";
  }

  if (payload.purpose.trim().length < 10) {
    return "Purpose must be at least 10 characters.";
  }

  if (!payload.meetingPlace.trim()) {
    return "Meeting place is required.";
  }

  const scheduledAt = new Date(payload.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return "Please select a valid date and time.";
  }

  if (payload.type === MLAPAMEETINGTYPE.INVITATION) {
    if (!payload.invitationSubtype) {
      return "Please select invitation subtype.";
    }

    if (
      payload.invitationSubtype === INVITATIONSUBTYPE.OTHER &&
      !payload.invitationOtherPurpose?.trim()
    ) {
      return "Please provide purpose for invitation subtype Other.";
    }

    if (!payload.giftToCarry?.trim()) {
      return "Please provide gift details for invitation meetings.";
    }

    if (!payload.selfDraftedLetter?.trim()) {
      return "Please provide self drafted letter for invitation meetings.";
    }
  }

  return null;
}

export function canEditOrDeleteMeeting(
  role: ROLE,
): MlaPaRouteAuthResult | null {
  if (role !== "MLA_PA") {
    return { ok: false, error: "Only MLA-PA can edit or delete meetings." };
  }

  return null;
}

export function canMarkMeetingCompleted(
  role: ROLE,
): MlaPaRouteAuthResult | null {
  if (role !== "MLA_PA" && role !== "CAMP_HEAD") {
    return {
      ok: false,
      error: "You are not allowed to complete this meeting.",
    };
  }

  return null;
}

export function mapMeetingRecord(meeting: {
  id: number;
  createdByUserId: string;
  mlaUserId: string;
  campHeadUserId: string;
  type: MLAPAMEETINGTYPE;
  invitationSubtype: INVITATIONSUBTYPE | null;
  invitationOtherPurpose: string | null;
  purpose: string;
  scheduledAt: Date;
  meetingPlace: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  invitationDetail: {
    giftToCarry: string | null;
    selfDraftedLetter: string | null;
  } | null;
  createdByUser: {
    id: string;
    name: string | null;
    mobile: string;
    role: ROLE;
  };
  mlaUser: {
    id: string;
    name: string | null;
    mobile: string;
    role: ROLE;
  };
  campHeadUser: {
    id: string;
    name: string | null;
    mobile: string;
    role: ROLE;
  };
}): MlaPaMeetingRecord {
  return {
    id: meeting.id,
    createdByUserId: meeting.createdByUserId,
    mlaUserId: meeting.mlaUserId,
    campHeadUserId: meeting.campHeadUserId,
    type: meeting.type,
    invitationSubtype: meeting.invitationSubtype,
    invitationOtherPurpose: meeting.invitationOtherPurpose,
    purpose: meeting.purpose,
    scheduledAt: meeting.scheduledAt.toISOString(),
    meetingPlace: meeting.meetingPlace,
    completedAt: meeting.completedAt?.toISOString() ?? null,
    createdAt: meeting.createdAt.toISOString(),
    updatedAt: meeting.updatedAt.toISOString(),
    giftToCarry: meeting.invitationDetail?.giftToCarry ?? null,
    selfDraftedLetter: meeting.invitationDetail?.selfDraftedLetter ?? null,
    createdByUser: meeting.createdByUser,
    mlaUser: meeting.mlaUser,
    campHeadUser: meeting.campHeadUser,
  };
}
