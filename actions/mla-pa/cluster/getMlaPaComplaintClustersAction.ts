"use server";

import prisma from "@/lib/prisma";
import { requireMlaPaRouteUser } from "../_shared";
import {
  GetMlaPaComplaintClustersResult,
  MlaPaClusterComplaintItem,
  MlaPaClusterSummary,
} from "./types";

export async function getMlaPaComplaintClustersAction(): Promise<GetMlaPaComplaintClustersResult> {
  const auth = await requireMlaPaRouteUser();
  if (!auth.ok) {
    return auth;
  }

  try {
    const [clusterRows, complaints] = await Promise.all([
      prisma.complaint_cluster.findMany({
        orderBy: { createdAt: "desc" },
        take: 2000,
        select: {
          clusterId: true,
          departmentName: true,
          category: true,
          subcategory: true,
          createdAt: true,
          complaintId: true,
          complaint: {
            select: {
              id: true,
              status: true,
              area: true,
              createdAt: true,
              category: {
                select: { name: true },
              },
              subcategory: {
                select: { name: true },
              },
            },
          },
        },
      }),
      prisma.complaint.findMany({
        orderBy: { createdAt: "desc" },
        take: 300,
        select: {
          id: true,
          status: true,
          area: true,
          createdAt: true,
          category: {
            select: {
              name: true,
            },
          },
          subcategory: {
            select: {
              name: true,
            },
          },
          complaintClusters: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              clusterId: true,
            },
          },
        },
      }),
    ]);

    const clusterMap = new Map<
      string,
      {
        clusterId: string;
        departmentName: string;
        category: string;
        subcategory: string | null;
        createdAt: Date;
        complaints: Map<number, MlaPaClusterComplaintItem>;
      }
    >();

    for (const row of clusterRows) {
      if (!row.complaint) {
        continue;
      }

      const existing = clusterMap.get(row.clusterId) ?? {
        clusterId: row.clusterId,
        departmentName: row.departmentName,
        category: row.category,
        subcategory: row.subcategory,
        createdAt: row.createdAt,
        complaints: new Map<number, MlaPaClusterComplaintItem>(),
      };

      if (!existing.complaints.has(row.complaint.id)) {
        existing.complaints.set(row.complaint.id, {
          complaintId: row.complaint.id,
          category: row.complaint.category.name,
          subcategory: row.complaint.subcategory?.name ?? null,
          area: row.complaint.area,
          status: row.complaint.status,
          createdAt: row.complaint.createdAt.toISOString(),
        });
      }

      if (row.createdAt < existing.createdAt) {
        existing.createdAt = row.createdAt;
      }

      clusterMap.set(row.clusterId, existing);
    }

    const clusters: MlaPaClusterSummary[] = Array.from(clusterMap.values())
      .map((item) => ({
        clusterId: item.clusterId,
        title: `${item.category}${item.subcategory ? ` / ${item.subcategory}` : ""}`,
        departmentName: item.departmentName,
        category: item.category,
        subcategory: item.subcategory,
        complaintsCount: item.complaints.size,
        createdAt: item.createdAt.toISOString(),
        complaints: Array.from(item.complaints.values()).sort(
          (left, right) => right.complaintId - left.complaintId,
        ),
      }))
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );

    return {
      ok: true,
      clusters,
      complaints: complaints.map((complaint) => ({
        id: complaint.id,
        category: complaint.category.name,
        subcategory: complaint.subcategory?.name ?? null,
        area: complaint.area,
        status: complaint.status,
        createdAt: complaint.createdAt.toISOString(),
        currentClusterId: complaint.complaintClusters[0]?.clusterId ?? null,
      })),
    };
  } catch {
    return { ok: false, error: "Unable to load complaint clusters." };
  }
}
