"use server";

import prisma from "@/lib/prisma";
import { requireAdminUser } from "../_shared";
import { AdminMeetingAssigneesResult } from "./types";

export async function getAdminMeetingAssigneesAction(): Promise<AdminMeetingAssigneesResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        mobile: true,
        role: true,
      },
    });

    return {
      ok: true,
      assignees: users,
    };
  } catch {
    return { ok: false, error: "Unable to load assignees." };
  }
}
