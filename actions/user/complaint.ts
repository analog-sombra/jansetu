"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MediaType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { attachComplaintToCluster } from "@/lib/complaintCluster";

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
  clusterId?: string;
  clusterComplaintCount?: number;
  error?: string;
};

type AddComplaintMediaActionResult = {
  ok: boolean;
  createdCount?: number;
  error?: string;
};

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_COUNT = 10;

function getFileExtension(file: File): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  const byMime = mimeToExt[file.type];
  if (byMime) {
    return byMime;
  }

  const lastDot = file.name.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === file.name.length - 1) {
    return "jpg";
  }

  return file.name.slice(lastDot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
}

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

export type UserComplaintDetailResponse = {
  id: number;
  type: string;
  message: string;
  proofUrl: string | null;
  createdAt: string;
};

export type UserComplaintDetailAssignment = {
  id: number;
  status: string;
  dueDate: string;
  officer: {
    name: string;
    designation: string;
    department: {
      name: string;
    };
  };
  responses: UserComplaintDetailResponse[];
};

export type UserComplaintOfficerHistoryItem = {
  id: number;
  createdAt: string;
  isCurrent: boolean;
  assignedByName: string | null;
  officer: {
    name: string;
    designation: string;
    department: {
      name: string;
    };
  };
};

export type UserComplaintDetailItem = {
  id: number;
  category: string;
  subcategory: string | null;
  description: string;
  status: string;
  plannedCompletionDate: string | null;
  createdAt: string;
  area: string | null;
  lat: number;
  lng: number;
  media: Array<{ id: number; fileUrl: string; type: string }>;
  assignments: UserComplaintDetailAssignment[];
  officerAssignmentHistory: UserComplaintOfficerHistoryItem[];
  cluster: {
    clusterId: string;
    departmentName: string;
    complaintCount: number;
    bucketSizeMeters: number;
  } | null;
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

type GetMyComplaintDetailActionResult =
  | {
      ok: true;
      complaint: UserComplaintDetailItem;
    }
  | {
      ok: false;
      error: string;
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
    const complaint = await prisma.$transaction(async (tx) => {
      const createdComplaint = await tx.complaint.create({
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

      const clusterId = await attachComplaintToCluster(tx, {
        complaintId: createdComplaint.id,
        category,
        subcategory,
        area,
        lat,
        lng,
      });

      const clusterComplaintCount = await tx.complaintCluster.count({
        where: { clusterId },
      });

      return {
        id: createdComplaint.id,
        clusterId,
        clusterComplaintCount,
      };
    });

    return {
      ok: true,
      complaintId: complaint.id,
      clusterId: complaint.clusterId,
      clusterComplaintCount: complaint.clusterComplaintCount,
    };
  } catch {
    return { ok: false, error: "Could not submit complaint. Please try again." };
  }
}

export async function addComplaintMediaAction(
  formData: FormData,
): Promise<AddComplaintMediaActionResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, error: "Please login again to continue." };
  }

  const complaintIdRaw = formData.get("complaintId");
  const complaintId = Number(complaintIdRaw);

  if (!Number.isInteger(complaintId) || complaintId <= 0) {
    return { ok: false, error: "Invalid complaint reference." };
  }

  const files = formData
    .getAll("files")
    .filter((item): item is File => item instanceof File);

  if (files.length === 0) {
    return { ok: false, error: "No media files were provided." };
  }

  if (files.length > MAX_IMAGE_COUNT) {
    return { ok: false, error: "You can upload up to 10 images per complaint." };
  }

  const hasInvalidFile = files.some(
    (file) => !file.type.startsWith("image/") || file.size > MAX_FILE_SIZE_BYTES,
  );

  if (hasInvalidFile) {
    return { ok: false, error: "Only images up to 2 MB are allowed." };
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

    const targetDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "complaints",
      String(complaintId),
    );

    await mkdir(targetDir, { recursive: true });

    const mediaRows: Array<{ complaintId: number; fileUrl: string; type: MediaType }> = [];

    for (const file of files) {
      const extension = getFileExtension(file);
      const filename = `${Date.now()}-${randomUUID()}.${extension}`;
      const filePath = path.join(targetDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());

      await writeFile(filePath, buffer);

      mediaRows.push({
        complaintId,
        fileUrl: `/uploads/complaints/${complaintId}/${filename}`,
        type: "IMAGE",
      });
    }

    const result = await prisma.complaintMedia.createMany({
      data: mediaRows,
    });

    return {
      ok: true,
      createdCount: result.count,
    };
  } catch {
    return { ok: false, error: "Could not save complaint media. Please try again." };
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

export async function getMyComplaintDetailAction(
  complaintIdInput: number,
): Promise<GetMyComplaintDetailActionResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, error: "Please login again to continue." };
  }

  const complaintId = Number(complaintIdInput);
  if (!Number.isInteger(complaintId) || complaintId <= 0) {
    return { ok: false, error: "Invalid complaint selected." };
  }

  try {
    const complaint = await prisma.complaint.findFirst({
      where: {
        id: complaintId,
        userId: user.id,
      },
      select: {
        id: true,
        category: true,
        subcategory: true,
        description: true,
        status: true,
        plannedCompletionDate: true,
        createdAt: true,
        area: true,
        lat: true,
        lng: true,
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
                proofUrl: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        officerAssignments: {
          select: {
            id: true,
            createdAt: true,
            isCurrent: true,
            assignedByUser: {
              select: {
                name: true,
              },
            },
            officer: {
              select: {
                name: true,
                designation: true,
                department: {
                  select: {
                    name: true,
                  },
                },
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
    });

    if (!complaint) {
      return { ok: false, error: "Complaint not found." };
    }

    let cluster = null;
    const primaryCluster = complaint.complaintClusters[0];
    if (primaryCluster) {
      const clusterComplaintCount = await prisma.complaintCluster.count({
        where: { clusterId: primaryCluster.clusterId },
      });

      cluster = {
        clusterId: primaryCluster.clusterId,
        departmentName: primaryCluster.departmentName,
        complaintCount: clusterComplaintCount,
        bucketSizeMeters: 500,
      };
    }

    return {
      ok: true,
      complaint: {
        id: complaint.id,
        category: complaint.category,
        subcategory: complaint.subcategory,
        description: complaint.description,
        status: complaint.status,
        plannedCompletionDate: complaint.plannedCompletionDate
          ? complaint.plannedCompletionDate.toISOString()
          : null,
        createdAt: complaint.createdAt.toISOString(),
        area: complaint.area,
        lat: complaint.lat,
        lng: complaint.lng,
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
        officerAssignmentHistory: complaint.officerAssignments.map((entry) => ({
          id: entry.id,
          createdAt: entry.createdAt.toISOString(),
          isCurrent: entry.isCurrent,
          assignedByName: entry.assignedByUser?.name ?? null,
          officer: entry.officer,
        })),
        cluster,
      },
    };
  } catch {
    return { ok: false, error: "Unable to fetch complaint details." };
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
