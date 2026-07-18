"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MEDIATYPE } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireCampUser } from "./_shared";

type AddCampComplaintMediaActionResult = {
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

export async function addCampComplaintMediaAction(
  formData: FormData,
): Promise<AddCampComplaintMediaActionResult> {
  const auth = await requireCampUser();
  if (!auth.ok) {
    return auth;
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
        createdByUserId: auth.user.id,
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

    const mediaRows: Array<{ complaintId: number; fileUrl: string; type: MEDIATYPE }> = [];

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

    const result = await prisma.complaint_media.createMany({
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