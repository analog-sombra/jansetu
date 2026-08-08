"use server";

import prisma from "@/lib/prisma";
import { CampComplaintDetailResult } from "./types";

export async function getCampComplaintDetailAction(
  complaintIdInput: number,
): Promise<CampComplaintDetailResult> {
  const complaintId = Number(complaintIdInput);
  if (!Number.isInteger(complaintId) || complaintId <= 0) {
    return { ok: false, error: "Invalid complaint selected." };
  }

  try {
    const complaint = await prisma.complaint.findFirst({
      where: {
        id: complaintId,
      },
      select: {
        id: true,
        category: {
          select: {
            name: true,
          },
        },
        subcategory: true,
        description: true,
        address: true,
        affectedCitizensCount: true,
        status: true,
        plannedCompletionDate: true,
        lat: true,
        lng: true,
        sublocality: {
          select: {
            name: true,
            locality: {
              select: {
                name: true,
              },
            },
          },
        },
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
          select: {
            id: true,
            status: true,
            dueDate: true,
            officer: {
              select: {
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
      const clusterComplaints = await prisma.complaint_cluster.findMany({
        where: { clusterId: primaryCluster.clusterId },
        select: {
          complaint: {
            select: {
              affectedCitizensCount: true,
            },
          },
        },
      });

      const clusterComplaintCount = clusterComplaints.length;
      const totalAffectedCitizensCount = clusterComplaints.reduce(
        (sum, entry) => sum + entry.complaint.affectedCitizensCount,
        0,
      );

      cluster = {
        clusterId: primaryCluster.clusterId,
        departmentName: primaryCluster.departmentName,
        complaintCount: clusterComplaintCount,
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
        complaintAddress: complaint.address ?? null,
        category: complaint.category.name,
        subcategory: complaint.subcategory?.name ?? null,
        description: complaint.description,
        affectedCitizensCount: complaint.affectedCitizensCount,
        status: complaint.status,
        plannedCompletionDate: complaint.plannedCompletionDate
          ? complaint.plannedCompletionDate.toISOString()
          : null,
        lat: complaint.lat,
        lng: complaint.lng,
        locality: complaint.sublocality?.locality?.name ?? null,
        sublocality: complaint.sublocality?.name ?? null,
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
