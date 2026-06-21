"use server";

import {
  CLUSTER_BUCKET_SIZE_METERS,
  getBucketPrecisionImpact,
  get500mBuckets,
} from "@/lib/complaintCluster";

export type ComplaintClusterPrecisionImpactResult =
  | {
      ok: true;
      lat: number;
      lng: number;
      bucketSizeMeters: number;
      buckets: {
        latBucket: number;
        lngBucket: number;
      };
      impact: {
        legacy: {
          latBucket: number;
          lngBucket: number;
        };
        next: {
          latBucket: number;
          lngBucket: number;
        };
        changed: boolean;
        bucketSizeMeters: number;
      };
    }
  | {
      ok: false;
      error: string;
    };

export async function getComplaintClusterPrecisionImpactAction(
  latInput: number | string,
  lngInput: number | string,
): Promise<ComplaintClusterPrecisionImpactResult> {
  const lat = Number(latInput);
  const lng = Number(lngInput);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return {
      ok: false,
      error: "Parameter 'lat' must be a valid latitude.",
    };
  }

  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return {
      ok: false,
      error: "Parameter 'lng' must be a valid longitude.",
    };
  }

  const impact = getBucketPrecisionImpact(lat, lng);

  return {
    ok: true,
    lat,
    lng,
    bucketSizeMeters: CLUSTER_BUCKET_SIZE_METERS,
    buckets: get500mBuckets(lat, lng),
    impact,
  };
}
