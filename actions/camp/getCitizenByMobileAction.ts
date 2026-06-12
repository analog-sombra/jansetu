"use server";

import prisma from "@/lib/prisma";
import { requireCampUser } from "./_shared";
import { GetCitizenByMobileResult } from "./types";

export async function getCitizenByMobileAction(
  mobileInput: string,
): Promise<GetCitizenByMobileResult> {
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

  const existingUser = await prisma.user.findUnique({
    where: { mobile },
    select: {
      id: true,
      role: true,
      name: true,
      mobile: true,
      address: true,
      aadhaar: true,
      voterId: true,
    },
  });

  if (!existingUser) {
    return { ok: true, found: false };
  }

  if (existingUser.role !== "CITIZEN") {
    return {
      ok: false,
      error:
        "This mobile number belongs to a staff account and cannot be used for citizen complaint creation.",
    };
  }

  return {
    ok: true,
    found: true,
    user: {
      id: existingUser.id,
      name: existingUser.name ?? "",
      mobile: existingUser.mobile,
      address: existingUser.address ?? "",
      aadhaar: existingUser.aadhaar ?? "",
      voterId: existingUser.voterId ?? "",
    },
  };
}
