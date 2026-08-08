"use server";

import prisma from "@/lib/prisma";
import { requireCampUser } from "./_shared";
import { GetCitizenComplaintsByMobileResult } from "./types";

export async function getCitizenComplaintsByMobileAction(
  mobileInput: string,
): Promise<GetCitizenComplaintsByMobileResult> {
  const auth = await requireCampUser();
  if (!auth.ok) {
    return auth;
  }

  const mobile = mobileInput.trim();

  if (!/^\d{10}$/.test(mobile)) {
    return {
      ok: false,
      error: "Please enter a valid 10-digit mobile number.",
    };
  }

  const citizen = await prisma.user.findUnique({
    where: { mobile },
    select: {
      id: true,
      role: true,
    },
  });

  if (!citizen || citizen.role !== "CITIZEN") {
    return {
      ok: true,
      found: false,
      complaints: [],
    };
  }

  const complaints = await prisma.complaint.findMany({
    where: { userId: citizen.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      sublocality: {
        select: {
          name: true,
          locality: {
            select: { name: true },
          },
        },
      },
      createdAt: true,
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
  });

  return {
    ok: true,
    found: true,
    complaints: complaints.map((item) => ({
      id: item.id,
      category: item.category.name,
      subcategory: item.subcategory?.name ?? null,
      status: item.status,
      locality: item.sublocality?.locality?.name ?? null,
      sublocality: item.sublocality?.name ?? null,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}
