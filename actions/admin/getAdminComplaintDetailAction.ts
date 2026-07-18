"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isAdminRole } from "./_shared";
import { isMlaPaRouteRole } from "@/actions/mla-pa/_shared";
import { AdminComplaintDetailResult } from "./types";

export async function getAdminComplaintDetailAction(
  complaintIdInput: number,
): Promise<AdminComplaintDetailResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, error: "Please login again to continue." } as const;
  }

  const isAuthorized = isAdminRole(user.role) || isMlaPaRouteRole(user.role);

  if (!isAuthorized) {
    return {
      ok: false,
      error: "You are not authorized for this section.",
    } as const;
  }

  const complaintId = Number(complaintIdInput);
  if (!Number.isInteger(complaintId) || complaintId <= 0) {
    return { ok: false, error: "Invalid complaint selected." };
  }

  try {
    const [complaint, officers] = await Promise.all([
      prisma.complaint.findUnique({
        where: { id: complaintId },
        select: {
          id: true,
          category: {
            select: {
              name: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
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
              token: true,
              officer: {
                select: {
                  id: true,
                  name: true,
                  designation: true,
                  department: {
                    select: { name: true, id: true },
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
                  assignment: {
                    select: {
                      officer: {
                        select: {
                          id: true,
                          name: true,
                          designation: true,
                          department: {
                            select: { name: true, id: true },
                          },
                        },
                      },
                    },
                  },
                },
                orderBy: { createdAt: "desc" },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          officerAssignments: {
            select: {
              id: true,
              createdAt: true,
              isCurrent: true,
              officer: {
                select: {
                  id: true,
                  name: true,
                  designation: true,
                  department: {
                    select: { name: true, id: true },
                  },
                },
              },
              assignedByUser: {
                select: {
                  name: true,
                },
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
      }),
      prisma.officer.findMany({
        orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          designation: true,
          department: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

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
              id: true,
              category: {
                select: {
                  name: true,
                },
              },
              subcategory: true,
              status: true,
              area: true,
              affectedCitizensCount: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          complaint: {
            createdAt: "desc",
          },
        },
      });

      const clusterComplaintList = clusterComplaints
        .filter((entry) => entry.complaint !== null)
        .map((entry) => ({
          id: entry.complaint.id,
          category: entry.complaint.category.name,
          subcategory: entry.complaint.subcategory?.name ?? null,
          status: entry.complaint.status,
          area: entry.complaint.area,
          affectedCitizensCount: entry.complaint.affectedCitizensCount,
          createdAt: entry.complaint.createdAt.toISOString(),
          isCurrentComplaint: entry.complaint.id === complaint.id,
        }));

      const totalAffectedCitizensCount = clusterComplaintList.reduce(
        (sum, item) => sum + item.affectedCitizensCount,
        0,
      );

      cluster = {
        clusterId: primaryCluster.clusterId,
        departmentName: primaryCluster.departmentName,
        complaintCount: clusterComplaintList.length,
        totalAffectedCitizensCount,
        bucketSizeMeters: 500,
        complaints: clusterComplaintList,
      };
    }

    return {
      ok: true,
      complaint: {
        id: complaint.id,
        user: complaint.user,
        category: complaint.category.name,
        subcategory: complaint.subcategory?.name ?? null,
        description: complaint.description,
        affectedCitizensCount: complaint.affectedCitizensCount,
        status: complaint.status,
        plannedCompletionDate:
          complaint.plannedCompletionDate?.toISOString() ?? null,
        lat: complaint.lat,
        lng: complaint.lng,
        area: complaint.area,
        media: complaint.media,
        assignments: complaint.assignments.map((assignment) => ({
          id: assignment.id,
          status: assignment.status,
          dueDate: assignment.dueDate.toISOString(),
          officer: assignment.officer,
          token: assignment.token,
          responses: assignment.responses.map((response) => ({
            id: response.id,
            type: response.type,
            message: response.message,
            proofUrl: response.proofUrl,
            createdAt: response.createdAt.toISOString(),
            officer: response.assignment.officer,
          })),
        })),
        officerAssignmentHistory: complaint.officerAssignments.map((entry) => ({
          id: entry.id,
          createdAt: entry.createdAt.toISOString(),
          isCurrent: entry.isCurrent,
          officer: entry.officer,
          assignedByName: entry.assignedByUser?.name ?? null,
        })),
        categoryDepartment: complaint.category.department,
        cluster,
      },
      officers,
    };
  } catch (e) {
    console.error("Error fetching complaint details:", e);

    return { ok: false, error: "Unable to fetch complaint details." };
  }
}
