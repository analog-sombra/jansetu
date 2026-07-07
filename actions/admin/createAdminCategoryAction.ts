"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";
import { AdminCategoryCreateResult } from "./types";

export async function createAdminCategoryAction(payload: {
  name: string;
  departmentId: number;
}): Promise<AdminCategoryCreateResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  const name = payload.name.trim();
  const departmentId = Number(payload.departmentId);

  if (name.length < 2) {
    return { ok: false, error: "Category name must be at least 2 characters." };
  }

  if (!Number.isInteger(departmentId) || departmentId <= 0) {
    return { ok: false, error: "Invalid department ID." };
  }

  try {
    const category = await prisma.category.create({
      data: { name, departmentId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            subcategories: true,
          },
        },
      },
    });

    return {
      ok: true,
      category: {
        id: category.id,
        name: category.name,
        subcategoriesCount: category._count.subcategories,
        createdAt: category.createdAt.toISOString(),
        department: {
          id: category.department.id,
          name: category.department.name,
        },
      },
    };
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "Category with this name already exists." };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { ok: false, error: "Department not found." };
    }

    return { ok: false, error: "Unable to create category." };
  }
}
