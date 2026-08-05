"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { WORKMEDIATYPE } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminUser } from "./_shared";

type CreateAdminComplaintMediaResult =
  | {
      ok: true;
      createdCount: number;
    }
  | {
      ok: false;
      error: string;
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

  return (
    file.name.slice(lastDot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg"
  );
}

export async function createAdminComplaintMediaAction(
  formData: FormData,
): Promise<CreateAdminComplaintMediaResult> {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth;
  }

  const complaintIdRaw = formData.get("complaintId");
  const complaintId = Number(complaintIdRaw);
  const mediaTypeRaw = formData.get("mediaType");
  const mediaType = (mediaTypeRaw as WORKMEDIATYPE) || "PROGRESS";
  const captionRaw = formData.get("caption");
  const caption = typeof captionRaw === "string" ? captionRaw.trim() : "";

  if (!Number.isInteger(complaintId) || complaintId <= 0) {
    return { ok: false, error: "Invalid complaint reference." };
  }

  const validTypes: WORKMEDIATYPE[] = ["BEFORE", "PROGRESS", "AFTER", "DOCUMENT"];
  if (!validTypes.includes(mediaType)) {
    return { ok: false, error: "Invalid media type." };
  }

  if (caption.length > 255) {
    return {
      ok: false,
      error: "Caption is too long. Keep it within 255 characters.",
    };
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
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
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

    const mediaRows: Array<{
      complaintId: number;
      fileUrl: string;
      type: WORKMEDIATYPE;
      caption?: string;
      uploaded_by_user_id: string;
    }> = [];

    for (const file of files) {
      const extension = getFileExtension(file);
      const filename = `${Date.now()}-${randomUUID()}.${extension}`;
      const filePath = path.join(targetDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());

      await writeFile(filePath, buffer);

      mediaRows.push({
        complaintId,
        fileUrl: `/uploads/complaints/${complaintId}/${filename}`,
        type: mediaType,
        caption: caption || undefined,
        uploaded_by_user_id: auth.user.id,
      });
    }

    const result = await prisma.complaint_media.createMany({
      data: mediaRows,
    });

    return {
      ok: true,
      createdCount: result.count,
    };
  } catch (error) {
    console.error("[createAdminComplaintMediaAction] Failed:", error);
    return { ok: false, error: "Could not save complaint media. Please try again." };
  }
}
