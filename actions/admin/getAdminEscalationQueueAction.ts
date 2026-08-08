"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isAdminRole } from "./_shared";
import { isMlaPaRouteRole } from "@/actions/mla-pa/_shared";
import {
  AdminEscalationQueueResult,
  AdminEscalationRecord,
  AdminEscalationStatus,
} from "./types";

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

const OPEN_ASSIGNMENT_STATUSES: AdminEscalationStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "QUERY",
  "ESCALATED",
];

export async function getAdminEscalationQueueAction(): Promise<AdminEscalationQueueResult> {
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

    const assignments = await prisma.assignment.findMany({
      where: {
        status: { in: OPEN_ASSIGNMENT_STATUSES },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        complaint: {
          select: {
            id: true,
            sublocality: {
              select: {
                name: true,
              },
            },
            category: {
              select: {
                name: true,
              },
            },
            subcategory: {
              select: {
                name: true,
              },
            },
          },
        },
        officer: {
          select: {
            name: true,
            phone: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const escalations: AdminEscalationRecord[] = assignments
      .map<AdminEscalationRecord | null>((assignment) => {
        const createdAtTs = assignment.createdAt.getTime();
        const ageMs = Math.max(0, nowTs - createdAtTs);
        const ageHours = Math.floor(ageMs / (60 * 60 * 1000));

        const isReminder48h = ageMs >= FORTY_EIGHT_HOURS_MS;
        const isPastDue = assignment.dueDate.getTime() <= nowTs;

        if (!isReminder48h && !isPastDue) {
          return null;
        }

        return {
          id: assignment.id,
          complaintId: assignment.complaint.id,
          sublocality: assignment.complaint.sublocality?.name ?? "-",
          category: assignment.complaint.category.name,
          subcategory: assignment.complaint.subcategory?.name ?? null,
          officer: assignment.officer.name,
          officerMobile: assignment.officer.phone,
          department: assignment.officer.department.name,
          ageHours,
          status: assignment.status as AdminEscalationStatus,
          trigger: isPastDue ? "ESCALATION_7D" : "REMINDER_48H",
          lastActionAt: assignment.updatedAt.toISOString(),
        };
      })
      .filter((row): row is AdminEscalationRecord => row !== null)
      .sort((a, b) => b.ageHours - a.ageHours);

    return {
      ok: true,
      escalations,
    };
  } catch {
    return {
      ok: false,
      error: "Unable to fetch escalation queue.",
    };
  }
}
