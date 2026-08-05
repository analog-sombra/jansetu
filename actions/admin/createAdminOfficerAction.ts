"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";
import { AdminOfficerCreateResult } from "./types";

export async function createAdminOfficerAction(payload: {
  name: string;
  designation: string;
  email?: string;
  phone: string;
  departmentId: number;
}): Promise<AdminOfficerCreateResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  const name = payload.name.trim();
  const designation = payload.designation.trim();
  const email = payload.email ? payload.email.trim().toLowerCase() : undefined;
  const phone = payload.phone.trim();
  const departmentId = Number(payload.departmentId);

  if (name.length < 2) {
    return { ok: false, error: "Officer name must be at least 2 characters." };
  }

  if (designation.length < 2) {
    return { ok: false, error: "Designation must be at least 2 characters." };
  }

  if (email && !email.includes("@")) {
    return { ok: false, error: "Please provide a valid email." };
  }

  if (phone.length < 8) {
    return { ok: false, error: "Please provide a valid phone number." };
  }

  if (!Number.isInteger(departmentId) || departmentId <= 0) {
    return { ok: false, error: "Please select a valid department." };
  }

  try {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true },
    });

    if (!department) {
      return { ok: false, error: "Selected department no longer exists." };
    }

    const officer = await prisma.officer.create({
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
        id: officer.id,
        name: officer.name,
        designation: officer.designation,
        email: officer.email,
        phone: officer.phone,
        createdAt: officer.createdAt.toISOString(),
        department: officer.department,
      },
    };
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "Officer email already exists." };
    }

    return { ok: false, error: "Unable to create officer." };
  }
}
