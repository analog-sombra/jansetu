import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const uploadDir = path.join(process.cwd(), "public", "uploads");

export async function saveFileLocally(file: File) {
  await mkdir(uploadDir, { recursive: true });

  const extension = file.name.split(".").pop() ?? "bin";
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const absolutePath = path.join(uploadDir, fileName);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await writeFile(absolutePath, buffer);

  return {
    fileUrl: `/uploads/${fileName}`,
    mimeType: file.type,
  };
}

export function detectMediaType(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return "IMAGE" as const;
  }
  if (mimeType.startsWith("video/")) {
    return "VIDEO" as const;
  }
  return "DOCUMENT" as const;
}
