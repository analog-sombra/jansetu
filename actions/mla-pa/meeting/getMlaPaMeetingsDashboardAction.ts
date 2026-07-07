"use server";

import prisma from "@/lib/prisma";
import { mapMeetingRecord, requireMlaPaMeetingUser } from "./_shared";
import { GetMlaPaMeetingsResult } from "./types";

export async function getMlaPaMeetingsDashboardAction(): Promise<GetMlaPaMeetingsResult> {
  const auth = await requireMlaPaMeetingUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    const meetings = await prisma.mlaPaMeeting.findMany({
      where:
        auth.user.role === "CAMP_HEAD"
          ? {
              campHeadUserId: auth.user.id,
            }
          : undefined,
      orderBy: { scheduledAt: "asc" },
      include: {
        invitationDetail: {
          select: {
            giftToCarry: true,
            selfDraftedLetter: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            mobile: true,
            role: true,
          },
        },
        mlaUser: {
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
      meetings: meetings.map(mapMeetingRecord),
    };
  } catch {
    return { ok: false, error: "Unable to fetch meetings." };
  }
}
