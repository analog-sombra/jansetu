"use server";

import prisma from "@/lib/prisma";
import { setAuthSession } from "@/lib/auth/session";
import { CATEGORY_DEPARTMENT_MAP } from "@/lib/constants";
import { GetOfficerAssignmentByTokenResult } from "./types";

function normalizeToken(tokenInput: string): string {
  return tokenInput.trim();
}

export async function getOfficerAssignmentByTokenAction(
  tokenInput: string,
): Promise<GetOfficerAssignmentByTokenResult> {
  const token = normalizeToken(tokenInput);

  if (!token) {
    return { ok: false, error: "Invalid or expired access token" };
  }

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { token },
      select: {
        id: true,
        complaintId: true,
        complaint: {
          select: {
            category: true,
            subcategory: true,
            description: true,
            status: true,
            plannedCompletionDate: true,
            lat: true,
            lng: true,
            area: true,
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
          },
        },
        officer: {
          select: {
            id: true,
            name: true,
            phone: true,
            department: {
              select: { name: true },
            },
          },
        },
        responses: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            message: true,
            proofUrl: true,
            createdAt: true,
          },
        },
      },
    });

    if (!assignment) {
      return { ok: false, error: "Invalid or expired access token" };
    }

    const officerMobileKey = `officer_${assignment.officer.id}`;

    const completedAssignments = await prisma.assignment.findMany({
      where: {
        officerId: assignment.officer.id,
        OR: [
          {
            status: {
              in: ["RESOLVED", "REJECTED"],
            },
          },
          {
            complaint: {
              status: {
                in: ["RESOLVED", "REJECTED", "AUTO_CLOSED"],
              },
            },
          },
          {
            responses: {
              some: {
                type: {
                  in: ["RESOLVED", "REJECTED"],
                },
              },
            },
          },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        complaintId: true,
        status: true,
        updatedAt: true,
        complaint: {
          select: {
            category: true,
            subcategory: true,
            area: true,
            status: true,
          },
        },
      },
    });

    const officerUser = await prisma.user.upsert({
      where: { mobile: officerMobileKey },
      update: {
        name: assignment.officer.name,
        role: "OFFICER",
      },
      create: {
        mobile: officerMobileKey,
        name: assignment.officer.name,
        role: "OFFICER",
        firstLoginComplete: true,
      },
      select: {
        id: true,
      },
    });

    await setAuthSession(officerUser.id, "OFFICER");

    const relevantDepartments = CATEGORY_DEPARTMENT_MAP[assignment.complaint.category] ?? [];
    const availableOfficers = await prisma.officer.findMany({
      where:
        relevantDepartments.length > 0
          ? {
              department: {
                name: {
                  in: relevantDepartments,
                },
              },
            }
          : undefined,
      orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        designation: true,
        department: {
          select: { name: true },
        },
      },
    });

    return {
      ok: true,
      assignment: {
        id: assignment.id,
        complaintId: assignment.complaintId,
        complaint: {
          category: assignment.complaint.category,
          subcategory: assignment.complaint.subcategory,
          description: assignment.complaint.description,
          status: assignment.complaint.status,
          plannedCompletionDate:
            assignment.complaint.plannedCompletionDate?.toISOString() ?? null,
          lat: assignment.complaint.lat,
          lng: assignment.complaint.lng,
          area: assignment.complaint.area,
          user: assignment.complaint.user,
          media: assignment.complaint.media,
        },
        officer: {
          id: assignment.officer.id,
          name: assignment.officer.name,
          department: assignment.officer.department,
        },
        responses: assignment.responses.map((response) => ({
          id: response.id,
          type: response.type,
          message: response.message,
          proofUrl: response.proofUrl,
          createdAt: response.createdAt.toISOString(),
        })),
        completedAssignments: completedAssignments.map((item) => ({
          id: item.id,
          complaintId: item.complaintId,
          category: item.complaint.category,
          subcategory: item.complaint.subcategory,
          area: item.complaint.area,
          status: item.complaint.status,
          completedAt: item.updatedAt.toISOString(),
        })),
        availableOfficers,
      },
    };
  } catch {
    return { ok: false, error: "Invalid or expired access token" };
  }
}
