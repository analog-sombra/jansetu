"use server";

import prisma from "@/lib/prisma";
import { requireMlaPaRouteUser } from "../_shared";
import { getComplaintClusterPayload } from "./_shared";
import {
  AttachComplaintToMlaPaClusterInput,
  AttachComplaintToMlaPaClusterResult,
} from "./types";

export async function attachComplaintToMlaPaClusterAction(
  payload: AttachComplaintToMlaPaClusterInput,
): Promise<AttachComplaintToMlaPaClusterResult> {
  const auth = await requireMlaPaRouteUser();
  if (!auth.ok) {
    return auth;
  }

  const clusterId = payload.clusterId.trim();
  const complaintId = Number(payload.complaintId);

  if (!clusterId) {
    return { ok: false, error: "Please select a valid cluster." };
  }

  if (!Number.isInteger(complaintId) || complaintId <= 0) {
    return { ok: false, error: "Please select a valid complaint." };
  }

  try {
    const clusterExists = await prisma.complaint_cluster.findFirst({
      where: { clusterId },
      select: { id: true },
    });

    if (!clusterExists) {
      return { ok: false, error: "Selected cluster does not exist." };
    }

    const existingLink = await prisma.complaint_cluster.findFirst({
      where: {
        clusterId,
        complaintId,
      },
      select: { id: true },
    });

    if (existingLink) {
      return { ok: false, error: "Complaint is already attached to this cluster." };
    }

    const complaintPayload = await getComplaintClusterPayload(complaintId);
    if (!complaintPayload) {
      return { ok: false, error: "Complaint not found." };
    }

    await prisma.complaint_cluster.create({
      data: {
        complaintId,
        clusterId,
        departmentName: complaintPayload.departmentName,
        category: complaintPayload.category,
        subcategory: complaintPayload.subcategory,
        areaKey: complaintPayload.areaKey,
        latBucket: complaintPayload.latBucket,
        lngBucket: complaintPayload.lngBucket,
      },
    });

    return {
      ok: true,
      clusterId,
      complaintId,
    };
  } catch {
    return { ok: false, error: "Unable to attach complaint to cluster." };
  }
}
