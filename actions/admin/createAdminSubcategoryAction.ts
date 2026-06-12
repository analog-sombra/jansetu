"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";
import { AdminSubcategoryCreateResult } from "./types";

export async function createAdminSubcategoryAction(payload: {
  name: string;
  categoryId: number;
}): Promise<AdminSubcategoryCreateResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  const name = payload.name.trim();
  const categoryId = Number(payload.categoryId);

  if (name.length < 2) {
    return { ok: false, error: "Subcategory name must be at least 2 characters." };
  }

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return { ok: false, error: "Please select a valid category." };
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      return { ok: false, error: "Selected category no longer exists." };
    }

    const subcategory = await prisma.subcategory.create({
      data: {
        name,
        categoryId,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      ok: true,
      subcategory: {
        id: subcategory.id,
        name: subcategory.name,
        createdAt: subcategory.createdAt.toISOString(),
        category: subcategory.category,
      },
    };
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "Subcategory with this name already exists in this category." };
    }

    return { ok: false, error: "Unable to create subcategory." };
  }
}
