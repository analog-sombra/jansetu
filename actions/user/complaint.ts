"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

type AddComplaintActionInput = {
  category: string;
  subcategory: string;
  description: string;
  area?: string;
  lat: string;
  lng: string;
};

type AddComplaintActionResult = {
  ok: boolean;
  complaintId?: number;
  error?: string;
};

export type ComplaintDashboardProfile = {
  name: string | null;
  mobile: string;
  address: string | null;
};

export type ComplaintDashboardResponse = {
  id: number;
  type: string;
  message: string;
  createdAt: string;
};

export type ComplaintDashboardAssignment = {
  id: number;
  officer: {
    name: string;
    department: {
      name: string;
    };
  };
  responses: ComplaintDashboardResponse[];
};

export type ComplaintDashboardItem = {
  id: number;
  category: string;
  description: string;
  status: string;
  plannedCompletionDate: string | null;
  createdAt: string;
  assignments: ComplaintDashboardAssignment[];
  area: string;
};

type GetMyComplaintsActionResult = {
  ok: boolean;
  complaints: ComplaintDashboardItem[];
  profile: ComplaintDashboardProfile | null;
  error?: string;
};

type ConfirmResolutionActionResult = {
  ok: boolean;
  status?: "RESOLVED" | "ESCALATED";
  error?: string;
};

export async function addComplaintAction(
  payload: AddComplaintActionInput,
): Promise<AddComplaintActionResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, error: "Please login again to continue." };
  }

  if (!user.firstLoginComplete) {
    return { ok: false, error: "Please complete your profile first." };
  }

  const category = payload.category.trim();
  const subcategory = payload.subcategory.trim();
  const description = payload.description.trim();
  const area = payload.area?.trim() || null;
  const lat = Number(payload.lat);
  const lng = Number(payload.lng);

  // Validate category exists in database
  const categoryRecord = await prisma.category.findFirst({
    where: { name: category },
    select: { id: true },
  });

  if (!categoryRecord) {
    return { ok: false, error: "Please select a valid complaint category." };
  }

  // Validate subcategory exists and belongs to the category
  const subcategoryRecord = await prisma.subcategory.findFirst({
    where: {
      name: subcategory,
      categoryId: categoryRecord.id,
    },
  });

  if (!subcategoryRecord) {
    return { ok: false, error: "Please select a valid sub-category." };
  }

  if (description.length < 20) {
    return {
      ok: false,
      error: "Description must be at least 20 characters.",
    };
  }

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { ok: false, error: "Please provide a valid latitude." };
  }

  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { ok: false, error: "Please provide a valid longitude." };
  }

  try {
    const complaint = await prisma.complaint.create({
      data: {
        userId: user.id,
        createdByUserId: user.id,
        category,
        subcategory,
        description,
        area,
        lat,
        lng,
      },
      select: {
        id: true,
      },
    });

    return {
      ok: true,
      complaintId: complaint.id,
    };
  } catch {
    return { ok: false, error: "Could not submit complaint. Please try again." };
  }
}

export async function getMyComplaintsAction(): Promise<GetMyComplaintsActionResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      ok: false,
      complaints: [],
      profile: null,
      error: "Please login again to continue.",
    };
  }

  try {
    const complaints = await prisma.complaint.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        category: true,
        description: true,
        status: true,
        plannedCompletionDate: true,
        createdAt: true,
        area: true,
        assignments: {
          select: {
            id: true,
            officer: {
              select: {
                name: true,
                department: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            responses: {
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                type: true,
                message: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    return {
      ok: true,
      complaints: complaints.map((complaint) => ({
        id: complaint.id,
        category: complaint.category,
        description: complaint.description,
        status: complaint.status,
        plannedCompletionDate: complaint.plannedCompletionDate
          ? complaint.plannedCompletionDate.toISOString()
          : null,
        createdAt: complaint.createdAt.toISOString(),
        assignments: complaint.assignments.map((assignment) => ({
          id: assignment.id,
          officer: {
            name: assignment.officer.name,
            department: {
              name: assignment.officer.department.name,
            },
          },
          responses: assignment.responses.map((response) => ({
            id: response.id,
            type: response.type,
            message: response.message,
            createdAt: response.createdAt.toISOString(),
          })),
        })),
        area: complaint.area ?? "",
      })),
      profile: {
        name: user.name ?? null,
        mobile: user.mobile,
        address: user.address ?? null,
      },
    };
  } catch {
    return {
      ok: false,
      complaints: [],
      profile: null,
      error: "Unable to fetch complaints",
    };
  }
}

export async function confirmResolutionAction(
  complaintId: number,
  confirmed: boolean,
): Promise<ConfirmResolutionActionResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, error: "Please login again to continue." };
  }

  try {
    const complaint = await prisma.complaint.findFirst({
      where: {
        id: complaintId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!complaint) {
      return { ok: false, error: "Complaint not found." };
    }

    const nextStatus = confirmed ? "RESOLVED" : "ESCALATED";

    await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: nextStatus,
      },
    });

    return {
      ok: true,
      status: nextStatus,
    };
  } catch {
    return { ok: false, error: "Unable to update complaint status." };
  }
}
