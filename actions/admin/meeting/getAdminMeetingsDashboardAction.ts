"use server";

import prisma from "@/lib/prisma";
import { requireAdminUser } from "../_shared";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { AdminMeetingsDashboardResult } from "./types";

export async function getAdminMeetingsDashboardAction(): Promise<AdminMeetingsDashboardResult> {
  // Allow both admin users and MLA-PA users to access this
  const adminAuth = await requireAdminUser();
  let user = adminAuth.ok ? adminAuth.user : null;

  if (!user) {
    // If not admin, check if MLA_PA user
    const currentUser = await getAuthenticatedUser();
    if (
      !currentUser ||
      (currentUser.role !== "CAMP_HEAD")
    ) {
      return {
        ok: false,
        error: "You are not authorized for this section.",
      };
    }
    user = currentUser;
  }

  try {
    const meetings = await prisma.meeting.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdByUserId: true,
        assignedToUserId: true,
        campHeadUserId: true,
        type: true,
        invitationSubtype: true,
        giftToCarry: true,
        selfDraftedLetter: true,
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
        campHeadUser: {
          select: {
            id: true,
            name: true,
            mobile: true,
            role: true,
          },
        },
      },
    });

    return {
      ok: true,
      meetings: meetings.map((meeting) => ({
        ...meeting,
        meetingDateTime: meeting.meetingDateTime?.toISOString() ?? null,
        approvedAt: meeting.approvedAt?.toISOString() ?? null,
        rejectedAt: meeting.rejectedAt?.toISOString() ?? null,
        completedAt: meeting.completedAt?.toISOString() ?? null,
        preferredDateTime: meeting.preferredDateTime?.toISOString() ?? null,
        createdAt: meeting.createdAt.toISOString(),
        updatedAt: meeting.updatedAt.toISOString(),
        campHeadUser: meeting.campHeadUser ?? undefined,
      })),
    };
  } catch (error) {
    console.error(
      "[getAdminMeetingsDashboardAction] Error fetching meetings:",
      error,
    );
    return {
      ok: false,
      error:
        "Unable to fetch meetings. Please ensure database migrations are up to date.",
    };
  }
}
