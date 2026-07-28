"use server";

import prisma from "@/lib/prisma";
import { requireWorksManagerUser, checkWorkAccess } from "./_shared";
import { ActionResult, WorkMediaDTO } from "./types";
import { WORKMEDIATYPE } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function uploadMediaAction(payload: {
  workId: number;
  taskId?: number;
  type: string;
  caption?: string;
  fileName: string;
  fileSize: number;
  fileData: string; // base64 encoded file data
}): Promise<ActionResult<WorkMediaDTO>> {
  const auth = await requireWorksManagerUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    const { workId, taskId, type, caption, fileName, fileSize, fileData } = payload;

    if (!Object.values(WORKMEDIATYPE).includes(type.toUpperCase() as WORKMEDIATYPE)) {
      return {
        ok: false,
        error: `Invalid media type. Must be one of: ${Object.values(WORKMEDIATYPE).join(", ")}`,
      };
    }

    if (fileSize > 10 * 1024 * 1024) {
      return { ok: false, error: "File size must not exceed 10MB" };
    }

    const work = await prisma.work.findUnique({
      where: { id: workId },
      include: { created_by_user: true },
    });

    if (!work) {
      return { ok: false, error: "Work not found" };
    }

    if (!checkWorkAccess(work, auth.user)) {
      return { ok: false, error: "You don't have access to this work" };
    }

    if (taskId) {
      const task = await prisma.work_task.findUnique({
        where: { id: taskId },
      });

      if (!task || task.work_id !== workId) {
        return { ok: false, error: "Task not found or does not belong to this work" };
      }
    }

    // Write file to disk
    try {
      const uploadDir = join(process.cwd(), "public", "upload", workId.toString());
      await mkdir(uploadDir, { recursive: true });

      const timestamp = Date.now();
      const filename = `${timestamp}_${fileName}`;
      const filepath = join(uploadDir, filename);

      // Convert base64 to buffer and write file
      const buffer = Buffer.from(fileData, "base64");
      await writeFile(filepath, buffer);

      const filePath = `/upload/${workId}/${filename}`;

      const media = await prisma.work_media.create({
        data: {
          work_id: workId,
          task_id: taskId || null,
          type: type.toUpperCase() as WORKMEDIATYPE,
          file_path: filePath,
          caption: caption || null,
          uploaded_by_user_id: auth.user.id,
        },
        include: {
          uploaded_by_user: { select: { id: true, name: true } },
        },
      });

      await prisma.audit_log.create({
        data: {
          actorUserId: auth.user.id,
          workId: workId,
          action: "media_uploaded",
          meta: {
            media_id: media.id,
            file_name: fileName,
            media_type: media.type,
            task_id: taskId,
          },
        },
      });

      await prisma.work_update.create({
        data: {
          work_id: workId,
          message: `Media uploaded: ${fileName}`,
          created_by_user_id: auth.user.id,
        },
      });

      return {
        ok: true,
        data: {
          id: media.id,
          file_path: media.file_path,
          type: media.type,
          caption: media.caption,
          uploaded_by: media.uploaded_by_user.name || "Unknown",
          created_at: media.createdAt,
        },
      };
    } catch (fileError) {
      console.error("File write error:", fileError);
      return { ok: false, error: "Failed to save file" };
    }
  } catch (error) {
    console.error("Upload media action error:", error);
    return { ok: false, error: "Failed to upload media" };
  }
}
