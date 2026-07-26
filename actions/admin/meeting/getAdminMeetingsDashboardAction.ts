"use server";

import prisma from "@/lib/prisma";
import { requireAdminUser } from "../_shared";
import { AdminMeetingsDashboardResult } from "./types";

export async function getAdminMeetingsDashboardAction(): Promise<AdminMeetingsDashboardResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    const meetings = await prisma.meeting.findMany({
      orderBy: { createdAt: "desc" },
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
      })),
    };
  } catch {
    return {
      ok: false,
      error: "Unable to fetch meetings.",
    };
  }
}
