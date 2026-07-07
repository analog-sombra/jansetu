"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isAdminRole } from "./_shared";
import { isMlaPaRouteRole } from "@/actions/mla-pa/_shared";
import { AdminQueryResult } from "./types";

export async function raiseAdminComplaintQueryAction(payload: {
  complaintId: number;
  message: string;
}): Promise<AdminQueryResult> {
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

  const complaintId = Number(payload.complaintId);
  const message = payload.message.trim();

  if (!Number.isInteger(complaintId) || complaintId <= 0) {
    return { ok: false, error: "Invalid complaint selected." };
  }

  if (message.length < 5) {
    return { ok: false, error: "Query message must be at least 5 characters." };
  }

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      select: { id: true },
    });

    if (!complaint) {
      return { ok: false, error: "Complaint not found." };
    }

    const latestAssignment = await prisma.assignment.findFirst({
      where: { complaintId: complaint.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (!latestAssignment) {
      return { ok: false, error: "Please assign an officer before raising a query." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.response.create({
        data: {
          assignmentId: latestAssignment.id,
          type: "QUERY",
          message,
        },
      });

      await tx.assignment.update({
        where: { id: latestAssignment.id },
        data: { status: "QUERY" },
      });

      await tx.complaint.update({
        where: { id: complaint.id },
        data: { status: "QUERY_RAISED" },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          complaintId: complaint.id,
          action: "RAISE_QUERY",
          meta: { message },
        },
      });
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to raise query." };
  }
}
