"use server";

import { MEETINGAPPROVALSTATUS, MEETINGTYPE } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminUser } from "../_shared";
import { CreateAdminMeetingInput, CreateAdminMeetingResult } from "./types";

function normalizeMobile(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const mobile = value.replace(/\D/g, "").slice(0, 10);
  return mobile || null;
}

export async function createAdminMeetingAction(
  payload: CreateAdminMeetingInput,
): Promise<CreateAdminMeetingResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  const assignedToUserId = payload.assignedToUserId.trim();
  const campHeadUserId = payload.campHeadUserId?.trim() || null;
  const purpose = payload.purpose.trim();
  const meetingPlace = payload.meetingPlace?.trim() || null;
  const giftToCarry = payload.giftToCarry?.trim() || null;
  const selfDraftedLetter = payload.selfDraftedLetter?.trim() || null;
  const citizenName = payload.citizenName?.trim() || null;
  const citizenArea = payload.citizenArea?.trim() || null;
  const citizenDetails = payload.citizenDetails?.trim() || null;
  const contactName = payload.contactName?.trim() || null;
  const contactDesignation = payload.contactDesignation?.trim() || null;
  const contactDepartment = payload.contactDepartment?.trim() || null;
  const partyMeetDetails = payload.partyMeetDetails?.trim() || null;
  const selectedStaffNames = payload.selectedStaffNames?.trim() || null;
  const citizenMobile = normalizeMobile(payload.citizenMobile);
  const contactMobile = normalizeMobile(payload.contactMobile);

  if (!assignedToUserId) {
    return { ok: false, error: "Please select the assignee user." };
  }

  if (purpose.length < 10) {
    return { ok: false, error: "Purpose must be at least 10 characters." };
  }

  const isCitizenMeet = payload.type === MEETINGTYPE.CITIZEN_MEET;
  const isDepartmentVisit = payload.type === MEETINGTYPE.DEPARTMENT_VISIT;
  const isPartyMeet = payload.type === MEETINGTYPE.PARTY_MEET;
  const isOfficeMeet = payload.type === MEETINGTYPE.OFFICE_MEET;
  const isInvitation = payload.type === MEETINGTYPE.INVITATION;
  const requiresContactDetails =
    payload.type === MEETINGTYPE.DEPARTMENT_VISIT ||
    payload.type === MEETINGTYPE.PERSONAL_MEET ||
    payload.type === MEETINGTYPE.PARTY_MEET;

  const meetingDateTime = payload.meetingDateTime
    ? new Date(payload.meetingDateTime)
    : null;
  const preferredDateTime = payload.preferredDateTime
    ? new Date(payload.preferredDateTime)
    : null;

  if (!isCitizenMeet && !isInvitation) {
    if (!meetingDateTime || Number.isNaN(meetingDateTime.getTime())) {
      return {
        ok: false,
        error: "Please select a valid meeting date and time.",
      };
    }

    if (!meetingPlace) {
      return { ok: false, error: "Meeting place is required." };
    }
  }

  if (isCitizenMeet) {
    if (!preferredDateTime || Number.isNaN(preferredDateTime.getTime())) {
      return {
        ok: false,
        error: "Please select a valid preferred date and time.",
      };
    }

    if (!payload.priority) {
      return {
        ok: false,
        error: "Please select priority for citizen meeting.",
      };
    }

    if (!citizenName || !citizenMobile || !citizenArea || !citizenDetails) {
      return {
        ok: false,
        error: "Citizen name, mobile, area and details are required.",
      };
    }

    if (!/^\d{10}$/.test(citizenMobile)) {
      return {
        ok: false,
        error: "Please provide a valid citizen mobile number.",
      };
    }
  }

  if (requiresContactDetails) {
    if (!isOfficeMeet && (!contactName || !contactMobile)) {
      return { ok: false, error: "Contact name and mobile are required." };
    }

    if (!isOfficeMeet && !/^\d{10}$/.test(contactMobile || "")) {
      return {
        ok: false,
        error: "Please provide a valid contact mobile number.",
      };
    }

    if (isDepartmentVisit && (!contactDesignation || !contactDepartment)) {
      return {
        ok: false,
        error: "Designation and department are required for department visit.",
      };
    }

    if (isPartyMeet && !partyMeetDetails) {
      return {
        ok: false,
        error: "Party office details are required for party meeting.",
      };
    }
  }

  if (isOfficeMeet && !selectedStaffNames) {
    return {
      ok: false,
      error: "Staff members are required for office meeting.",
    };
  }

  if (isInvitation) {
    if (!payload.invitationSubtype) {
      return {
        ok: false,
        error: "Invitation type is required for invitation meeting.",
      };
    }

    if (!campHeadUserId) {
      return {
        ok: false,
        error: "Camp head user is required for invitation meeting.",
      };
    }

    if (!giftToCarry) {
      return {
        ok: false,
        error: "Gift to carry is required for invitation meeting.",
      };
    }

    if (!selfDraftedLetter) {
      return {
        ok: false,
        error: "Self drafted letter is required for invitation meeting.",
      };
    }
  }

  try {
    const assignedUser = await prisma.user.findUnique({
      where: { id: assignedToUserId },
      select: { id: true },
    });

    if (!assignedUser) {
      return { ok: false, error: "Assigned user not found." };
    }

    if (isInvitation && campHeadUserId) {
      const campHeadUser = await prisma.user.findUnique({
        where: { id: campHeadUserId },
        select: { id: true },
      });

      if (!campHeadUser) {
        return { ok: false, error: "Camp head user not found." };
      }
    }

    const approvalStatus = isCitizenMeet
      ? MEETINGAPPROVALSTATUS.PENDING
      : MEETINGAPPROVALSTATUS.NOT_REQUIRED;

    const meeting = await prisma.meeting.create({
      data: {
        createdByUserId: auth.user.id,
        assignedToUserId,
        campHeadUserId: isInvitation ? campHeadUserId : null,
        type: payload.type,
        invitationSubtype: payload.invitationSubtype,
        giftToCarry: isInvitation ? giftToCarry : null,
        selfDraftedLetter: isInvitation ? selfDraftedLetter : null,
        purpose,
        meetingDateTime,
        meetingPlace,
        approvalStatus,
        preferredDateTime,
        priority: isCitizenMeet ? (payload.priority ?? null) : null,
        citizenName,
        citizenMobile,
        citizenArea,
        citizenDetails,
        contactName,
        contactMobile,
        contactDesignation,
        contactDepartment,
        partyMeetDetails,
        selectedStaffNames,
      },
      select: {
        id: true,
        type: true,
        approvalStatus: true,
        createdAt: true,
      },
    });

    return {
      ok: true,
      meeting: {
        id: meeting.id,
        type: meeting.type,
        approvalStatus: meeting.approvalStatus,
        createdAt: meeting.createdAt.toISOString(),
      },
    };
  } catch {
    return { ok: false, error: "Failed to create meeting." };
  }
}
