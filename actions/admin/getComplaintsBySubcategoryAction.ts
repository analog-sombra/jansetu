"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export type ComplaintsBySubcategoryGroup = {
  subcategory: string;
  category: string;
  totalComplaints: number;
  pendingCount: number;
  resolvedCount: number;
  rejectedCount: number;
  inProgressCount: number;
  averagePriority: number;
  affectedCitizens: number;
  complaints: Array<{
    id: number;
    area: string | null;
    status: string;
    priority: number;
    affectedCitizensCount: number;
    createdAt: Date;
    user: {
      name: string | null;
      mobile: string;
    };
  }>;
};

export type GetComplaintsBySubcategoryResult =
  | {
      ok: true;
      data: ComplaintsBySubcategoryGroup[];
    }
  | {
      ok: false;
      error: string;
    };

export async function getComplaintsBySubcategoryAction(): Promise<GetComplaintsBySubcategoryResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        ok: false,
        error: "Please login again to continue.",
      };
    }


    // Fetch all complaints
    const complaints = await prisma.complaint.findMany({
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
        sublocality: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            name: true,
            mobile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });


    // Group by subcategory
    const groupedBySubcategory = new Map<string, typeof complaints>();

    complaints.forEach((complaint) => {
      const subcategory = complaint.subcategory?.name || "Uncategorized";
      if (!groupedBySubcategory.has(subcategory)) {
        groupedBySubcategory.set(subcategory, []);
      }
      groupedBySubcategory.get(subcategory)!.push(complaint);
    });

    // Convert to array and calculate stats
    const result: ComplaintsBySubcategoryGroup[] = Array.from(groupedBySubcategory.entries())
      .map(([subcategory, subCategoryComplaints]) => {
        const statusCounts = {
          pending: 0,
          resolved: 0,
          rejected: 0,
          inProgress: 0,
        };

        let totalPriority = 0;
        let totalAffectedCitizens = 0;
        let categoryName = "";

        subCategoryComplaints.forEach((complaint) => {
          const status = complaint.status.toLowerCase();
          if (status === "pending") statusCounts.pending++;
          if (status === "resolved") statusCounts.resolved++;
          if (status === "rejected") statusCounts.rejected++;
          if (status === "in_progress") statusCounts.inProgress++;
          
          totalPriority += complaint.priority;
          totalAffectedCitizens += complaint.affectedCitizensCount;
          categoryName = complaint.category.name;
        });

        return {
          subcategory,
          category: categoryName,
          totalComplaints: subCategoryComplaints.length,
          pendingCount: statusCounts.pending,
          resolvedCount: statusCounts.resolved,
          rejectedCount: statusCounts.rejected,
          inProgressCount: statusCounts.inProgress,
          averagePriority: Math.round(totalPriority / subCategoryComplaints.length),
          affectedCitizens: totalAffectedCitizens,
          complaints: subCategoryComplaints.map((c) => ({
            id: c.id,
            area: c.sublocality?.name || null,
            status: c.status,
            priority: c.priority,
            affectedCitizensCount: c.affectedCitizensCount,
            createdAt: c.createdAt,
            user: {
              name: c.user.name,
              mobile: c.user.mobile,
            },
          })),
        };
      })
      .sort((a, b) => b.totalComplaints - a.totalComplaints);


    return {
      ok: true,
      data: result,
    };
  } catch (error) {
    console.error("[getComplaintsBySubcategoryAction] Error:", error);
    return {
      ok: false,
      error: `Failed to fetch complaints by subcategory: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
