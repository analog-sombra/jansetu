"use server";

import { MeetingApprovalStatus, MeetingType } from "@prisma/client";
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
  const purpose = payload.purpose.trim();
  const meetingPlace = payload.meetingPlace?.trim() || null;
  const citizenName = payload.citizenName?.trim() || null;
  const citizenArea = payload.citizenArea?.trim() || null;
  const citizenDetails = payload.citizenDetails?.trim() || null;
  const contactName = payload.contactName?.trim() || null;
  const contactDesignation = payload.contactDesignation?.trim() || null;
  const contactDepartment = payload.contactDepartment?.trim() || null;
  const citizenMobile = normalizeMobile(payload.citizenMobile);
  const contactMobile = normalizeMobile(payload.contactMobile);

  if (!assignedToUserId) {
    return { ok: false, error: "Please select the assignee user." };
  }

  if (purpose.length < 10) {
    return { ok: false, error: "Purpose must be at least 10 characters." };
  }

  const isCitizenMeet = payload.type === MeetingType.CITIZEN_MEET;
  const isDepartmentVisit = payload.type === MeetingType.DEPARTMENT_VISIT;
  const requiresContactDetails =
    payload.type === MeetingType.DEPARTMENT_VISIT ||
    payload.type === MeetingType.PERSONAL_MEET;

  const meetingDateTime = payload.meetingDateTime
    ? new Date(payload.meetingDateTime)
    : null;
  const preferredDateTime = payload.preferredDateTime
    ? new Date(payload.preferredDateTime)
    : null;

  if (!isCitizenMeet) {
    if (!meetingDateTime || Number.isNaN(meetingDateTime.getTime())) {
      return { ok: false, error: "Please select a valid meeting date and time." };
    }

    if (!meetingPlace) {
      return { ok: false, error: "Meeting place is required." };
    }
  }

  if (isCitizenMeet) {
    if (!preferredDateTime || Number.isNaN(preferredDateTime.getTime())) {
      return { ok: false, error: "Please select a valid preferred date and time." };
    }

    if (!payload.priority) {
      return { ok: false, error: "Please select priority for citizen meeting." };
    }

    if (!citizenName || !citizenMobile || !citizenArea || !citizenDetails) {
      return {
        ok: false,
        error: "Citizen name, mobile, area and details are required.",
      };
    }

    if (!/^\d{10}$/.test(citizenMobile)) {
      return { ok: false, error: "Please provide a valid citizen mobile number." };
    }
  }

  if (requiresContactDetails) {
    if (!contactName || !contactMobile) {
      return { ok: false, error: "Contact name and mobile are required." };
    }

    if (!/^\d{10}$/.test(contactMobile)) {
      return { ok: false, error: "Please provide a valid contact mobile number." };
    }

    if (isDepartmentVisit && (!contactDesignation || !contactDepartment)) {
      return {
        ok: false,
        error: "Designation and department are required for department visit.",
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

    const approvalStatus = isCitizenMeet
      ? MeetingApprovalStatus.PENDING
      : MeetingApprovalStatus.NOT_REQUIRED;

    const meeting = await prisma.meeting.create({
      data: {
        createdByUserId: auth.user.id,
        assignedToUserId,
        type: payload.type,
        purpose,
        meetingDateTime,
        meetingPlace,
        approvalStatus,
        preferredDateTime,
        priority: isCitizenMeet ? payload.priority ?? null : null,
        citizenName,
        citizenMobile,
        citizenArea,
        citizenDetails,
        contactName,
        contactMobile,
        contactDesignation,
        contactDepartment,
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
