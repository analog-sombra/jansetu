"use server";

import prisma from "@/lib/prisma";
import { requireMlaPaRouteUser } from "../_shared";
import {
  DetachComplaintFromMlaPaClusterInput,
  DetachComplaintFromMlaPaClusterResult,
} from "./types";

export async function detachComplaintFromMlaPaClusterAction(
  payload: DetachComplaintFromMlaPaClusterInput,
): Promise<DetachComplaintFromMlaPaClusterResult> {
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
    const deleted = await prisma.complaint_cluster.deleteMany({
      where: {
        clusterId,
        complaintId,
      },
    });

    if (deleted.count === 0) {
      return { ok: false, error: "Complaint is not attached to this cluster." };
    }

    return {
      ok: true,
      clusterId,
      complaintId,
    };
  } catch {
    return { ok: false, error: "Unable to detach complaint from cluster." };
  }
}
