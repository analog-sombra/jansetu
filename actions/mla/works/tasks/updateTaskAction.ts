"use server";

import prisma from "@/lib/prisma";
import { requireWorksManagerUser } from "../_shared";
import { ActionResult, WorkTaskDTO } from "../types";
import { updateTaskValidationSchema } from "@/schema/workValidationSchema";
import { Prisma, TASKSTATUS } from "@prisma/client";
export async function updateTaskAction(payload: {
  id: number;
  status?: string;
  completion_percentage?: number;
  actual_date?: string;
  remarks?: string;
}): Promise<ActionResult<WorkTaskDTO>> {
  const auth = await requireWorksManagerUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    const validation = updateTaskValidationSchema.safeParse(payload);
    if (!validation.success) {
      return {
        ok: false,
        error: validation.error.issues[0]?.message || "Validation failed",
      };
    }

    const { id, status, completion_percentage, actual_date, remarks } = validation.data;

    const existingTask = await prisma.work_task.findUnique({
      where: { id },
      include: {
        work: { select: { id: true, created_by_user_id: true } },
        officer: { select: { id: true } },
      },
    });

    if (!existingTask) {
      return { ok: false, error: "Task not found" };
    }

    const hasAccess =
      auth.user.id === existingTask.work.created_by_user_id ||
      auth.user.id === existingTask.officer?.id.toString() ||
      auth.user.role === "ADMIN";

    if (!hasAccess) {
      return { ok: false, error: "You don't have access to this task" };
    }

    let actualDate = actual_date ? new Date(actual_date) : existingTask.actual_date;
    if (status === "COMPLETED") {
      if (!actualDate) {
        return { ok: false, error: "Actual date is required when marking task as completed" };
      }
      if (actualDate > new Date(Date.now() + 86400000)) {
        return { ok: false, error: "Actual date cannot be in the future" };
      }
    }

    const updateData: Prisma.work_taskUpdateInput = {};
    if (status) updateData.status = status as TASKSTATUS;
    if (completion_percentage !== undefined) updateData.completion_percentage = completion_percentage;
    if (actual_date) updateData.actual_date = actualDate;
    if (remarks !== undefined) updateData.remarks = remarks;

    const updatedTask = await prisma.work_task.update({
      where: { id },
      data: updateData,
      include: {
        officer: { select: { id: true, name: true } },
        media: { select: { id: true } },
      },
    });

    const changes: Record<string, any> = {};
    if (status && existingTask.status !== status) {
      changes.status = `${existingTask.status} → ${status}`;
    }
    if (completion_percentage !== undefined) {
      changes.completion_percentage = completion_percentage;
    }

    await prisma.audit_log.create({
      data: {
        actorUserId: auth.user.id,
        workId: existingTask.work.id,
        action: "task_updated",
        meta: {
          task_id: updatedTask.id,
          ...changes,
        },
      },
    });

    if (status && existingTask.status !== status) {
      await prisma.work_update.create({
        data: {
          work_id: existingTask.work.id,
          message: `Task "${updatedTask.title}" status changed to ${status}`,
          created_by_user_id: auth.user.id,
        },
      });
    }

    if (status === "COMPLETED") {
      const allTasks = await prisma.work_task.findMany({
        where: { work_id: existingTask.work.id },
        select: { status: true, completion_percentage: true },
      });

      const completedTasks = allTasks.filter((t) => t.status === "COMPLETED");
      const avgCompletion =
        allTasks.length > 0
          ? Math.round((completedTasks.length / allTasks.length) * 100)
          : 0;

      await prisma.work.update({
        where: { id: existingTask.work.id },
        data: { completion_percentage: avgCompletion },
      });
    }

    return {
      ok: true,
      data: {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        sequence_no: updatedTask.sequence_no,
        status: updatedTask.status,
        completion_percentage: updatedTask.completion_percentage,
        planned_date: updatedTask.planned_date,
        actual_date: updatedTask.actual_date,
        officer: updatedTask.officer,
        media_count: updatedTask.media.length,
      },
    };
  } catch (error) {
    console.error("Update task action error:", error);
    return { ok: false, error: "Failed to update task" };
  }
}
