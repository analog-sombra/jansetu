"use server";

import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";
import { AdminAuthResult } from "./types";

type AdminDepartmentDeleteResult =
  | {
      ok: true;
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export async function deleteAdminDepartmentAction(payload: {
  id: number;
}): Promise<AdminDepartmentDeleteResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  const departmentId = Number(payload.id);

  if (!Number.isInteger(departmentId) || departmentId <= 0) {
    return { ok: false, error: "Invalid department ID." };
  }

  try {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: {
        _count: {
          select: {
            officers: true,
          },
        },
      },
    });

    if (!department) {
      return { ok: false, error: "Department not found." };
    }

    if (department._count.officers > 0) {
      return {
        ok: false,
        error: "Cannot delete department with existing officers. Please reassign or delete officers first.",
      };
    }

    await prisma.department.delete({
      where: { id: departmentId },
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to delete department." };
  }
}
