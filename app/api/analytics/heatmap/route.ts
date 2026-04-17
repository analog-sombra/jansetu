import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const complaints = await prisma.complaint.findMany({
    select: { lat: true, lng: true, status: true, category: true },
  });

  const grouped = new Map<
    string,
    {
      lat: number;
      lng: number;
      count: number;
      resolved: number;
      categories: Record<string, number>;
    }
  >();

  for (const complaint of complaints) {
    const latBucket = Number(complaint.lat.toFixed(2));
    const lngBucket = Number(complaint.lng.toFixed(2));
    const key = `${latBucket}:${lngBucket}`;

    const existing = grouped.get(key) ?? {
      lat: latBucket,
      lng: lngBucket,
      count: 0,
      resolved: 0,
      categories: {},
    };

    existing.count += 1;
    existing.categories[complaint.category] =
      (existing.categories[complaint.category] ?? 0) + 1;

    if (complaint.status === "RESOLVED") {
      existing.resolved += 1;
    }

    grouped.set(key, existing);
  }

  return NextResponse.json({
    ok: true,
    heatmap: Array.from(grouped.values()),
  });
}
