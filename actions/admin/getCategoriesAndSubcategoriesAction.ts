"use server";

import prisma from "@/lib/prisma";

export type CategoryData = {
  id: number;
  name: string;
};

export type SubcategoryData = {
  id: number;
  name: string;
  categoryId: number;
};

export type CategoriesAndSubcategoriesResult =
  | {
      ok: true;
      categories: CategoryData[];
      subcategories: SubcategoryData[];
    }
  | {
      ok: false;
      error: string;
    };

export async function getCategoriesAndSubcategoriesAction(): Promise<CategoriesAndSubcategoriesResult> {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const subcategories = await prisma.subcategory.findMany({
      select: {
        id: true,
        name: true,
        categoryId: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      ok: true,
      categories,
      subcategories,
    };
  } catch {
    return {
      ok: false,
      error: "Unable to load categories and subcategories.",
    };
  }
}
