"use server";

import prisma from "@/lib/prisma";
import { getOfficerAssignmentByTokenAction } from "./getOfficerAssignmentByTokenAction";
import {
  SubmitOfficerResponseInput,
  SubmitOfficerResponseResult,
} from "./types";

function getNextStatuses(type: SubmitOfficerResponseInput["type"]) {
  if (type === "RESOLVED") {
    return { assignmentStatus: "RESOLVED", complaintStatus: "RESOLVED" } as const;
  }

  if (type === "QUERY") {
    return { assignmentStatus: "QUERY", complaintStatus: "QUERY_RAISED" } as const;
  }

  if (type === "REJECTED") {
    return { assignmentStatus: "REJECTED", complaintStatus: "REJECTED" } as const;
  }

  return {
    assignmentStatus: "IN_PROGRESS",
    complaintStatus: "WORK_IN_PROGRESS",
  } as const;
}

export async function submitOfficerResponseAction(
  payload: SubmitOfficerResponseInput,
): Promise<SubmitOfficerResponseResult> {
  const token = payload.token.trim();
  const message = payload.message.trim();
  const proofUrl = payload.proofUrl?.trim() || null;

  if (!token) {
    return { ok: false, error: "Invalid or expired access token" };
  }

  if (message.length < 10) {
    return { ok: false, error: "Response must be at least 10 characters" };
  }

  if (payload.type === "WORK_IN_PROGESS" && !payload.plannedCompletionDate) {
    return { ok: false, error: "Please select a target completion date" };
  }

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { token },
      select: {
        id: true,
        complaintId: true,
      },
    });

    if (!assignment) {
      return { ok: false, error: "Invalid or expired access token" };
    }

    const { assignmentStatus, complaintStatus } = getNextStatuses(payload.type);

    await prisma.$transaction(async (tx) => {
      await tx.response.create({
        data: {
          assignmentId: assignment.id,
          type: payload.type,
          message,
          proofUrl,
        },
      });

      await tx.assignment.update({
        where: { id: assignment.id },
        data: {
          status: assignmentStatus,
        },
      });

      await tx.complaint.update({
        where: { id: assignment.complaintId },
        data: {
          status: complaintStatus,
          plannedCompletionDate:
            payload.type === "WORK_IN_PROGESS" && payload.plannedCompletionDate
              ? new Date(payload.plannedCompletionDate)
              : undefined,
        },
      });

      await tx.auditLog.create({
        data: {
          complaintId: assignment.complaintId,
          action: "OFFICER_RESPONSE",
          meta: {
            assignmentId: assignment.id,
            type: payload.type,
            hasProof: Boolean(proofUrl),
          },
        },
      });
    });

    // refresh officer cookie/session for token-based direct access
    await getOfficerAssignmentByTokenAction(token);

    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to submit response" };
  }
}
