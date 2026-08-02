"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export type CompleteInvitationMeetingResult =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function completeInvitationMeetingAction(
  meetingId: number,
  photoBase64?: string,
  photoFileName?: string,
): Promise<CompleteInvitationMeetingResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      ok: false,
      error: "Please login again to continue.",
    };
  }

  if (user.role !== "CAMP_HEAD") {
    return {
      ok: false,
      error: "You are not authorized for this action.",
    };
  }

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      return {
        ok: false,
        error: "Meeting not found.",
      };
    }

    let photoPath = null;

    // Save photo if provided
    if (photoBase64 && photoFileName) {
      try {
        // Convert base64 to buffer
        const buffer = Buffer.from(photoBase64, "base64");

        // Create upload directory if it doesn't exist
        const uploadDir = join(process.cwd(), "public", "upload");
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const uniqueFileName = `invitation_${meetingId}_${timestamp}_${photoFileName}`;
        const filePath = join(uploadDir, uniqueFileName);

        // Write file
        await writeFile(filePath, buffer);

        // Store relative path for database
        photoPath = `/upload/${uniqueFileName}`;
      } catch (fileError) {
        console.error("[completeInvitationMeetingAction] File upload error:", fileError);
        return {
          ok: false,
          error: "Failed to upload photo.",
        };
      }
    }

    // Update meeting with completion details
    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        completedAt: new Date(),
        // Store photo path in a field if available
        // For now we'll store it in selectedStaffNames or create a new field
        selectedStaffNames: photoPath || meeting.selectedStaffNames,
      },
    });

    return {
      ok: true,
      message: "Meeting marked as completed successfully.",
    };
  } catch (error) {
    console.error("[completeInvitationMeetingAction] Error:", error);
    return {
      ok: false,
      error: "Failed to complete meeting.",
    };
  }
}
