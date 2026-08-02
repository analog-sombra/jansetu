"use server";

import prisma from "@/lib/prisma";
import { ActionResult, WorkDTO } from "./types";

export async function utilizeWorkBudgetAction(payload: {
  id: number;
  utilized_budget: number;
}): Promise<ActionResult<WorkDTO>> {
  try {
    const { id, utilized_budget } = payload;

    if (utilized_budget < 0) {
      return { ok: false, error: "Utilized budget must be non-negative" };
    }

    const work = await prisma.work.findUnique({
      where: { id },
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

    if (!work) {
      return { ok: false, error: "Work not found" };
    }

    // Check if utilized budget exceeds approved budget
    if (work.approved_budget && utilized_budget > work.approved_budget.toNumber()) {
      return {
        ok: false,
        error: `Utilized budget cannot exceed approved budget (₹${work.approved_budget.toNumber()})`,
      };
    }

    const updatedWork = await prisma.work.update({
      where: { id },
      data: {
        utilized_budget,
      },
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
    await prisma.audit_log.create({
      data: {
        workId: updatedWork.id,
        action: "budget_utilized",
        meta: {
          utilized_budget,
          previous_utilized_budget: work.utilized_budget || 0,
        },
      },
    });

    // Add activity update
    try {
      await prisma.work_update.create({
        data: {
          work_id: updatedWork.id,
          message: `Budget utilized: ₹${utilized_budget}`,
          created_by_user_id: work.created_by_user_id,
        },
      });
    } catch (activityError) {
      console.error("Error creating activity update:", activityError);
    }

    return {
      ok: true,
      data: {
        id: updatedWork.id,
        title: updatedWork.title,
        description: updatedWork.description,
        department: updatedWork.department,
        ward: updatedWork.ward,
        status: updatedWork.status,
        priority: updatedWork.priority,
        start_date: updatedWork.start_date,
        target_completion_date: updatedWork.target_completion_date,
        actual_completion_date: updatedWork.actual_completion_date,
        estimated_budget: updatedWork.estimated_budget ? updatedWork.estimated_budget.toNumber() : null,
        approved_budget: updatedWork.approved_budget ? updatedWork.approved_budget.toNumber() : null,
        utilized_budget: updatedWork.utilized_budget.toNumber(),
        completion_percentage: updatedWork.completion_percentage,
        created_from: "system",
        created_by: updatedWork.created_by_user ? { 
          id: updatedWork.created_by_user_id, 
          name: updatedWork.created_by_user.name 
        } : { id: "", name: null },
        approved_by: updatedWork.approved_by_user ? { 
          id: updatedWork.approved_by_user_id || "", 
          name: updatedWork.approved_by_user.name 
        } : null,
        complaint_cluster: updatedWork.complaint_cluster ? {
          id: updatedWork.complaint_cluster.id,
          affected_citizens_count: updatedWork.complaint_cluster.complaint.affectedCitizensCount,
          category: updatedWork.complaint_cluster.category,
        } : undefined,
      },
    };
  } catch (error) {
    console.error("Error utilizing work budget:", error);
    return { ok: false, error: "Failed to utilize budget" };
  }
}
