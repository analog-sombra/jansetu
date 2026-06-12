"use server";

import prisma from "@/lib/prisma";
import { requireCampUser } from "./_shared";
import { CampUsersListResult } from "./types";

export async function getCampUsersAction(): Promise<CampUsersListResult> {
  const auth = await requireCampUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        role: "CITIZEN",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        role: true,
        name: true,
        mobile: true,
        address: true,
        aadhaar: true,
        voterId: true,
        _count: {
          select: {
            complaints: true,
          },
        },
        complaints: {
          select: {
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    return {
      ok: true,
      users: users.map((user) => ({
        id: user.id,
        role: user.role,
        name: user.name,
        mobile: user.mobile,
        address: user.address,
        aadhaar: user.aadhaar,
        voterId: user.voterId,
        complaintCount: user._count.complaints,
        lastComplaintAt: user.complaints[0]?.createdAt.toISOString() ?? null,
      })),
    };
  } catch {
    return {
      ok: false,
      error: "Unable to fetch users.",
    };
  }
}
