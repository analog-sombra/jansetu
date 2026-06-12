"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";
import { AdminAuthResult } from "./types";

type AdminCategoryDeleteResult =
  | {
      ok: true;
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export async function deleteAdminCategoryAction(payload: {
  id: number;
}): Promise<AdminCategoryDeleteResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  const id = Number(payload.id);

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Invalid category ID." };
  }

  try {
    await prisma.category.delete({
      where: { id },
    });

    return { ok: true };
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { ok: false, error: "Category not found." };
    }

    return { ok: false, error: "Unable to delete category." };
  }
}
