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
        sublocality: {
          select: {
            name: true,
            locality: {
              select: {
                name: true,
              },
            },
          },
        },
        affectedCitizensCount: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            mobile: true,
          },
        },
        assignments: {
          orderBy: { createdAt: "desc" },
          select: {
            officer: {
              select: {
                name: true,
                department: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      ok: true,
      complaints: complaints.map((complaint) => {
        const officerNames = Array.from(
          new Set(complaint.assignments.map((assignment) => assignment.officer.name)),
        );
        const departmentNames = Array.from(
          new Set(
            complaint.assignments.map(
              (assignment) => assignment.officer.department.name,
            ),
          ),
        );

        return {
          id: complaint.id,
          citizenName: complaint.user.name ?? "Citizen",
          citizenMobile: complaint.user.mobile,
          departmentName: departmentNames[0] ?? null,
          officerNames,
          category: complaint.category.name,
          subcategory: complaint.subcategory.name,
          status: complaint.status,
          locality: complaint.sublocality?.locality?.name ?? null,
          sublocality: complaint.sublocality?.name ?? null,
          affectedCitizensCount: complaint.affectedCitizensCount,
          createdAt: complaint.createdAt.toISOString(),
        };
      }),
    };
  } catch {
    return {
      ok: false,
      error: "Unable to fetch complaints.",
    };
  }
}
