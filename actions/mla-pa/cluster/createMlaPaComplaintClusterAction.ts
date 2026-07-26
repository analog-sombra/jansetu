"use server";

import prisma from "@/lib/prisma";
import { requireMlaPaRouteUser } from "../_shared";
import {
  buildManualClusterId,
  getComplaintClusterPayload,
  parseComplaintIds,
} from "./_shared";
import {
  CreateMlaPaComplaintClusterInput,
  CreateMlaPaComplaintClusterResult,
} from "./types";

export async function createMlaPaComplaintClusterAction(
  payload: CreateMlaPaComplaintClusterInput,
): Promise<CreateMlaPaComplaintClusterResult> {
  const auth = await requireMlaPaRouteUser();
  if (!auth.ok) {
    return auth;
  }

  const title = payload.title.trim();
  const complaintIds = parseComplaintIds(payload.complaintIds);

  if (title.length < 3) {
    return { ok: false, error: "Please provide a cluster title." };
  }

  if (complaintIds.length === 0) {
    return { ok: false, error: "Please select at least one complaint." };
  }

  if (complaintIds.length > 50) {
    return { ok: false, error: "You can cluster up to 50 complaints at once." };
  }

  try {
    const clusterId = buildManualClusterId(title);

    const complaintPayloads = await Promise.all(
      complaintIds.map((complaintId) => getComplaintClusterPayload(complaintId)),
    );

    const missingComplaint = complaintPayloads.some((item) => item === null);
    if (missingComplaint) {
      return { ok: false, error: "One or more selected complaints were not found." };
    }

    await prisma.complaint_cluster.createMany({
      data: complaintPayloads.map((item) => ({
        complaintId: item!.complaintId,
        clusterId,
        departmentName: item!.departmentName,
        category: item!.category,
        subcategory: item!.subcategory,
        areaKey: item!.areaKey,
        latBucket: item!.latBucket,
        lngBucket: item!.lngBucket,
      })),
    });

    return {
      ok: true,
      clusterId,
      complaintsCount: complaintPayloads.length,
    };
  } catch {
    return { ok: false, error: "Unable to create cluster." };
  }
}
