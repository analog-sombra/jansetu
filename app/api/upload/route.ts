import { NextResponse } from "next/server";
import { requireCitizen } from "@/lib/auth";
import { detectMediaType, saveFileLocally } from "@/services/storage-service";

export async function POST(request: Request) {
  const session = await requireCitizen();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const saved = await saveFileLocally(file);

  return NextResponse.json({
    ok: true,
    fileUrl: saved.fileUrl,
    type: detectMediaType(saved.mimeType),
  });
}
