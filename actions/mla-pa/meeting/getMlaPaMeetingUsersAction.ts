"use server";

import prisma from "@/lib/prisma";
import { requireMlaPaMeetingUser } from "./_shared";
import { MlaPaMeetingUsersResult } from "./types";

export async function getMlaPaMeetingUsersAction(): Promise<MlaPaMeetingUsersResult> {
  const auth = await requireMlaPaMeetingUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    const [mlaUsers, campHeadUsers] = await Promise.all([
      prisma.user.findMany({
        where: { role: "MLA" },
        orderBy: [{ name: "asc" }],
        select: {
          id: true,
          name: true,
          mobile: true,
          role: true,
        },
      }),
      prisma.user.findMany({
        where: { role: "CAMP_HEAD" },
        orderBy: [{ name: "asc" }],
        select: {
          id: true,
          name: true,
          mobile: true,
          role: true,
        },
      }),
    ]);

    return {
      ok: true,
      mlaUsers,
      campHeadUsers,
    };
  } catch {
    return { ok: false, error: "Unable to load meeting users." };
  }
}
