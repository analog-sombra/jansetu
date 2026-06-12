"use server";

import prisma from "@/lib/prisma";

export type CategoryWithSubcategories = {
  id: number;
  name: string;
  subcategories: Array<{
    id: number;
    name: string;
  }>;
};

export type GetCategoriesResult = {
  ok: true;
  categories: CategoryWithSubcategories[];
};

export async function getCategoriesWithSubcategoriesAction(): Promise<GetCategoriesResult> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        subcategories: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      ok: true,
      categories,
    };
  } catch {
    // Return empty array if database error
    return {
      ok: true,
      categories: [],
    };
  }
}
