import prisma from "@/lib/prisma";
import { get500mBuckets } from "@/lib/complaintCluster";

export function normalizeClusterPart(value: string | null | undefined): string {
  if (!value) {
    return "na";
  }

  return (
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") || "na"
  );
}

export function buildManualClusterId(title: string): string {
  const safeTitle = normalizeClusterPart(title).slice(0, 50);
  return `manual|${safeTitle}|${Date.now()}`;
}

export function parseComplaintIds(complaintIds: number[]): number[] {
  return Array.from(
    new Set(
      complaintIds
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0),
    ),
  );
}

export async function getComplaintClusterPayload(complaintId: number) {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    select: {
      id: true,
      area: true,
      lat: true,
      lng: true,
      category: {
        select: {
          name: true,
          department: {
            select: {
              name: true,
            },
          },
        },
      },
      subcategory: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!complaint) {
    return null;
  }

  const { latBucket, lngBucket } = get500mBuckets(complaint.lat, complaint.lng);

  return {
    complaintId: complaint.id,
    departmentName: complaint.category.department.name,
    category: complaint.category.name,
    subcategory: complaint.subcategory.name,
    areaKey: normalizeClusterPart(complaint.area),
    latBucket,
    lngBucket,
  };
}
