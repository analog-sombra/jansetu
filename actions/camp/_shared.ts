import { UserRole } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import { CampCitizenInput, CampComplaintInput } from "./types";

export function isCampRole(role: UserRole): boolean {
  return role === "CAMP_DEO" || role === "CAMP_FIELD_OFFICER";
}

export async function requireCampUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, error: "Please login again to continue." } as const;
  }

  if (!isCampRole(user.role)) {
    return {
      ok: false,
      error: "You are not authorized for this section.",
    } as const;
  }

  return { ok: true, user } as const;
}

export function validateCitizenInput(citizen: CampCitizenInput): string | null {
  const mobile = citizen.mobile.trim();
  const aadhaar = citizen.aadhaar?.trim() || "";

  if (!/^\d{10}$/.test(mobile)) {
    return "Please enter a valid 10-digit mobile number.";
  }

  if (aadhaar && !/^\d{12}$/.test(aadhaar)) {
    return "Aadhaar must be exactly 12 digits.";
  }

  return null;
}

export async function validateComplaintInput(complaint: CampComplaintInput): Promise<string | null> {
  const category = complaint.category.trim();
  const subcategory = complaint.subcategory.trim();
  const description = complaint.description.trim();
  const affectedCitizensCount = Number(complaint.affectedCitizensCount);
  const lat = Number(complaint.lat);
  const lng = Number(complaint.lng);

  // Validate category exists in database
  const categoryRecord = await prisma.category.findFirst({
    where: { name: category },
    select: { id: true },
  });

  if (!categoryRecord) {
    return "Please select a valid complaint category.";
  }

  // Validate subcategory exists and belongs to the category
  const subcategoryRecord = await prisma.subcategory.findFirst({
    where: {
      name: subcategory,
      categoryId: categoryRecord.id,
    },
  });

  if (!subcategoryRecord) {
    return "Please select a valid sub-category.";
  }

  if (description.length < 20) {
    return "Description must be at least 20 characters.";
  }

  if (!Number.isInteger(affectedCitizensCount) || affectedCitizensCount <= 0) {
    return "Affected citizens count must be a positive number.";
  }

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return "Please provide a valid latitude.";
  }

  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return "Please provide a valid longitude.";
  }

  return null;
}
