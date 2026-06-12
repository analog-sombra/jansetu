"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";
import { AdminDepartmentCreateResult } from "./types";

export async function createAdminDepartmentAction(payload: {
  name: string;
}): Promise<AdminDepartmentCreateResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  const name = payload.name.trim();
  if (name.length < 2) {
    return { ok: false, error: "Department name must be at least 2 characters." };
  }

  try {
    const department = await prisma.department.create({
      data: { name },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return {
      ok: true,
      department: {
        id: department.id,
        name: department.name,
        officersCount: 0,
        createdAt: department.createdAt.toISOString(),
      },
    };
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "Department with this name already exists." };
    }

    return { ok: false, error: "Unable to create department." };
  }
}
