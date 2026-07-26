"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isAdminRole } from "./_shared";
import { isMlaPaRouteRole } from "@/actions/mla-pa/_shared";
import { UpdateAdminComplaintPriorityResult } from "./types";

const PRIORITY_INCREMENT = 40;

export async function updateAdminComplaintPriorityAction(
  complaintIdInput: number,
): Promise<UpdateAdminComplaintPriorityResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, error: "Please login again to continue." } as const;
  }

  const isAuthorized = isAdminRole(user.role) || isMlaPaRouteRole(user.role);

  if (!isAuthorized) {
    return {
      ok: false,
      error: "You are not authorized for this section.",
    } as const;
  }

  const complaintId = Number(complaintIdInput);
  if (!Number.isInteger(complaintId) || complaintId <= 0) {
    return { ok: false, error: "Invalid complaint selected." };
  }

  try {
    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        priority: {
          increment: PRIORITY_INCREMENT,
        },
      },
      select: {
        id: true,
        priority: true,
      },
    });

    await prisma.audit_log.create({
      data: {
        actorUserId: user.id,
        complaintId: updated.id,
        action: "ADMIN_PRIORITY_ADD_40",
        meta: {
          increment: PRIORITY_INCREMENT,
          updatedPriority: updated.priority,
        },
      },
    });

    return {
      ok: true,
      complaintId: updated.id,
      priority: updated.priority,
    };
  } catch {
    return {
      ok: false,
      error: "Unable to update complaint priority.",
    };
  }
}
