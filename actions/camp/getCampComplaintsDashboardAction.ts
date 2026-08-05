"use server";

import prisma from "@/lib/prisma";
import { requireCampUser } from "./_shared";
import { CampComplaintsDashboardResult } from "./types";

export async function getCampComplaintsDashboardAction(): Promise<CampComplaintsDashboardResult> {
  const auth = await requireCampUser();
  if (!auth.ok) {
    return auth;
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
        affectedCitizensCount: true,
        status: true,
        area: true,
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
        affectedCitizensCount: complaint.affectedCitizensCount,
        status: complaint.status,
        area: complaint.area ?? "",
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
