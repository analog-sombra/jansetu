"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isAdminRole } from "./_shared";
import { isMlaPaRouteRole } from "@/actions/mla-pa/_shared";

export type RejectComplaintResult = 
  | { ok: true }
  | { ok: false; error: string };

export async function rejectComplaintAction(payload: {
  complaintId: number;
  message: string;
}): Promise<RejectComplaintResult> {
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
    return { ok: false, error: "Rejection reason must be at least 5 characters." };
  }

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      select: { id: true, status: true },
    });

    if (!complaint) {
      return { ok: false, error: "Complaint not found." };
    }

    // Check if complaint can be rejected
    const rejectable = ["PENDING", "IN_PROGRESS", "WORK_IN_PROGRESS", "QUERY_RAISED"];
    if (!rejectable.includes(complaint.status)) {
      return { ok: false, error: `Cannot reject complaint with status ${complaint.status}` };
    }

    await prisma.$transaction(async (tx) => {
      // Update complaint status to REJECTED
      await tx.complaint.update({
        where: { id: complaint.id },
        data: { status: "REJECTED" },
      });

      // If there's an active assignment, update it
      const activeAssignment = await tx.assignment.findFirst({
        where: { 
          complaintId: complaint.id,
          status: { in: ["ASSIGNED", "IN_PROGRESS", "QUERY"] }
        },
        orderBy: { createdAt: "desc" },
      });

      if (activeAssignment) {
        await tx.response.create({
          data: {
            assignmentId: activeAssignment.id,
            type: "REJECTED",
            message,
          },
        });

        await tx.assignment.update({
          where: { id: activeAssignment.id },
          data: { status: "REJECTED" },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: "COMPLAINT_REJECTED",
          complaintId: complaint.id,
          details: {
            reason: message,
          },
        },
      });
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to reject complaint",
    };
  }
}
