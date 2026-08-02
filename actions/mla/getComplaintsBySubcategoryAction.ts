"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
// import { isMlaRole } from "./_shared";

export type ComplaintDetail = {
  id: number;
  category: string;
  subcategory: string | null;
  description: string;
  status: string;
  area: string | null;
  affectedCitizensCount: number;
  createdAt: Date;
  citizenName: string;
  citizenMobile: string;
  assignedOfficers: string[];
};

export type SubcategoryGroup = {
  subcategoryName: string | null;
  count: number;
  complaints: ComplaintDetail[];
};

export type GetComplaintsBySubcategoryResult = {
  ok: boolean;
  subcategories?: SubcategoryGroup[];
  error?: string;
};

export async function getComplaintsBySubcategoryAction(): Promise<GetComplaintsBySubcategoryResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, error: "Please login again to continue." } as const;
  }

//   const isAuthorized = isMlaRole(user.role);

//   if (!isAuthorized) {
//     return {
//       ok: false,
//       error: "You are not authorized for this section.",
//     } as const;
//   }

  try {
    const complaints = await prisma.complaint.findMany({
      orderBy: [{ subcategory: { name: "asc" } }, { createdAt: "desc" }],
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
        area: true,
        affectedCitizensCount: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            mobile: true,
          },
        },
        officerAssignments: {
          where: { isCurrent: true },
          select: {
            officer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Group by subcategory
    const groupedMap = new Map<string | null, ComplaintDetail[]>();

    complaints.forEach((complaint) => {
      const subcategoryKey = complaint.subcategory?.name ?? null;

      const complaintDetail: ComplaintDetail = {
        id: complaint.id,
        category: complaint.category.name,
        subcategory: complaint.subcategory?.name ?? null,
        description: complaint.description,
        status: complaint.status,
        area: complaint.area,
        affectedCitizensCount: complaint.affectedCitizensCount,
        createdAt: complaint.createdAt,
        citizenName: complaint.user.name ?? "N/A",
        citizenMobile: complaint.user.mobile ?? "N/A",
        assignedOfficers: complaint.officerAssignments.map((a) => a.officer.name),
      };

      const existing = groupedMap.get(subcategoryKey) || [];
      groupedMap.set(subcategoryKey, [...existing, complaintDetail]);
    });

    // Convert to array format
    const subcategories: SubcategoryGroup[] = Array.from(groupedMap.entries())
      .map(([name, complaints]) => ({
        subcategoryName: name,
        count: complaints.length,
        complaints,
      }))
      .sort((a, b) => (b.count - a.count));

    return {
      ok: true,
      subcategories,
    };
  } catch (error) {
    console.error("Error fetching complaints by subcategory:", error);
    return {
      ok: false,
      error: "Failed to fetch complaints",
    };
  }
}
