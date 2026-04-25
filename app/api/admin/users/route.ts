import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mobile = request.nextUrl.searchParams.get("mobile")?.trim();
  const role = request.nextUrl.searchParams.get("role")?.trim();
  const parsedRole = role && Object.values(UserRole).includes(role as UserRole)
    ? (role as UserRole)
    : undefined;

  if (mobile) {
    const user = await prisma.user.findFirst({
      where: {
        mobile,
        role: parsedRole,
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        role: true,
        address: true,
      },
    });

    return NextResponse.json({ ok: true, user });
  }

  const users = await prisma.user.findMany({
    where: {
      role: parsedRole,
    },
    select: {
      id: true,
      name: true,
      mobile: true,
      role: true,
      address: true,
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return NextResponse.json({ ok: true, users });
}
