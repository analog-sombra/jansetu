"use server";

import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";
import { AdminCategorySubcategoryDirectoryResult } from "./types";

export async function getAdminCategorySubcategoryDirectoryAction(): Promise<AdminCategorySubcategoryDirectoryResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    const [categories, subcategories] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: {
            select: {
              subcategories: true,
            },
          },
        },
      }),
      prisma.subcategory.findMany({
        orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
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
      }),
    ]);

    return {
      ok: true,
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        subcategoriesCount: category._count.subcategories,
        createdAt: category.createdAt.toISOString(),
      })),
      subcategories: subcategories.map((subcategory) => ({
        id: subcategory.id,
        name: subcategory.name,
        createdAt: subcategory.createdAt.toISOString(),
        category: subcategory.category,
      })),
    };
  } catch {
    return { ok: false, error: "Unable to load category and subcategory data." };
  }
}
