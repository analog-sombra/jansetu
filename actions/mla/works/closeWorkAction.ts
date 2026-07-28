"use server";

import prisma from "@/lib/prisma";
import { requireWorksManagerUser, checkWorkAccess } from "./_shared";
import { ActionResult, WorkDTO } from "./types";
import { WORKSTATUS } from "@prisma/client";

export async function closeWorkAction(payload: {
  id: number;
  actual_completion_date: string;
  closure_remarks?: string;
}): Promise<ActionResult<WorkDTO>> {
  const auth = await requireWorksManagerUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    const { id, actual_completion_date, closure_remarks } = payload;

    if (!actual_completion_date) {
      return { ok: false, error: "Actual completion date is required" };
    }

    const completionDate = new Date(actual_completion_date);
    if (completionDate > new Date()) {
      return { ok: false, error: "Actual completion date cannot be in the future" };
    }

    const work = await prisma.work.findUnique({
      where: { id },
      include: {
        created_by_user: true,
        complaint_cluster: {
          include: {
            complaint: true,
          },
        },
      },
    });

    if (!work) {
      return { ok: false, error: "Work not found" };
    }

    if (!checkWorkAccess(work, auth.user)) {
      return { ok: false, error: "You don't have access to this work" };
    }

    if (
      work.status !== WORKSTATUS.IN_PROGRESS &&
      work.status !== WORKSTATUS.APPROVED &&
      work.status !== WORKSTATUS.ON_HOLD
    ) {
      return {
        ok: false,
        error: `Work cannot be closed from ${work.status} status. Only works in progress, approved, or on hold can be closed.`,
      };
    }

    const closedWork = await prisma.work.update({
      where: { id },
      data: {
        status: WORKSTATUS.COMPLETED,
        actual_completion_date: completionDate,
        completion_percentage: 100,
      },
      include: {
        created_by_user: { select: { id: true, name: true } },
        approved_by_user: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        ward: { select: { id: true, name: true } },
        complaint_cluster: {
          include: {
            complaint: true,
          },
        },
      },
    });

    await prisma.work_update.create({
      data: {
        work_id: id,
        message: `Work completed on ${completionDate.toLocaleDateString()}${closure_remarks ? ` - ${closure_remarks}` : ""}`,
        created_by_user_id: auth.user.id,
      },
    });

    await prisma.audit_log.create({
      data: {
        actorUserId: auth.user.id,
        workId: id,
        action: "work_closed",
        meta: {
          previous_status: work.status,
          new_status: WORKSTATUS.COMPLETED,
          actual_completion_date: completionDate.toISOString(),
          closure_remarks: closure_remarks || null,
        },
      },
    });

    if (closedWork.cluster_id && closedWork.complaint_cluster) {
      const allClusterWorks = await prisma.work.findMany({
        where: { cluster_id: closedWork.cluster_id },
        select: { status: true },
      });

      const allComplete = allClusterWorks.every((w) => w.status === WORKSTATUS.COMPLETED);

      if (allComplete && closedWork.complaint_cluster.complaint) {
        await prisma.complaint.update({
          where: { id: closedWork.complaint_cluster.complaint.id },
          data: {
            status: "RESOLVED",
            resolvedAt: completionDate,
          },
        });

        await prisma.work_update.create({
          data: {
            work_id: id,
            message: "All works completed. Associated complaint marked as resolved.",
            created_by_user_id: auth.user.id,
          },
        });
      }
    }

    return {
      ok: true,
      data: {
        id: closedWork.id,
        title: closedWork.title,
        description: closedWork.description,
        status: closedWork.status,
        priority: closedWork.priority,
        completion_percentage: closedWork.completion_percentage,
        estimated_budget: closedWork.estimated_budget ? Number(closedWork.estimated_budget) : null,
        approved_budget: closedWork.approved_budget ? Number(closedWork.approved_budget) : null,
        utilized_budget: Number(closedWork.utilized_budget),
        start_date: closedWork.start_date,
        target_completion_date: closedWork.target_completion_date,
        actual_completion_date: closedWork.actual_completion_date,
        created_from: closedWork.created_from,
        department: closedWork.department,
        ward: closedWork.ward,
        created_by: closedWork.created_by_user,
        approved_by: closedWork.approved_by_user,
      },
    };
  } catch (error) {
    console.error("Close work action error:", error);
    return { ok: false, error: "Failed to close work" };
  }
}
