"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export type CategorySummary = {
  category: string;
  count: number;
  resolved: number;
  inProgress: number;
  pending: number;
  rejected: number;
};

export type AreaSummaryReport = {
  area: string;
  totalComplaints: number;
  resolvedCount: number;
  inProgressCount: number;
  pendingCount: number;
  rejectedCount: number;
  averageResolutionDays: number;
  affectedCitizens: number;
  averagePriority: number;
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
};

export type GetAreaSummaryReportResult =
  | {
      ok: true;
      data: AreaSummaryReport;
    }
  | {
      ok: false;
      error: string;
    };

export async function getAreaSummaryReportAction(
  area: string,
): Promise<GetAreaSummaryReportResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        ok: false,
        error: "Please login again to continue.",
      };
    }

    if (!area || area.trim() === "") {
      return {
        ok: false,
        error: "Area is required",
      };
    }

    // Fetch all complaints for the specific area
    const complaints = await prisma.complaint.findMany({
      where: {
        area: area,
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
        officerAssignments: {
          where: {
            isCurrent: true,
          },
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
          area,
          totalComplaints: 0,
          resolvedCount: 0,
          inProgressCount: 0,
          pendingCount: 0,
          rejectedCount: 0,
          averageResolutionDays: 0,
          affectedCitizens: 0,
          averagePriority: 0,
          categorySummary: [],
          recentComplaints: [],
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

    // Group by category
    const categoryMap = new Map<string, CategorySummary>();

    complaints.forEach((complaint) => {
      const status = complaint.status.toLowerCase();

      if (status === "resolved") {
        resolvedCount++;
        resolvedComplaintsCount++;

        if (complaint.updatedAt && complaint.createdAt) {
          const resolutionTime =
            (complaint.updatedAt.getTime() - complaint.createdAt.getTime()) /
            (1000 * 60 * 60 * 24); // Convert to days
          totalResolutionDays += resolutionTime;
        }
      } else if (status === "in_progress") {
        inProgressCount++;
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
        c.officerAssignments && c.officerAssignments.length > 0
          ? c.officerAssignments[0].officer.name
          : null,
    }));

    return {
      ok: true,
      data: {
        area,
        totalComplaints: complaints.length,
        resolvedCount,
        inProgressCount,
        pendingCount,
        rejectedCount,
        averageResolutionDays,
        affectedCitizens: totalAffectedCitizens,
        averagePriority: Math.round(totalPriority / complaints.length),
        categorySummary,
        recentComplaints,
      },
    };
  } catch (error) {
    console.error("[getAreaSummaryReportAction] Error:", error);
    return {
      ok: false,
      error: `Failed to fetch area summary report: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
