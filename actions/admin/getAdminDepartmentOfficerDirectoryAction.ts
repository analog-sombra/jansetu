"use server";

import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";
import { AdminDepartmentOfficerDirectoryResult } from "./types";

export async function getAdminDepartmentOfficerDirectoryAction(): Promise<AdminDepartmentOfficerDirectoryResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    const [departments, officers] = await Promise.all([
      prisma.department.findMany({
        orderBy: { name: "asc" },
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
      }),
      prisma.officer.findMany({
        orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
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
      }),
    ]);

    return {
      ok: true,
      departments: departments.map((department) => ({
        id: department.id,
        name: department.name,
        officersCount: department._count.officers,
        createdAt: department.createdAt.toISOString(),
      })),
      officers: officers.map((officer) => ({
        id: officer.id,
        name: officer.name,
        designation: officer.designation,
        email: officer.email,
        phone: officer.phone,
        createdAt: officer.createdAt.toISOString(),
        department: officer.department,
      })),
    };
  } catch {
    return { ok: false, error: "Unable to load department and officer data." };
  }
}
