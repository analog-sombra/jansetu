"use server";

import prisma from "@/lib/prisma";
import { requireWorksManagerUser, checkWorkAccess } from "./_shared";
import { GetWorkDetailsResult, WorkDTO, WorkTaskDTO, WorkMediaDTO, WorkUpdateDTO } from "./types";

export async function getWorkDetailsAction(id: number): Promise<GetWorkDetailsResult> {
  const auth = await requireWorksManagerUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    // Fetch work
    const work = await prisma.work.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        ward: { select: { id: true, name: true } },
        created_by_user: { select: { id: true, name: true, role: true } },
        approved_by_user: { select: { id: true, name: true } },
        complaint_cluster: {
          select: {
            id: true,
            complaint: { select: { affectedCitizensCount: true } },
            category: true,
            subcategory: true,
            clusterId: true,
          },
        },
      },
    });

    if (!work) {
      return { ok: false, error: "Work not found" };
    }

    // Check access
    if (!checkWorkAccess(work, auth.user)) {
      return { ok: false, error: "You don't have access to this work" };
    }

    // Fetch tasks
    const tasks = await prisma.work_task.findMany({
      where: { work_id: id },
      include: {
        officer: { select: { id: true, name: true } },
        media: { select: { id: true } },
      },
      orderBy: { sequence_no: "asc" },
    });

    // Fetch media grouped by type
    const media = await prisma.work_media.findMany({
      where: { work_id: id, task_id: null },
      include: {
        uploaded_by_user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const mediaByType: Record<string, WorkMediaDTO[]> = {
      before: [],
      progress: [],
      after: [],
      document: [],
    };

    media.forEach((m) => {
      const key = m.type.toLowerCase();
      if (key in mediaByType) {
        mediaByType[key].push({
          id: m.id,
          file_path: m.file_path,
          type: m.type,
          caption: m.caption,
          uploaded_by: m.uploaded_by_user.name || "Unknown",
          created_at: m.createdAt,
        });
      }
    });

    // Fetch activity updates
    const updates = await prisma.work_update.findMany({
      where: { work_id: id },
      include: {
        created_by_user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const taskDTOs: WorkTaskDTO[] = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      sequence_no: task.sequence_no,
      status: task.status,
      completion_percentage: task.completion_percentage,
      planned_date: task.planned_date,
      actual_date: task.actual_date,
      officer: task.officer ? { id: task.officer.id, name: task.officer.name } : null,
      media_count: task.media.length,
    }));

    const updateDTOs: WorkUpdateDTO[] = updates.map((u) => ({
      id: u.id,
      message: u.message,
      created_by: u.created_by_user.name || "System",
      created_at: u.createdAt,
    }));

    const workDTO: WorkDTO & {
      tasks: WorkTaskDTO[];
      media: Record<string, WorkMediaDTO[]>;
      activity_feed: WorkUpdateDTO[];
    } = {
      id: work.id,
      title: work.title,
      description: work.description,
      status: work.status,
      priority: work.priority,
      completion_percentage: work.completion_percentage,
      estimated_budget: work.estimated_budget ? parseFloat(work.estimated_budget.toString()) : null,
      approved_budget: work.approved_budget ? parseFloat(work.approved_budget.toString()) : null,
      utilized_budget: parseFloat(work.utilized_budget.toString()),
      start_date: work.start_date,
      target_completion_date: work.target_completion_date,
      actual_completion_date: work.actual_completion_date,
      created_from: work.created_from,
      department: work.department,
      ward: work.ward,
      created_by: work.created_by_user,
      approved_by: work.approved_by_user,
      complaint_cluster: work.complaint_cluster
        ? {
            id: work.complaint_cluster.id,
            affected_citizens_count: work.complaint_cluster.complaint.affectedCitizensCount,
            category: work.complaint_cluster.category,
          }
        : undefined,
      tasks: taskDTOs,
      media: mediaByType,
      activity_feed: updateDTOs,
    };

    return { ok: true, data: workDTO };
  } catch (error) {
    console.error("Get work details action error:", error);
    return { ok: false, error: "Failed to fetch work details" };
  }
}
