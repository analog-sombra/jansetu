"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";
import { AdminAuthResult } from "./types";

type AdminSubcategoryDeleteResult =
  | {
      ok: true;
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export async function deleteAdminSubcategoryAction(payload: {
  id: number;
}): Promise<AdminSubcategoryDeleteResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  const id = Number(payload.id);

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Invalid subcategory ID." };
  }

  try {
    await prisma.subcategory.delete({
      where: { id },
    });

    return { ok: true };
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { ok: false, error: "Subcategory not found." };
    }

    return { ok: false, error: "Unable to delete subcategory." };
  }
}
