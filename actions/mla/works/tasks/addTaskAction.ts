"use server";

import prisma from "@/lib/prisma";
import { requireWorksManagerUser, checkWorkAccess } from "../_shared";
import { ActionResult, WorkTaskDTO } from "../types";
import { createTaskValidationSchema } from "@/schema/workValidationSchema";
import { TASKSTATUS } from "@prisma/client";

export async function addTaskAction(payload: {
  work_id: number;
  title: string;
  description?: string;
  officer_id: number;
  sequence_no?: number;
  planned_date: string;
  remarks?: string;
}): Promise<ActionResult<WorkTaskDTO>> {
  const auth = await requireWorksManagerUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    const validation = createTaskValidationSchema.safeParse(payload);
    if (!validation.success) {
      return {
        ok: false,
        error: validation.error.issues[0]?.message || "Validation failed",
      };
    }

    const { work_id, title, description, officer_id, planned_date, remarks } = validation.data;

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

    const officer = await prisma.officer.findUnique({
      where: { id: officer_id },
    });

    if (!officer) {
      return { ok: false, error: "Officer not found" };
    }

    if (officer.departmentId !== work.departmentId) {
      return { ok: false, error: "Officer must belong to the work's department" };
    }

    let sequenceNo = payload.sequence_no;
    if (!sequenceNo) {
      const maxSeq = await prisma.work_task.aggregate({
        where: { work_id },
        _max: { sequence_no: true },
      });
      sequenceNo = (maxSeq._max.sequence_no || 0) + 1;
    }

    const plannedDate = new Date(planned_date);
    if (work.target_completion_date && plannedDate > work.target_completion_date) {
      return { ok: false, error: "Planned date cannot be after work's target completion date" };
    }

    const task = await prisma.work_task.create({
      data: {
        work_id,
        title,
        description: description || null,
        sequence_no: sequenceNo,
        officer_id,
        department_id: work.departmentId,
        status: TASKSTATUS.PENDING,
        planned_date: plannedDate,
        remarks: remarks || null,
      },
      include: {
        officer: { select: { id: true, name: true } },
        media: { select: { id: true } },
      },
    });

    await prisma.audit_log.create({
      data: {
        actorUserId: auth.user.id,
        workId: work_id,
        action: "task_added",
        meta: {
          task_id: task.id,
          task_title: task.title,
          officer_id,
        },
      },
    });

    await prisma.work_update.create({
      data: {
        work_id,
        message: `Task added: ${title}`,
        created_by_user_id: auth.user.id,
      },
    });

    return {
      ok: true,
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        sequence_no: task.sequence_no,
        status: task.status,
        completion_percentage: task.completion_percentage,
        planned_date: task.planned_date,
        actual_date: task.actual_date,
        officer: task.officer,
        media_count: task.media.length,
      },
    };
  } catch (error) {
    console.error("Add task action error:", error);
    return { ok: false, error: "Failed to add task" };
  }
}
