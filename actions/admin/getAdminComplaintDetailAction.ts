"use server";

import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";
import { AdminComplaintDetailResult } from "./types";

export async function getAdminComplaintDetailAction(
  complaintIdInput: number,
): Promise<AdminComplaintDetailResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
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
          category: true,
          subcategory: true,
          description: true,
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
                  assignment: {
                    select: {
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
                    },
                  },
                },
                orderBy: { createdAt: "desc" },
              },
            },
            orderBy: { createdAt: "desc" },
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
            select: { name: true },
          },
        },
      }),
    ]);

    if (!complaint) {
      return { ok: false, error: "Complaint not found." };
    }

    return {
      ok: true,
      complaint: {
        id: complaint.id,
        user: complaint.user,
        category: complaint.category,
        subcategory: complaint.subcategory,
        description: complaint.description,
        status: complaint.status,
        plannedCompletionDate: complaint.plannedCompletionDate?.toISOString() ?? null,
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
            officer: response.assignment.officer,
          })),
        })),
      },
      officers,
    };
  } catch {
    return { ok: false, error: "Unable to fetch complaint details." };
  }
}
