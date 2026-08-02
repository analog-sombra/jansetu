"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export type ComplaintsByAreaGroup = {
  area: string;
  totalComplaints: number;
  pendingCount: number;
  resolvedCount: number;
  rejectedCount: number;
  inProgressCount: number;
  averagePriority: number;
  affectedCitizens: number;
  complaints: Array<{
    id: number;
    category: string;
    subcategory: string | null;
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

export type GetComplaintsByAreaResult =
  | {
      ok: true;
      data: ComplaintsByAreaGroup[];
    }
  | {
      ok: false;
      error: string;
    };

export async function getComplaintsByAreaAction(): Promise<GetComplaintsByAreaResult> {
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


    // Group by area
    const groupedByArea = new Map<string, typeof complaints>();

    complaints.forEach((complaint) => {
      const area = complaint.area || "Unspecified Area";
      if (!groupedByArea.has(area)) {
        groupedByArea.set(area, []);
      }
      groupedByArea.get(area)!.push(complaint);
    });

    // Convert to array and calculate stats
    const result: ComplaintsByAreaGroup[] = Array.from(groupedByArea.entries())
      .map(([area, areaComplaints]) => {
        const statusCounts = {
          pending: 0,
          resolved: 0,
          rejected: 0,
          inProgress: 0,
        };

        let totalPriority = 0;
        let totalAffectedCitizens = 0;

        areaComplaints.forEach((complaint) => {
          const status = complaint.status.toLowerCase();
          if (status === "pending") statusCounts.pending++;
          if (status === "resolved") statusCounts.resolved++;
          if (status === "rejected") statusCounts.rejected++;
          if (status === "in_progress") statusCounts.inProgress++;
          
          totalPriority += complaint.priority;
          totalAffectedCitizens += complaint.affectedCitizensCount;
        });

        return {
          area,
          totalComplaints: areaComplaints.length,
          pendingCount: statusCounts.pending,
          resolvedCount: statusCounts.resolved,
          rejectedCount: statusCounts.rejected,
          inProgressCount: statusCounts.inProgress,
          averagePriority: Math.round(totalPriority / areaComplaints.length),
          affectedCitizens: totalAffectedCitizens,
          complaints: areaComplaints.map((c) => ({
            id: c.id,
            category: c.category.name,
            subcategory: c.subcategory?.name || null,
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
    console.error("[getComplaintsByAreaAction] Error:", error);
    return {
      ok: false,
      error: `Failed to fetch complaints by area: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
