"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { OfficerComplaintDetailResult } from "./types";

function resolveOfficerIdFromMobile(mobile: string): number | null {
  const match = /^officer_(\d+)$/.exec(mobile.trim());
  if (!match) {
    return null;
  }

  const officerId = Number(match[1]);
  if (!Number.isInteger(officerId) || officerId <= 0) {
    return null;
  }

  return officerId;
}

export async function getOfficerComplaintDetailAction(
  complaintIdInput: number,
): Promise<OfficerComplaintDetailResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, error: "Please login again to continue." };
  }

  if (user.role !== "OFFICER") {
    return {
      ok: false,
      error: "You are not authorized for this section.",
    };
  }

  const officerId = resolveOfficerIdFromMobile(user.mobile);
  if (!officerId) {
    return {
      ok: false,
      error: "Unable to determine officer identity from session.",
    };
  }

  const complaintId = Number(complaintIdInput);
  if (!Number.isInteger(complaintId) || complaintId <= 0) {
    return { ok: false, error: "Invalid complaint selected." };
  }

  try {
    const complaint = await prisma.complaint.findFirst({
      where: {
        id: complaintId,
        assignments: {
          some: {
            officerId,
          },
        },
      },
      select: {
        id: true,
        category: true,
        subcategory: true,
        description: true,
        affectedCitizensCount: true,
        status: true,
        plannedCompletionDate: true,
        lat: true,
        lng: true,
        area: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            mobile: true,
            address: true,
            aadhaar: true,
            voterId: true,
          },
        },
        media: {
          select: {
            id: true,
            fileUrl: true,
            type: true,
          },
          orderBy: { id: "asc" },
        },
        assignments: {
          where: {
            officerId,
          },
          select: {
            id: true,
            status: true,
            dueDate: true,
            officer: {
              select: {
                id: true,
                name: true,
                designation: true,
                department: {
                  select: { name: true },
                },
              },
            },
            responses: {
              select: {
                id: true,
                type: true,
                message: true,
                proofUrl: true,
                createdAt: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        complaintClusters: {
          select: {
            clusterId: true,
            departmentName: true,
          },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    if (!complaint) {
      return { ok: false, error: "Complaint not found." };
    }

    let cluster = null;
    const primaryCluster = complaint.complaintClusters[0];

    if (primaryCluster) {
      const clusterComplaints = await prisma.complaintCluster.findMany({
        where: { clusterId: primaryCluster.clusterId },
        select: {
          complaint: {
            select: {
              affectedCitizensCount: true,
            },
          },
        },
      });

      const complaintCount = clusterComplaints.length;
      const totalAffectedCitizensCount = clusterComplaints.reduce(
        (sum, entry) => sum + entry.complaint.affectedCitizensCount,
        0,
      );

      cluster = {
        clusterId: primaryCluster.clusterId,
        departmentName: primaryCluster.departmentName,
        complaintCount,
        totalAffectedCitizensCount,
        bucketSizeMeters: 500,
      };
    }

    return {
      ok: true,
      complaint: {
        id: complaint.id,
        citizen: {
          name: complaint.user.name ?? "Citizen",
          mobile: complaint.user.mobile,
          address: complaint.user.address ?? "",
          aadhaar: complaint.user.aadhaar ?? "",
          voterId: complaint.user.voterId ?? "",
        },
        category: complaint.category,
        subcategory: complaint.subcategory,
        description: complaint.description,
        affectedCitizensCount: complaint.affectedCitizensCount,
        status: complaint.status,
        plannedCompletionDate: complaint.plannedCompletionDate
          ? complaint.plannedCompletionDate.toISOString()
          : null,
        lat: complaint.lat,
        lng: complaint.lng,
        area: complaint.area,
        media: complaint.media,
        assignments: complaint.assignments.map((assignment) => ({
          id: assignment.id,
          status: assignment.status,
          dueDate: assignment.dueDate.toISOString(),
          officer: assignment.officer,
          responses: assignment.responses.map((response) => ({
            id: response.id,
            type: response.type,
            message: response.message,
            proofUrl: response.proofUrl,
            createdAt: response.createdAt.toISOString(),
          })),
        })),
        createdAt: complaint.createdAt.toISOString(),
        cluster,
      },
    };
  } catch {
    return { ok: false, error: "Unable to fetch complaint details." };
  }
}
