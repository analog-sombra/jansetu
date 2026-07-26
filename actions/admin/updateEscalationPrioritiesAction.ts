"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isAdminRole } from "./_shared";
import { isMlaPaRouteRole } from "@/actions/mla-pa/_shared";
import {
  AdminEscalationStatus,
  UpdateEscalationPrioritiesResult,
} from "./types";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const PRIORITY_BUMP_PER_DAY = 5;
const DAILY_PRIORITY_AUDIT_ACTION = "ESCALATION_PRIORITY_DAILY_BUMP";

const OPEN_ASSIGNMENT_STATUSES: AdminEscalationStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "QUERY",
  "ESCALATED",
];

export async function updateEscalationPrioritiesAction(): Promise<UpdateEscalationPrioritiesResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, error: "Please login again to continue." } as const;
  }

  const isAuthorized = isAdminRole(user.role) || isMlaPaRouteRole(user.role);

  if (!isAuthorized) {
    return {
      ok: false,
      error: "You are not authorized for this section.",
    } as const;
  }

  try {
    const nowTs = Date.now();
    const startOfTodayUtc = new Date();
    startOfTodayUtc.setUTCHours(0, 0, 0, 0);

    const assignments = await prisma.assignment.findMany({
      where: {
        status: { in: OPEN_ASSIGNMENT_STATUSES },
      },
      select: {
        complaintId: true,
        createdAt: true,
      },
    });

    const incrementByComplaint = new Map<number, number>();

    for (const assignment of assignments) {
      const ageDays = Math.floor(
        Math.max(0, nowTs - assignment.createdAt.getTime()) / ONE_DAY_MS,
      );

      const increment = ageDays * PRIORITY_BUMP_PER_DAY;
      if (increment <= 0) {
        continue;
      }

      const current = incrementByComplaint.get(assignment.complaintId) ?? 0;
      incrementByComplaint.set(
        assignment.complaintId,
        Math.max(current, increment),
      );
    }

    if (incrementByComplaint.size === 0) {
      return {
        ok: true,
        updatedComplaints: 0,
        totalPriorityAdded: 0,
        skippedComplaints: 0,
      };
    }

    const complaintIds = Array.from(incrementByComplaint.keys());
    const alreadyUpdatedToday = await prisma.audit_log.findMany({
      where: {
        action: DAILY_PRIORITY_AUDIT_ACTION,
        complaintId: { in: complaintIds },
        createdAt: { gte: startOfTodayUtc },
      },
      select: {
        complaintId: true,
      },
    });

    const alreadyUpdatedComplaintIds = new Set(
      alreadyUpdatedToday
        .map((entry) => entry.complaintId)
        .filter((id): id is number => id !== null),
    );

    const updatesToApply = complaintIds
      .filter((complaintId) => !alreadyUpdatedComplaintIds.has(complaintId))
      .map((complaintId) => ({
        complaintId,
        increment: incrementByComplaint.get(complaintId) ?? 0,
      }))
      .filter((entry) => entry.increment > 0);

    if (updatesToApply.length === 0) {
      return {
        ok: true,
        updatedComplaints: 0,
        totalPriorityAdded: 0,
        skippedComplaints: complaintIds.length,
      };
    }

    await prisma.$transaction(
      updatesToApply.flatMap(({ complaintId, increment }) => [
        prisma.complaint.update({
          where: { id: complaintId },
          data: {
            priority: {
              increment,
            },
          },
        }),
        prisma.audit_log.create({
          data: {
            actorUserId: user.id,
            complaintId,
            action: DAILY_PRIORITY_AUDIT_ACTION,
            meta: {
              increment,
              perDay: PRIORITY_BUMP_PER_DAY,
            },
          },
        }),
      ]),
    );

    const totalPriorityAdded = updatesToApply.reduce(
      (sum, entry) => sum + entry.increment,
      0,
    );

    return {
      ok: true,
      updatedComplaints: updatesToApply.length,
      totalPriorityAdded,
      skippedComplaints: complaintIds.length - updatesToApply.length,
    };
  } catch {
    return {
      ok: false,
      error: "Unable to update escalation priorities.",
    };
  }
}
