"use server";

import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";
import { AdminAssignmentResult } from "./types";

export async function assignAdminComplaintOfficerAction(payload: {
  complaintId: number;
  officerId: number;
}): Promise<AdminAssignmentResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  const complaintId = Number(payload.complaintId);
  const officerId = Number(payload.officerId);

  if (!Number.isInteger(complaintId) || complaintId <= 0) {
    return { ok: false, error: "Invalid complaint selected." };
  }

  if (!Number.isInteger(officerId) || officerId <= 0) {
    return { ok: false, error: "Invalid officer selected." };
  }

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      select: { id: true },
    });

    if (!complaint) {
      return { ok: false, error: "Complaint not found." };
    }

    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
      select: { id: true },
    });

    if (!officer) {
      return { ok: false, error: "Officer not found." };
    }

    const token = randomUUID().replaceAll("-", "");
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const assignment = await prisma.$transaction(async (tx) => {
      const createdAssignment = await tx.assignment.create({
        data: {
          complaintId: complaint.id,
          officerId: officer.id,
          status: "ASSIGNED",
          dueDate,
          token,
        },
        select: { id: true },
      });

      await tx.complaint.update({
        where: { id: complaint.id },
        data: { status: "IN_PROGRESS" },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: auth.user.id,
          complaintId: complaint.id,
          action: "ASSIGN_OFFICER",
          meta: {
            officerId: officer.id,
            token,
            dueDate: dueDate.toISOString(),
          },
        },
      });

      return createdAssignment;
    });

    return {
      ok: true,
      token,
      assignmentId: assignment.id,
    };
  } catch {
    return { ok: false, error: "Unable to assign officer." };
  }
}
