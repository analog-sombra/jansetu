"use server";

import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import { AssignOfficerByTokenResult } from "./types";

export async function assignOfficerByTokenAction(payload: {
  token: string;
  officerId: number;
}): Promise<AssignOfficerByTokenResult> {
  const token = payload.token.trim();
  const officerId = Number(payload.officerId);

  if (!token) {
    return { ok: false, error: "Invalid or expired access token" };
  }

  if (!Number.isInteger(officerId) || officerId <= 0) {
    return { ok: false, error: "Invalid officer selected." };
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

    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
      select: { id: true },
    });

    if (!officer) {
      return { ok: false, error: "Officer not found." };
    }

    const nextToken = randomUUID().replaceAll("-", "");
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const createdAssignment = await prisma.$transaction(async (tx) => {
      await tx.complaintOfficerAssignmentHistory.updateMany({
        where: {
          complaintId: assignment.complaintId,
          isCurrent: true,
        },
        data: {
          isCurrent: false,
        },
      });

      const nextAssignment = await tx.assignment.create({
        data: {
          complaintId: assignment.complaintId,
          officerId: officer.id,
          status: "ASSIGNED",
          dueDate,
          token: nextToken,
        },
        select: { id: true },
      });

      await tx.complaint.update({
        where: { id: assignment.complaintId },
        data: { status: "IN_PROGRESS" },
      });

      await tx.complaintOfficerAssignmentHistory.create({
        data: {
          complaintId: assignment.complaintId,
          officerId: officer.id,
          assignmentId: nextAssignment.id,
          isCurrent: true,
        },
      });

      await tx.auditLog.create({
        data: {
          complaintId: assignment.complaintId,
          action: "REASSIGN_OFFICER_BY_TOKEN",
          meta: {
            previousAssignmentId: assignment.id,
            nextAssignmentId: nextAssignment.id,
            officerId: officer.id,
            token: nextToken,
            dueDate: dueDate.toISOString(),
          },
        },
      });

      return nextAssignment;
    });

    return {
      ok: true,
      token: nextToken,
      assignmentId: createdAssignment.id,
    };
  } catch {
    return { ok: false, error: "Unable to assign officer." };
  }
}
