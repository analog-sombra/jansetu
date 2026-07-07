"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isAdminRole } from "./_shared";
import { isMlaPaRouteRole } from "@/actions/mla-pa/_shared";
import { AdminComplaintsDashboardResult } from "./types";

export async function getAdminComplaintsDashboardAction(): Promise<AdminComplaintsDashboardResult> {
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
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
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
        status: true,
        area: true,
        affectedCitizensCount: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            mobile: true,
          },
        },
      },
    });

    return {
      ok: true,
      complaints: complaints.map((complaint) => ({
        id: complaint.id,
        citizenName: complaint.user.name ?? "Citizen",
        citizenMobile: complaint.user.mobile,
        category: complaint.category.name,
        subcategory: complaint.subcategory.name,
        status: complaint.status,
        area: complaint.area ?? "",
        affectedCitizensCount: complaint.affectedCitizensCount,
        createdAt: complaint.createdAt.toISOString(),
      })),
    };
  } catch {
    return {
      ok: false,
      error: "Unable to fetch complaints.",
    };
  }
}
