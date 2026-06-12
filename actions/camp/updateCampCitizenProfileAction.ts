"use server";

import prisma from "@/lib/prisma";
import { requireCampUser } from "./_shared";
import { UpdateCampCitizenProfileInput, UpdateCampCitizenProfileResult } from "./types";

export async function updateCampCitizenProfileAction(
  payload: UpdateCampCitizenProfileInput,
): Promise<UpdateCampCitizenProfileResult> {
  const auth = await requireCampUser();
  if (!auth.ok) {
    return auth;
  }

  const name = payload.name.trim();
  const address = payload.address.trim();
  const voterId = payload.voterId.trim();
  const aadhaar = payload.aadhaar?.trim() || "";

  if (!payload.userId.trim()) {
    return { ok: false, error: "Invalid citizen selected." };
  }

  if (name.length < 3) {
    return { ok: false, error: "Name must be at least 3 characters." };
  }

  if (address.length < 10) {
    return { ok: false, error: "Address must be at least 10 characters." };
  }

  if (voterId.length < 3) {
    return { ok: false, error: "Voter ID must be at least 3 characters." };
  }

  if (aadhaar && !/^\d{12}$/.test(aadhaar)) {
    return { ok: false, error: "Aadhaar must be exactly 12 digits." };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!existingUser) {
      return { ok: false, error: "Citizen not found." };
    }

    if (existingUser.role !== "CITIZEN") {
      return {
        ok: false,
        error: "Only citizen profiles can be edited from this section.",
      };
    }

    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        address,
        aadhaar: aadhaar || null,
        voterId,
      },
    });

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Unable to update citizen profile.",
    };
  }
}
