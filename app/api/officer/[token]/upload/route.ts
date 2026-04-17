import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveFileLocally } from "@/services/storage-service";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;

  const assignment = await prisma.assignment.findUnique({
    where: { token },
    select: { id: true },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

  const saved = await saveFileLocally(file);

  return NextResponse.json({
    ok: true,
    fileUrl: saved.fileUrl,
    type: "IMAGE",
  });
}
