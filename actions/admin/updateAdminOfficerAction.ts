"use server";

import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";

export type UpdateAdminOfficerResult =
  | {
      ok: true;
      officer: {
        id: number;
        name: string;
        designation: string;
        email: string | null;
        phone: string;
        createdAt: string;
        department: {
          id: number;
          name: string;
        };
      };
    }
  | {
      ok: false;
      error: string;
    };

export async function updateAdminOfficerAction(payload: {
  id: number;
  name: string;
  designation: string;
  email?: string;
  phone: string;
  departmentId: number;
}): Promise<UpdateAdminOfficerResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth as any;
  }

  const officerId = Number(payload.id);
  const departmentId = Number(payload.departmentId);
  const name = payload.name.trim();
  const designation = payload.designation.trim();
  const email = payload.email ? payload.email.trim() : undefined;
  const phone = payload.phone.trim();

  if (!Number.isInteger(officerId) || officerId <= 0) {
    return { ok: false, error: "Invalid officer ID." };
  }

  if (!Number.isInteger(departmentId) || departmentId <= 0) {
    return { ok: false, error: "Invalid department ID." };
  }

  if (!name || name.length < 2) {
    return { ok: false, error: "Officer name must be at least 2 characters." };
  }

  if (name.length > 80) {
    return { ok: false, error: "Officer name must not exceed 80 characters." };
  }

  if (!designation || designation.length < 2) {
    return { ok: false, error: "Designation must be at least 2 characters." };
  }

  if (designation.length > 80) {
    return { ok: false, error: "Designation must not exceed 80 characters." };
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email." };
  }

  if (email && email.length > 120) {
    return { ok: false, error: "Email must not exceed 120 characters." };
  }

  if (!phone || phone.length < 8) {
    return { ok: false, error: "Phone must be at least 8 characters." };
  }

  if (phone.length > 20) {
    return { ok: false, error: "Phone must not exceed 20 characters." };
  }

  try {
    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
      select: { id: true },
    });

    if (!officer) {
      return { ok: false, error: "Officer not found." };
    }

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true },
    });

    if (!department) {
      return { ok: false, error: "Department not found." };
    }

    const updated = await prisma.officer.update({
      where: { id: officerId },
      data: {
        name,
        designation,
        email,
        phone,
        departmentId,
      },
      select: {
        id: true,
        name: true,
        designation: true,
        email: true,
        phone: true,
        createdAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      ok: true,
      officer: {
        id: updated.id,
        name: updated.name,
        designation: updated.designation,
        email: updated.email,
        phone: updated.phone,
        createdAt: updated.createdAt.toISOString(),
        department: {
          id: updated.department.id,
          name: updated.department.name,
        },
      },
    };
  } catch {
    return { ok: false, error: "Unable to update officer." };
  }
}
