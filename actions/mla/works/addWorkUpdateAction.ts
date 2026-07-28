"use server";

import prisma from "@/lib/prisma";
import { requireWorksManagerUser, checkWorkAccess } from "./_shared";
import { ActionResult, WorkUpdateDTO } from "./types";

export async function addWorkUpdateAction(payload: {
  work_id: number;
  message: string;
}): Promise<ActionResult<WorkUpdateDTO>> {
  const auth = await requireWorksManagerUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    const { work_id, message } = payload;

    if (!message || message.trim().length === 0) {
      return { ok: false, error: "Message cannot be empty" };
    }

    if (message.length > 500) {
      return { ok: false, error: "Message must not exceed 500 characters" };
    }

    const work = await prisma.work.findUnique({
      where: { id: work_id },
      include: { created_by_user: true },
    });

    if (!work) {
      return { ok: false, error: "Work not found" };
    }

    if (!checkWorkAccess(work, auth.user)) {
      return { ok: false, error: "You don't have access to this work" };
    }

    const update = await prisma.work_update.create({
      data: {
        work_id,
        message: message.trim(),
        created_by_user_id: auth.user.id,
      },
    });

    return {
      ok: true,
      data: {
        id: update.id,
        message: update.message,
        created_by: auth.user.name || "Unknown",
        created_at: update.createdAt,
      },
    };
  } catch (err) {
    console.error("Error adding work update:", err);
    return { ok: false, error: "Failed to add work update" };
  }
}
