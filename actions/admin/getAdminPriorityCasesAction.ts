"use server";

import { COMPLAINTSTATUS } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isAdminRole } from "./_shared";
import { isMlaPaRouteRole } from "@/actions/mla-pa/_shared";
import { AdminPriorityCasesResult } from "./types";

const EXCLUDED_STATUSES: COMPLAINTSTATUS[] = [
  "RESOLVED",
  "CLOSED",
  "REJECTED",
  "AUTO_CLOSED",
];

export async function getAdminPriorityCasesAction(): Promise<AdminPriorityCasesResult> {
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
    const complaints = await prisma.complaint.findMany({
      where: {
        status: {
          notIn: EXCLUDED_STATUSES,
        },
      },
      select: {
        id: true,
        area: true,
        status: true,
        createdAt: true,
        priority: true,
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
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 10,
    });

    return {
      ok: true,
      cases: complaints.map((complaint) => ({
        id: complaint.id,
        area: complaint.area?.trim() || "-",
        category: complaint.category.name,
        subcategory: complaint.subcategory?.name ?? null,
        status: complaint.status,
        priority: complaint.priority,
        createdAt: complaint.createdAt.toISOString(),
      })),
    };
  } catch {
    return {
      ok: false,
      error: "Unable to load priority cases.",
    };
  }
}
