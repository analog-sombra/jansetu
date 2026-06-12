"use server";

import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";
import { AdminComplaintsDashboardResult } from "./types";

export async function getAdminComplaintsDashboardAction(): Promise<AdminComplaintsDashboardResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        category: true,
        subcategory: true,
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
        category: complaint.category,
        subcategory: complaint.subcategory,
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
