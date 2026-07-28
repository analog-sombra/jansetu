"use server";

import { WORKSTATUS } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireWorksManagerUser } from "./_shared";
import { CreateWorkPayload, CreateWorkResult } from "./types";
import { createWorkValidationSchema } from "@/schema/workValidationSchema";

export async function createWorkAction(payload: CreateWorkPayload): Promise<CreateWorkResult> {
  const auth = await requireWorksManagerUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    // Validate input
    const validation = createWorkValidationSchema.safeParse(payload);
    if (!validation.success) {
      return {
        ok: false,
        error: validation.error.issues[0]?.message || "Validation failed",
      };
    }

    const {
      title,
      description,
      departmentId,
      wardId,
      clusterId,
      complaintId,
      priority = 50,
      estimated_budget,
      start_date,
      target_completion_date,
      remarks,
    } = validation.data;

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department) {
      return { ok: false, error: "Department not found" };
    }

    // If wardId provided, verify it exists
    if (wardId) {
      const ward = await prisma.ward.findUnique({
        where: { id: wardId },
      });
      if (!ward) {
        return { ok: false, error: "Ward not found" };
      }
    }

    // Determine source and validate
    let created_from = "MANUAL";
    let sourceClusterId: number | null = null;
    let sourceComplaintId: number | null = null;

    if (clusterId) {
      created_from = "CLUSTER";
      const cluster = await prisma.complaint_cluster.findUnique({
        where: { id: clusterId },
        include: {
          complaint: {
            select: { priority: true, affectedCitizensCount: true },
          },
          work: true,
        },
      });

      if (!cluster) {
        return { ok: false, error: "Complaint cluster not found" };
      }

      if (cluster.work) {
        return { ok: false, error: "This cluster is already linked to a work" };
      }

      sourceClusterId = clusterId;
    } else if (complaintId) {
      created_from = "COMPLAINT";
      const complaint = await prisma.complaint.findUnique({
        where: { id: complaintId },
      });

      if (!complaint) {
        return { ok: false, error: "Complaint not found" };
      }

      sourceComplaintId = complaintId;
    }

    // Create work
    const work = await prisma.work.create({
      data: {
        title,
        description,
        departmentId,
        wardId: wardId || null,
        status: WORKSTATUS.PROPOSED,
        priority: priority || 50,
        estimated_budget: estimated_budget || null,
        approved_budget: null,
        utilized_budget: 0,
        completion_percentage: 0,
        start_date: start_date ? new Date(start_date) : null,
        target_completion_date: new Date(target_completion_date),
        created_from,
        cluster_id: sourceClusterId || null,
        complaint_id: sourceComplaintId || null,
        remarks: remarks || null,
        created_by_user_id: auth.user.id,
      },
      include: {
        department: { select: { id: true, name: true } },
        ward: { select: { id: true, name: true } },
        created_by_user: { select: { id: true, name: true } },
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
        actorUserId: auth.user.id,
        workId: work.id,
        action: "work_created",
        meta: {
          title: work.title,
          created_from: work.created_from,
          cluster_id: sourceClusterId,
          complaint_id: sourceComplaintId,
        },
      },
    });

    return {
      ok: true,
      data: {
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
        approved_by: null,
        complaint_cluster: work.complaint_cluster
          ? {
              id: work.complaint_cluster.id,
              affected_citizens_count: work.complaint_cluster.complaint.affectedCitizensCount,
              category: work.complaint_cluster.category,
            }
          : undefined,
      },
    };
  } catch (error) {
    console.error("Create work action error:", error);
    return { ok: false, error: "Failed to create work" };
  }
}
