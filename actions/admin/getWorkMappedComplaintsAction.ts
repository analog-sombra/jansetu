"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export type WorkMappedComplaint = {
  id: number;
  complaintId: number;
  complaint: {
    id: number;
    category: string;
    subcategory: string | null;
    description: string;
    status: string;
    sublocality: string | null;
    affectedCitizensCount: number;
    priority: number;
    user: {
      name: string | null;
      mobile: string;
    };
    createdAt: Date;
  };
  mappedAt: Date;
};

export type GetWorkMappedComplaintsResult =
  | {
      ok: true;
      complaints: WorkMappedComplaint[];
    }
  | {
      ok: false;
      error: string;
    };

export async function getWorkMappedComplaintsAction(
  workId: number,
): Promise<GetWorkMappedComplaintsResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        ok: false,
        error: "Please login again to continue.",
      };
    }

    const mappings = await prisma.complaint_work.findMany({
      where: {
        workId: workId,
      },
      include: {
        complaint: {
          select: {
            id: true,
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
            description: true,
            status: true,
            sublocality: {
              select: {
                name: true,
              },
            },
            affectedCitizensCount: true,
            priority: true,
            user: {
              select: {
                name: true,
                mobile: true,
              },
            },
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const complaints = mappings.map((mapping) => ({
      id: mapping.id,
      complaintId: mapping.complaint.id,
      complaint: {
        id: mapping.complaint.id,
        category: mapping.complaint.category.name,
        subcategory: mapping.complaint.subcategory?.name || null,
        description: mapping.complaint.description,
        status: mapping.complaint.status,
        sublocality: mapping.complaint.sublocality?.name || null,
        affectedCitizensCount: mapping.complaint.affectedCitizensCount,
        priority: mapping.complaint.priority,
        user: {
          name: mapping.complaint.user.name,
          mobile: mapping.complaint.user.mobile,
        },
        createdAt: mapping.complaint.createdAt,
      },
      mappedAt: mapping.createdAt,
    }));

    return {
      ok: true,
      complaints,
    };
  } catch (error) {
    console.error("[getWorkMappedComplaintsAction] Error:", error);
    return {
      ok: false,
      error: `Failed to fetch mapped complaints: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
