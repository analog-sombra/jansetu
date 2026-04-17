import { NextResponse } from "next/server";
import { requireCitizen } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireCitizen();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const complaints = await prisma.complaint.findMany({
    where: { userId: session.userId },
    include: {
      media: true,
      assignments: {
        include: {
          officer: {
            include: { department: true },
          },
          responses: true,
        },
      },
      auditLogs: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, complaints });
}
