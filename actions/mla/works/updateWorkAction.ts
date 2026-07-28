"use server";

import prisma from "@/lib/prisma";
import { requireWorksManagerUser, requireWorksBudgetApprover, checkWorkAccess } from "./_shared";
import { UpdateWorkPayload, UpdateWorkResult } from "./types";
import { updateWorkValidationSchema } from "@/schema/workValidationSchema";
import { WORKSTATUS, Prisma } from "@prisma/client";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PROPOSED: ["APPROVED", "CANCELLED"],
  APPROVED: ["IN_PROGRESS", "ON_HOLD", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "ON_HOLD", "CANCELLED"],
  COMPLETED: [],
  ON_HOLD: ["IN_PROGRESS", "CANCELLED"],
  CANCELLED: [],
};

export async function updateWorkAction(payload: UpdateWorkPayload): Promise<UpdateWorkResult> {
  const auth = await requireWorksManagerUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    // Validate input
    const validation = updateWorkValidationSchema.safeParse(payload);
    if (!validation.success) {
      return {
        ok: false,
        error: validation.error.issues[0]?.message || "Validation failed",
      };
    }

    const { id, status, approved_budget, ...updateFields } = validation.data;

    // Fetch existing work
    const existingWork = await prisma.work.findUnique({
      where: { id },
      include: { created_by_user: true },
    });

    if (!existingWork) {
      return { ok: false, error: "Work not found" };
    }

    // Check access
    if (!checkWorkAccess(existingWork, auth.user)) {
      return { ok: false, error: "You don't have access to this work" };
    }

    // Validate budget approval
    if (approved_budget !== undefined) {
      const budgetAuth = await requireWorksBudgetApprover();
      if (!budgetAuth.ok) {
        return budgetAuth;
      }

      if (approved_budget < 0) {
        return { ok: false, error: "Budget must be non-negative" };
      }
    }

    // Validate status transition
    if (status) {
      const allowedTransitions = VALID_TRANSITIONS[existingWork.status];
      if (!allowedTransitions.includes(status)) {
        return {
          ok: false,
          error: `Cannot transition from ${existingWork.status} to ${status}`,
        };
      }
    }

    // Update work
    const updateData: Prisma.workUpdateInput = {
      ...updateFields,
      ...(status && { status: status as WORKSTATUS }),
      ...(approved_budget !== undefined && {
        approved_budget: approved_budget > 0 ? approved_budget : null,
        approved_by_user_id: auth.user.id,
        approved_at: new Date(),
      }),
    };

    const updatedWork = await prisma.work.update({
      where: { id },
      data: updateData,
      include: {
        department: { select: { id: true, name: true } },
        ward: { select: { id: true, name: true } },
        created_by_user: { select: { id: true, name: true } },
        approved_by_user: { select: { id: true, name: true } },
        complaint_cluster: {
          select: {
            id: true,
            complaint: { select: { affectedCitizensCount: true } },
            category: true,
          },
        },
      },
    });

    // Log audit
    const changes: Record<string, any> = {};
    if (status && existingWork.status !== status) {
      changes.status = `${existingWork.status} → ${status}`;
    }
    if (approved_budget !== undefined && existingWork.approved_budget?.toString() !== approved_budget.toString()) {
      changes.approved_budget = approved_budget;
    }

    await prisma.audit_log.create({
      data: {
        actorUserId: auth.user.id,
        workId: updatedWork.id,
        action: "work_updated",
        meta: changes,
      },
    });

    // Add activity update
    if (status) {
      await prisma.work_update.create({
        data: {
          work_id: updatedWork.id,
          message: `Status changed to ${status}`,
          created_by_user_id: auth.user.id,
        },
      });
    }

    return {
      ok: true,
      data: {
        id: updatedWork.id,
        title: updatedWork.title,
        description: updatedWork.description,
        status: updatedWork.status,
        priority: updatedWork.priority,
        completion_percentage: updatedWork.completion_percentage,
        estimated_budget: updatedWork.estimated_budget ? parseFloat(updatedWork.estimated_budget.toString()) : null,
        approved_budget: updatedWork.approved_budget ? parseFloat(updatedWork.approved_budget.toString()) : null,
        utilized_budget: parseFloat(updatedWork.utilized_budget.toString()),
        start_date: updatedWork.start_date,
        target_completion_date: updatedWork.target_completion_date,
        actual_completion_date: updatedWork.actual_completion_date,
        created_from: updatedWork.created_from,
        department: updatedWork.department,
        ward: updatedWork.ward,
        created_by: updatedWork.created_by_user,
        approved_by: updatedWork.approved_by_user,
        complaint_cluster: updatedWork.complaint_cluster
          ? {
              id: updatedWork.complaint_cluster.id,
              affected_citizens_count: updatedWork.complaint_cluster.complaint.affectedCitizensCount,
              category: updatedWork.complaint_cluster.category,
            }
          : undefined,
      },
    };
  } catch (error) {
    console.error("Update work action error:", error);
    return { ok: false, error: "Failed to update work" };
  }
}
