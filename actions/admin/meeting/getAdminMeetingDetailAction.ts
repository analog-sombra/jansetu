"use server";

import prisma from "@/lib/prisma";
import { requireAdminUser } from "../_shared";
import { AdminMeetingDashboardRecord } from "./types";
import { AdminAuthResult } from "../types";

export type AdminMeetingDetailResult =
  | {
      ok: true;
      meeting: AdminMeetingDashboardRecord;
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export async function getAdminMeetingDetailAction(
  meetingId: number,
): Promise<AdminMeetingDetailResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: {
        id: true,
        createdByUserId: true,
        assignedToUserId: true,
        type: true,
        invitationSubtype: true,
        purpose: true,
        meetingDateTime: true,
        meetingPlace: true,
        approvalStatus: true,
        approvedAt: true,
        rejectedAt: true,
        completedAt: true,
        approvalRemarks: true,
        preferredDateTime: true,
        priority: true,
        citizenName: true,
        citizenMobile: true,
        citizenArea: true,
        citizenDetails: true,
        contactName: true,
        contactMobile: true,
        contactDesignation: true,
        contactDepartment: true,
        partyMeetDetails: true,
        selectedStaffNames: true,
        createdAt: true,
        updatedAt: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            mobile: true,
            role: true,
          },
        },
        assignedToUser: {
          select: {
            id: true,
            name: true,
            mobile: true,
            role: true,
          },
        },
      },
    });

    if (!meeting) {
      return {
        ok: false,
        error: "Meeting not found.",
      };
    }

    return {
      ok: true,
      meeting: {
        ...meeting,
        meetingDateTime: meeting.meetingDateTime?.toISOString() ?? null,
        approvedAt: meeting.approvedAt?.toISOString() ?? null,
        rejectedAt: meeting.rejectedAt?.toISOString() ?? null,
        completedAt: meeting.completedAt?.toISOString() ?? null,
        preferredDateTime: meeting.preferredDateTime?.toISOString() ?? null,
        createdAt: meeting.createdAt.toISOString(),
        updatedAt: meeting.updatedAt.toISOString(),
      },
    };
  } catch {
    return {
      ok: false,
      error: "Unable to fetch meeting details.",
    };
  }
}
