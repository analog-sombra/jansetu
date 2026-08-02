"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export type OverdueAssignedComplaint = {
  id: number;
  category: string;
  subcategory: string | null;
  status: string;
  priority: number;
  createdAt: Date;
  daysInProgress: number;
  dueDate: Date | null;
  daysOverdue: number;
  assignedOfficer: string | null;
};

export type CategorySummary = {
  category: string;
  count: number;
  resolved: number;
  inProgress: number;
  pending: number;
  rejected: number;
};

export type DepartmentComplaintReport = {
  department: string;
  totalComplaints: number;
  resolvedCount: number;
  inProgressCount: number;
  pendingCount: number;
  rejectedCount: number;
  averageResolutionDays: number;
  affectedCitizens: number;
  averagePriority: number;
  overdueAssignedCount: number;
  categorySummary: CategorySummary[];
  recentComplaints: Array<{
    id: number;
    category: string;
    subcategory: string | null;
    status: string;
    priority: number;
    createdAt: Date;
    resolvedAt: Date | null;
    assignedOfficer: string | null;
  }>;
  overdueAssignedComplaints: OverdueAssignedComplaint[];
};

export type GetDepartmentComplaintReportResult =
  | {
      ok: true;
      data: DepartmentComplaintReport;
    }
  | {
      ok: false;
      error: string;
    };

export async function getDepartmentComplaintReportAction(
  departmentName: string,
): Promise<GetDepartmentComplaintReportResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        ok: false,
        error: "Please login again to continue.",
      };
    }

    if (!departmentName || departmentName.trim() === "") {
      return {
        ok: false,
        error: "Department name is required",
      };
    }

    // Find all categories that match this department name
    const categories = await prisma.category.findMany({
      where: {
        department: {
          name: departmentName,
        },
      },
    });

    if (categories.length === 0) {
      return {
        ok: true,
        data: {
          department: departmentName,
          totalComplaints: 0,
          resolvedCount: 0,
          inProgressCount: 0,
          pendingCount: 0,
          rejectedCount: 0,
          averageResolutionDays: 0,
          affectedCitizens: 0,
          averagePriority: 0,
          overdueAssignedCount: 0,
          categorySummary: [],
          recentComplaints: [],
          overdueAssignedComplaints: [],
        },
      };
    }

    const categoryIds = categories.map((c) => c.id);

    // Fetch all complaints for these categories
    const complaints = await prisma.complaint.findMany({
      where: {
        categoryId: {
          in: categoryIds,
        },
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        subcategory: {
          select: {
            name: true,
          },
        },
        assignments: {
          include: {
            officer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (complaints.length === 0) {
      return {
        ok: true,
        data: {
          department: departmentName,
          totalComplaints: 0,
          resolvedCount: 0,
          inProgressCount: 0,
          pendingCount: 0,
          rejectedCount: 0,
          averageResolutionDays: 0,
          affectedCitizens: 0,
          averagePriority: 0,
          overdueAssignedCount: 0,
          categorySummary: [],
          recentComplaints: [],
          overdueAssignedComplaints: [],
        },
      };
    }

    // Calculate statistics
    let resolvedCount = 0;
    let inProgressCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    let totalPriority = 0;
    let totalAffectedCitizens = 0;
    let totalResolutionDays = 0;
    let resolvedComplaintsCount = 0;
    let overdueAssignedCount = 0;

    // Group by category
    const categoryMap = new Map<string, CategorySummary>();
    const overdueList: OverdueAssignedComplaint[] = [];
    const now = new Date();

    complaints.forEach((complaint) => {
      const status = complaint.status.toLowerCase();

      if (status === "resolved") {
        resolvedCount++;
        resolvedComplaintsCount++;

        if (complaint.updatedAt && complaint.createdAt) {
          const resolutionTime =
            (complaint.updatedAt.getTime() - complaint.createdAt.getTime()) /
            (1000 * 60 * 60 * 24);
          totalResolutionDays += resolutionTime;
        }
      } else if (status === "in_progress") {
        inProgressCount++;

        // Check for overdue assigned complaints
        if (complaint.assignments.length > 0) {
          complaint.assignments.forEach((assignment) => {
            if (assignment.status === "ASSIGNED" && assignment.dueDate) {
              const daysOverdue = Math.floor(
                (now.getTime() - assignment.dueDate.getTime()) /
                  (1000 * 60 * 60 * 24),
              );

              if (daysOverdue > 0) {
                overdueAssignedCount++;
                const daysInProgress = Math.floor(
                  (now.getTime() - complaint.createdAt.getTime()) /
                    (1000 * 60 * 60 * 24),
                );

                overdueList.push({
                  id: complaint.id,
                  category: complaint.category.name,
                  subcategory: complaint.subcategory?.name || null,
                  status: complaint.status,
                  priority: complaint.priority,
                  createdAt: complaint.createdAt,
                  daysInProgress,
                  dueDate: assignment.dueDate,
                  daysOverdue,
                  assignedOfficer: assignment.officer.name,
                });
              }
            }
          });
        }
      } else if (status === "pending") {
        pendingCount++;
      } else if (status === "rejected") {
        rejectedCount++;
      }

      totalPriority += complaint.priority;
      totalAffectedCitizens += complaint.affectedCitizensCount;

      // Group by category
      const categoryName = complaint.category.name;
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          category: categoryName,
          count: 0,
          resolved: 0,
          inProgress: 0,
          pending: 0,
          rejected: 0,
        });
      }

      const catSummary = categoryMap.get(categoryName)!;
      catSummary.count++;
      if (status === "resolved") catSummary.resolved++;
      else if (status === "in_progress") catSummary.inProgress++;
      else if (status === "pending") catSummary.pending++;
      else if (status === "rejected") catSummary.rejected++;
    });

    const averageResolutionDays =
      resolvedComplaintsCount > 0
        ? Math.round(totalResolutionDays / resolvedComplaintsCount)
        : 0;

    const categorySummary = Array.from(categoryMap.values()).sort(
      (a, b) => b.count - a.count,
    );

    // Get recent complaints
    const recentComplaints = complaints.slice(0, 10).map((c) => ({
      id: c.id,
      category: c.category.name,
      subcategory: c.subcategory?.name || null,
      status: c.status,
      priority: c.priority,
      createdAt: c.createdAt,
      resolvedAt: c.updatedAt,
      assignedOfficer:
        c.assignments && c.assignments.length > 0
          ? c.assignments[0].officer.name
          : null,
    }));

    // Sort overdue complaints by days overdue (descending)
    const sortedOverdueComplaints = overdueList.sort(
      (a, b) => b.daysOverdue - a.daysOverdue,
    );

    return {
      ok: true,
      data: {
        department: departmentName,
        totalComplaints: complaints.length,
        resolvedCount,
        inProgressCount,
        pendingCount,
        rejectedCount,
        averageResolutionDays,
        affectedCitizens: totalAffectedCitizens,
        averagePriority: Math.round(totalPriority / complaints.length),
        overdueAssignedCount,
        categorySummary,
        recentComplaints,
        overdueAssignedComplaints: sortedOverdueComplaints,
      },
    };
  } catch (error) {
    console.error("[getDepartmentComplaintReportAction] Error:", error);
    return {
      ok: false,
      error: `Failed to fetch department complaint report: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
