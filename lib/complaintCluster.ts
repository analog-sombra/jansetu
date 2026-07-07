import { Prisma } from "@prisma/client";
import { CATEGORY_DEPARTMENT_MAP } from "@/lib/constants";

export const CLUSTER_BUCKET_SIZE_METERS = 500;

type ComplaintClusterInput = {
  complaintId: number;
  categoryId: number;
  categoryName: string;
  subcategoryId: number;
  subcategoryName: string;
  area: string | null;
  lat: number;
  lng: number;
};

function normalizePart(value: string | null | undefined): string {
  if (!value) {
    return "na";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "") || "na";
}

function getDepartmentName(category: string): string {
  const mapped = CATEGORY_DEPARTMENT_MAP[category] ?? [];
  return mapped[0] ?? "UNASSIGNED";
}

export function get500mBuckets(lat: number, lng: number) {
  const latMetersPerDegree = 111320;
  const lngMetersPerDegree = 111320 * Math.cos((lat * Math.PI) / 180);

  const latBucket = Math.round((lat * latMetersPerDegree) / CLUSTER_BUCKET_SIZE_METERS);
  const lngBucket = Math.round((lng * lngMetersPerDegree) / CLUSTER_BUCKET_SIZE_METERS);

  return {
    latBucket,
    lngBucket,
  };
}

export function getLegacyBuckets(lat: number, lng: number) {
  return {
    latBucket: Math.round(lat * 100),
    lngBucket: Math.round(lng * 100),
  };
}

export function getBucketPrecisionImpact(lat: number, lng: number) {
  const next = get500mBuckets(lat, lng);
  const legacy = getLegacyBuckets(lat, lng);

  return {
    bucketSizeMeters: CLUSTER_BUCKET_SIZE_METERS,
    legacy,
    next,
    changed:
      legacy.latBucket !== next.latBucket || legacy.lngBucket !== next.lngBucket,
  };
}

export async function attachComplaintToCluster(
  tx: Prisma.TransactionClient,
  input: ComplaintClusterInput,
): Promise<string> {
  const departmentName = getDepartmentName(input.categoryName);
  const { latBucket, lngBucket } = get500mBuckets(input.lat, input.lng);
  const areaKey = normalizePart(input.area);
  const clusterId = [
    normalizePart(departmentName),
    normalizePart(input.categoryName),
    normalizePart(input.subcategoryName),
    areaKey,
    `${latBucket}:${lngBucket}`,
  ].join("|");

  await tx.complaintCluster.create({
    data: {
      complaintId: input.complaintId,
      clusterId,
      departmentName,
      category: input.categoryName,
      subcategory: input.subcategoryName,
      areaKey,
      latBucket,
      lngBucket,
    },
  });

  return clusterId;
}
