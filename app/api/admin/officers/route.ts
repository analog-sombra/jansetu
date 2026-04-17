import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_DEPARTMENT_MAP } from "@/lib/constants";

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawCategory = url.searchParams.get("category");
  const category = rawCategory?.trim();

  const relatedDepartments = category ? (CATEGORY_DEPARTMENT_MAP[category] ?? []) : [];

  const officers = await prisma.officer.findMany({
    where:
      relatedDepartments.length > 0
        ? { department: { name: { in: relatedDepartments } } }
        : undefined,
    include: { department: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ ok: true, officers });
}
