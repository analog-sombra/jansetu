"use server";

import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";

export type UpdateAdminDepartmentResult =
  | {
      ok: true;
      department: {
        id: number;
        name: string;
        officersCount: number;
        createdAt: string;
      };
    }
  | {
      ok: false;
      error: string;
    };

export async function updateAdminDepartmentAction(payload: {
  id: number;
  name: string;
}): Promise<UpdateAdminDepartmentResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth as any;
  }

  const departmentId = Number(payload.id);
  const name = payload.name.trim();

  if (!Number.isInteger(departmentId) || departmentId <= 0) {
    return { ok: false, error: "Invalid department ID." };
  }

  if (!name || name.length < 2) {
    return { ok: false, error: "Department name must be at least 2 characters." };
  }

  if (name.length > 80) {
    return { ok: false, error: "Department name must not exceed 80 characters." };
  }

  try {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true },
    });

    if (!department) {
      return { ok: false, error: "Department not found." };
    }

    const updated = await prisma.department.update({
      where: { id: departmentId },
      data: { name },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            officers: true,
          },
        },
      },
    });

    return {
      ok: true,
      department: {
        id: updated.id,
        name: updated.name,
        officersCount: updated._count.officers,
        createdAt: updated.createdAt.toISOString(),
      },
    };
  } catch {
    return { ok: false, error: "Unable to update department." };
  }
}
