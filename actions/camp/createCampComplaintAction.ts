"use server";

import prisma from "@/lib/prisma";
import {
  requireCampUser,
  validateCitizenInput,
  validateComplaintInput,
} from "./_shared";
import { CampCreateComplaintInput, CreateCampComplaintResult } from "./types";

export async function createCampComplaintAction(
  payload: CampCreateComplaintInput,
): Promise<CreateCampComplaintResult> {
  const auth = await requireCampUser();
  if (!auth.ok) {
    return auth;
  }

  const citizenError = validateCitizenInput(payload.citizen);
  if (citizenError) {
    return { ok: false, error: citizenError };
  }

  const complaintError = await validateComplaintInput(payload.complaint);
  if (complaintError) {
    return { ok: false, error: complaintError };
  }

  const citizenMobile = payload.citizen.mobile.trim();
  const citizenName = payload.citizen.name.trim();
  const citizenAddress = payload.citizen.address.trim();
  const citizenAadhaar = payload.citizen.aadhaar?.trim() || null;
  const citizenVoterId = payload.citizen.voterId.trim();

  const category = payload.complaint.category.trim();
  const subcategory = payload.complaint.subcategory.trim();
  const description = payload.complaint.description.trim();
  const area = payload.complaint.area?.trim() || null;
  const lat = Number(payload.complaint.lat);
  const lng = Number(payload.complaint.lng);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { mobile: citizenMobile },
        select: {
          id: true,
          role: true,
          name: true,
          address: true,
          aadhaar: true,
          voterId: true,
        },
      });

      if (existingUser && existingUser.role !== "CITIZEN") {
        throw new Error(
          "This mobile number belongs to a staff account and cannot be used for citizen complaint creation.",
        );
      }

      const citizen = existingUser
        ? await tx.user.update({
            where: { id: existingUser.id },
            data: {
              name: citizenName || existingUser.name,
              address: citizenAddress || existingUser.address,
              aadhaar: citizenAadhaar ?? existingUser.aadhaar,
              voterId: citizenVoterId || existingUser.voterId,
            },
            select: { id: true },
          })
        : await tx.user.create({
            data: {
              mobile: citizenMobile,
              role: "CITIZEN",
              name: citizenName || null,
              address: citizenAddress || null,
              aadhaar: citizenAadhaar,
              voterId: citizenVoterId || null,
            },
            select: { id: true },
          });

      const complaint = await tx.complaint.create({
        data: {
          userId: citizen.id,
          createdByUserId: auth.user.id,
          category,
          subcategory,
          description,
          area,
          lat,
          lng,
        },
        select: { id: true },
      });

      return {
        complaintId: complaint.id,
        userId: citizen.id,
        createdNewUser: !existingUser,
      };
    });

    return {
      ok: true,
      complaintId: result.complaintId,
      userId: result.userId,
      createdNewUser: result.createdNewUser,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { ok: false, error: error.message };
    }

    return {
      ok: false,
      error: "Could not submit complaint. Please try again.",
    };
  }
}
