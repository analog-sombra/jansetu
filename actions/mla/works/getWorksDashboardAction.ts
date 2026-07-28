"use server";

import prisma from "@/lib/prisma";
import { requireWorksManagerUser } from "./_shared";
import { GetWorksDashboardResult } from "./types";
import { WORKSTATUS, Prisma } from "@prisma/client";

interface WardDistribution {
  ward_id: number;
  ward_name: string;
  work_count: number;
}

export async function getWorksDashboardAction(): Promise<GetWorksDashboardResult> {
  const auth = await requireWorksManagerUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    // Build base where clause based on role
    const whereClause: Prisma.workWhereInput = {};

    if (auth.user.role === "MLA") {
      whereClause.created_by_user_id = auth.user.id;
    } else if (["MLA_PA", "MLA_SECRETARY"].includes(auth.user.role)) {
      const mlaUser = await prisma.user.findFirst({
        where: { role: "MLA" },
        select: { id: true },
      });
      if (mlaUser) {
        whereClause.created_by_user_id = mlaUser.id;
      }
    }

    // Parallel queries for better performance
    const [summary, budget, departments, wards, priorityWorks, dueWorks, recentWorks] = await Promise.all([
      // Query 1: Status summary
      prisma.work.groupBy({
        by: ["status"],
        _count: true,
        where: whereClause,
      }),

      // Query 2: Budget totals
      prisma.work.aggregate({
        _sum: { approved_budget: true, utilized_budget: true },
        where: whereClause,
      }),

      // Query 3: Department metrics
      (async () => {
        const deptWorks = await prisma.work.findMany({
          where: whereClause,
          select: {
            id: true,
            departmentId: true,
            department: { select: { id: true, name: true } },
            status: true,
          },
        });

        const deptMap: Record<
          number,
          { id: number; name: string; total: number; completed: number }
        > = {};

        deptWorks.forEach((work) => {
          if (!deptMap[work.departmentId]) {
            deptMap[work.departmentId] = {
              id: work.departmentId,
              name: work.department.name,
              total: 0,
              completed: 0,
            };
          }
          deptMap[work.departmentId].total++;
          if (work.status === WORKSTATUS.COMPLETED) {
            deptMap[work.departmentId].completed++;
          }
        });

        return Object.values(deptMap).map((dept) => ({
          department_id: dept.id,
          department_name: dept.name,
          work_count: dept.total,
          completion_rate: dept.total > 0 ? (dept.completed / dept.total) * 100 : 0,
          delayed_count: 0, // TODO: Calculate delayed
        }));
      })(),

      // Query 4: Ward distribution
      prisma.work.groupBy({
        by: ["wardId"],
        _count: true,
        where: { ...whereClause, wardId: { not: null } },
      }),

      // Query 5: Priority works (HIGH priority)
      prisma.work.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          target_completion_date: true,
        },
        orderBy: { priority: "desc" },
        take: 10,
      }),

      // Query 6: Works due soon
      prisma.work.findMany({
        where: {
          ...whereClause,
          target_completion_date: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          title: true,
          target_completion_date: true,
          status: true,
        },
        orderBy: { target_completion_date: "asc" },
        take: 10,
      }),

      // Query 7: Recent works
      prisma.work.findMany({
        where: whereClause,
        include: {
          department: { select: { id: true, name: true } },
          ward: { select: { id: true, name: true } },
          created_by_user: { select: { id: true, name: true } },
          approved_by_user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // Build status summary
    const statusMap: Record<string, number> = {
      total_works: 0,
      proposed: 0,
      approved: 0,
      in_progress: 0,
      completed: 0,
      on_hold: 0,
      cancelled: 0,
      delayed: 0,
    };

    summary.forEach((item) => {
      const key = item.status.toLowerCase();
      statusMap[key] = item._count;
      statusMap.total_works += item._count;
    });

    // Build ward distribution
    const wardData = await Promise.all(
      wards.map(async (item) => {
        if (!item.wardId) return null;
        const ward = await prisma.ward.findUnique({
          where: { id: item.wardId },
          select: { id: true, name: true },
        });
        return {
          ward_id: item.wardId,
          ward_name: ward?.name || "Unknown",
          work_count: item._count,
        } as WardDistribution;
      })
    );

    // Format response
    const totalApprovedBudget = budget._sum.approved_budget
      ? parseFloat(budget._sum.approved_budget.toString())
      : 0;
    const totalUtilizedBudget = budget._sum.utilized_budget
      ? parseFloat(budget._sum.utilized_budget.toString())
      : 0;

    return {
      ok: true,
      data: {
        summary: {
          total_works: statusMap.total_works,
          proposed: statusMap.proposed || 0,
          approved: statusMap.approved || 0,
          in_progress: statusMap.in_progress || 0,
          completed: statusMap.completed || 0,
          on_hold: statusMap.on_hold || 0,
          cancelled: statusMap.cancelled || 0,
          delayed: statusMap.delayed || 0,
        },
        budget: {
          total_approved: totalApprovedBudget,
          total_utilized: totalUtilizedBudget,
          utilization_percentage:
            totalApprovedBudget > 0 ? (totalUtilizedBudget / totalApprovedBudget) * 100 : 0,
        },
        department_metrics: departments,
        ward_distribution: wardData.filter((w): w is WardDistribution => w !== null),
        priority_works: priorityWorks.map((work) => ({
          id: work.id,
          title: work.title,
          priority: work.priority,
          status: work.status,
          target_completion_date: work.target_completion_date,
        })),
        works_due_soon: dueWorks.map((work) => {
          const now = new Date();
          const daysRemaining = work.target_completion_date
            ? Math.ceil(
                (work.target_completion_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              )
            : 0;
          return {
            id: work.id,
            title: work.title,
            target_completion_date: work.target_completion_date,
            days_remaining: daysRemaining,
            status: work.status,
          };
        }),
        recent_works: recentWorks.map((work) => ({
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
        })),
      },
    };
  } catch (error) {
    console.error("Get works dashboard action error:", error);
    return { ok: false, error: "Failed to fetch dashboard data" };
  }
}
