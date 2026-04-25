import { NextResponse } from "next/server";
import { requireReport } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireReport();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meetings = await prisma.meeting.findMany({
    include: {
      createdByUser: {
        select: { id: true, name: true, mobile: true, role: true },
      },
      assignedToUser: {
        select: { id: true, name: true, mobile: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ ok: true, meetings });
}
