import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;

  const assignment = await prisma.assignment.findUnique({
    where: { token },
    include: {
      officer: {
        include: { department: true },
      },
      complaint: {
        include: {
          user: {
            select: { name: true, mobile: true, address: true },
          },
          media: true,
        },
      },
      responses: true,
    },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, assignment });
}
