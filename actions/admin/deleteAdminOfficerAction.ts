"use server";

import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";
import { AdminAuthResult } from "./types";

type AdminOfficerDeleteResult =
  | {
      ok: true;
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export async function deleteAdminOfficerAction(payload: {
  id: number;
}): Promise<AdminOfficerDeleteResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  const officerId = Number(payload.id);

  if (!Number.isInteger(officerId) || officerId <= 0) {
    return { ok: false, error: "Invalid officer ID." };
  }

  try {
    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
      select: {
        id: true,
        department: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!officer) {
      return { ok: false, error: "Officer not found." };
    }

    await prisma.officer.delete({
      where: { id: officerId },
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to delete officer." };
  }
}
