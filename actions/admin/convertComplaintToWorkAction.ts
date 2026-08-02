"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { COMPLAINTSTATUS } from "@prisma/client";

export type ConvertComplaintToWorkResult =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function convertComplaintToWorkAction(
  complaintId: number,
  workId: number,
): Promise<ConvertComplaintToWorkResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        ok: false,
        error: "Please login again to continue.",
      };
    }

    // Verify complaint exists
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return {
        ok: false,
        error: "Complaint not found",
      };
    }

    // Verify work exists
    const work = await prisma.work.findUnique({
      where: { id: workId },
    });

    if (!work) {
      return {
        ok: false,
        error: "Work not found",
      };
    }

    // Check if mapping already exists
    const existingMapping = await prisma.complaint_work.findUnique({
      where: {
        complaintId_workId: {
          complaintId,
          workId,
        },
      },
    });

    if (existingMapping) {
      return {
        ok: false,
        error: "This complaint is already mapped to this work",
      };
    }

    // Create mapping and update complaint status
    await prisma.$transaction([
      prisma.complaint_work.create({
        data: {
          complaintId,
          workId,
        },
      }),
      prisma.complaint.update({
        where: { id: complaintId },
        data: {
          status: COMPLAINTSTATUS.WORKS,
        },
      }),
    ]);

    return {
      ok: true,
      message: `Complaint #${complaintId} has been successfully mapped to work #${workId} and status changed to WORKS`,
    };
  } catch (error) {
    console.error("[convertComplaintToWorkAction] Error:", error);
    return {
      ok: false,
      error: `Failed to convert complaint to work: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
