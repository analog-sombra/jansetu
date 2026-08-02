"use server";

import prisma from "@/lib/prisma";
import { requireWorksManagerUser } from "./_shared";
import { GetWorksListingResult, WorkDTO } from "./types";
import { WORKSTATUS, Prisma } from "@prisma/client";;

interface GetWorksListingParams {
  page?: number;
  limit?: number;
  status?: string;
  departmentId?: number;
  wardId?: number;
  priority?: string;
  search?: string;
  sortBy?: "createdAt" | "targetCompletionDate" | "priority";
  sortOrder?: "asc" | "desc";
}

export async function getWorksListingAction(params: GetWorksListingParams): Promise<GetWorksListingResult> {
  try {
    const auth = await requireWorksManagerUser();
    if (!auth.ok) {
      return auth;
    }
    const {
      page = 1,
      limit = 20,
      status,
      departmentId,
      wardId,
      priority,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    // Validate pagination
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(Math.max(1, limit), 100);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause: Prisma.workWhereInput = {};

    // Role-based filtering
    if (auth.user.role === "MLA") {
      // whereClause.created_by_user_id = auth.user.id;
    } else if (["MLA_PA", "MLA_SECRETARY"].includes(auth.user.role)) {
      // For MLA_PA/SECRETARY, show works from their MLA (need to determine relationship)
      // For now, return empty list or all works if no relationship exists
      // TODO: Implement proper MLA_PA/SECRETARY to MLA relationship
      // whereClause.created_by_user_id = auth.user.id; // Fallback: show their own works if any
    } else if (auth.user.role === "ADMIN") {
      // ADMIN sees all works (no restriction)
    }

    // Apply filters
    if (status && Object.values(WORKSTATUS).includes(status as WORKSTATUS)) {
      whereClause.status = status as WORKSTATUS;
    }

    if (departmentId && departmentId > 0) {
      whereClause.departmentId = departmentId;
    }

    if (wardId && wardId > 0) {
      whereClause.wardId = wardId;
    }

    if (priority) {
      if (priority === "high") {
        whereClause.priority = { gte: 75 };
      } else if (priority === "medium") {
        whereClause.priority = { gte: 50, lt: 75 };
      } else if (priority === "low") {
        whereClause.priority = { lt: 50 };
      }
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Build order by
    let orderBy: Prisma.workOrderByWithRelationInput = {};
    
    switch (sortBy) {
      case "createdAt":
        orderBy.createdAt = sortOrder;
        break;
      case "targetCompletionDate":
        orderBy.target_completion_date = sortOrder;
        break;
      case "priority":
        orderBy.priority = sortOrder;
        break;
      default:
        orderBy.createdAt = sortOrder;
    }

    // Fetch total count
    const total = await prisma.work.count({ where: whereClause });

    // Fetch works
    const works = await prisma.work.findMany({
      where: whereClause,
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
      orderBy,
      skip,
      take: limitNum,
    });

    const items: WorkDTO[] = works.map((work) => ({
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
    }));

    return {
      ok: true,
      data: {
        items,
        total,
        page: pageNum,
        hasMore: skip + limitNum < total,
      },
    };
  } catch (error) {
    console.error("Get works listing action error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch works";
    console.error("Error details:", errorMessage);
    return { ok: false, error: `Failed to fetch works: ${errorMessage}` };
  }
}
