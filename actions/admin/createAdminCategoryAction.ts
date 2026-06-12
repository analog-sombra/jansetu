"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";
import { AdminCategoryCreateResult } from "./types";

export async function createAdminCategoryAction(payload: {
  name: string;
}): Promise<AdminCategoryCreateResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  const name = payload.name.trim();
  if (name.length < 2) {
    return { ok: false, error: "Category name must be at least 2 characters." };
  }

  try {
    const category = await prisma.category.create({
      data: { name },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return {
      ok: true,
      category: {
        id: category.id,
        name: category.name,
        subcategoriesCount: 0,
        createdAt: category.createdAt.toISOString(),
      },
    };
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "Category with this name already exists." };
    }

    return { ok: false, error: "Unable to create category." };
  }
}
