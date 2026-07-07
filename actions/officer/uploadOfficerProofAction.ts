"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

type UploadOfficerProofActionResult =
  | {
      ok: true;
      fileUrl: string;
    }
  | {
      ok: false;
      error: string;
    };

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

export async function uploadOfficerProofAction(
  formData: FormData,
): Promise<UploadOfficerProofActionResult> {
  try {
    const file = formData.get("file") as File;
    const assignmentId = formData.get("assignmentId");

    if (!file) {
      return { ok: false, error: "No file provided" };
    }

    if (!assignmentId) {
      return { ok: false, error: "Invalid assignment reference" };
    }

    if (!file.type.startsWith("image/")) {
      return { ok: false, error: "Only image files are allowed" };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { ok: false, error: "File must be 2 MB or smaller" };
    }

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "proofs",
      String(assignmentId),
    );

    await mkdir(uploadDir, { recursive: true });

    const extension = getFileExtension(file);
    const filename = `${Date.now()}-${randomUUID()}.${extension}`;
    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/proofs/${assignmentId}/${filename}`;

    return {
      ok: true,
      fileUrl,
    };
  } catch (error) {
    console.error("Proof upload error:", error);
    return { ok: false, error: "Failed to upload proof file" };
  }
}
