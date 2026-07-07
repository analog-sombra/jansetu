"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

type CompleteProfileActionInput = {
  name: string;
  address: string;
  aadhaar?: string;
  voterId?: string;
};

type CompleteProfileActionResult = {
  ok: boolean;
  error?: string;
};

type UpdateProfileActionInput = {
  name: string;
  address: string;
  aadhaar?: string;
  voterId?: string;
};

export async function completeProfileAction(
  profile: CompleteProfileActionInput,
): Promise<CompleteProfileActionResult> {
  const user = await getAuthenticatedUser();
  const name = profile.name.trim();
  const address = profile.address.trim();
  const voterId = profile.voterId?.trim() || null;
  const aadhaar = profile.aadhaar?.trim() || null;

  if (!user) {
    return { ok: false, error: "Please login again to continue." };
  }

  if (name.length < 3) {
    return { ok: false, error: "Name must be at least 3 characters." };
  }

  if (address.length < 10) {
    return { ok: false, error: "Address must be at least 10 characters." };
  }

  if (aadhaar && !/^\d{12}$/.test(aadhaar)) {
    return { ok: false, error: "Aadhaar must be exactly 12 digits." };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        address,
        aadhaar,
        voterId,
        firstLoginComplete: true,
      },
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to complete profile. Please try again." };
  }
}

export async function updateProfileAction(
  profile: UpdateProfileActionInput,
): Promise<CompleteProfileActionResult> {
  const user = await getAuthenticatedUser();
  const name = profile.name.trim();
  const address = profile.address.trim();
  const voterId = profile.voterId?.trim() || null;
  const aadhaar = profile.aadhaar?.trim() || null;

  if (!user) {
    return { ok: false, error: "Please login again to continue." };
  }

  if (name.length < 3) {
    return { ok: false, error: "Name must be at least 3 characters." };
  }

  if (address.length < 10) {
    return { ok: false, error: "Address must be at least 10 characters." };
  }

  if (aadhaar && !/^\d{12}$/.test(aadhaar)) {
    return { ok: false, error: "Aadhaar must be exactly 12 digits." };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        address,
        aadhaar,
        voterId,
      },
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to update profile. Please try again." };
  }
}
