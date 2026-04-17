import { AssignmentStatus, ComplaintStatus, ResponseType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type HeatmapPoint = {
  lat: number;
  lng: number;
  count: number;
  resolved: number;
  intensity: "LOW" | "MEDIUM" | "HIGH";
};

type WardPerformance = {
  ward: string;
  total: number;
  resolved: number;
  resolutionRate: number;
  avgResolutionDays: number;
  color: "GREEN" | "AMBER" | "RED";
};

type MasterCase = {
  key: string;
  area: string;
  category: string;
  activeCases: number;
  icon: string;
};

type ServiceRecord = {
  category: "Power" | "Water" | "Roads" | "Sanitation";
  fixed: number;
};

type DepartmentRanking = {
  department: string;
  issuesLogged: number;
  avgResolutionDays: number;
  slaBreachPercent: number;
  workDonePhotosUploaded: number;
};

type NoticeTrigger = {
  assignmentId: number;
  ticketId: number;
  officerName: string;
  department: string;
  firstReportDate: string;
  reminderCount: number;
  daysOverdue: number;
  lat: number;
  lng: number;
};

type ProofGalleryItem = {
  complaintId: number;
  category: string;
  area: string;
  beforeUrl: string;
  afterUrl: string;
  resolvedAt: string;
};

export type ReportOverview = {
  voterHealthMap: {
    heatmap: HeatmapPoint[];
    wards: WardPerformance[];
    masterCases: MasterCase[];
  };
  voterImpact: {
    totalVotersAssisted: number;
    serviceRecord: ServiceRecord[];
    constituencySentiment: {
      positive: number;
      negative: number;
      score: number;
    };
  };
  departmentReportCard: DepartmentRanking[];
  noticeTriggerList: NoticeTrigger[];
  proofGallery: ProofGalleryItem[];
  systemicCrises: MasterCase[];
};

function toDays(ms: number) {
  return ms / (1000 * 60 * 60 * 24);
}

function categoryIcon(category: string) {
  const lower = category.toLowerCase();
  if (lower.includes("water")) return "WATER";
  if (lower.includes("electric") || lower.includes("power")) return "POWER";
  if (lower.includes("road")) return "ROAD";
  if (lower.includes("sanitation") || lower.includes("garbage")) return "SANITATION";
  if (lower.includes("health")) return "HEALTH";
  return "ALERT";
}

function normalizeServiceCategory(category: string): ServiceRecord["category"] | null {
  const lower = category.toLowerCase();
  if (lower.includes("electric") || lower.includes("power")) return "Power";
  if (lower.includes("water")) return "Water";
  if (lower.includes("road")) return "Roads";
  if (lower.includes("sanitation") || lower.includes("garbage") || lower.includes("drain")) {
    return "Sanitation";
  }
  return null;
}

export async function buildReportOverview(): Promise<ReportOverview> {
  const [complaints, sentimentPositive, sentimentNegative] = await Promise.all([
    prisma.complaint.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, voterId: true } },
        media: true,
        assignments: {
          include: {
            officer: { include: { department: true } },
            responses: { orderBy: { createdAt: "asc" } },
            notifications: true,
          },
        },
      },
      take: 1500,
    }),
    prisma.auditLog.count({ where: { action: "CITIZEN_CONFIRMED_RESOLUTION" } }),
    prisma.auditLog.count({ where: { action: "CITIZEN_REJECTED_RESOLUTION" } }),
  ]);

  const heatmapBuckets = new Map<string, HeatmapPoint>();
  const wardStats = new Map<string, { total: number; resolved: number; resolutionDays: number[] }>();
  const unresolvedCluster = new Map<string, { area: string; category: string; count: number }>();
  const votersAssisted = new Set<string>();
  const serviceRecordCounter: Record<ServiceRecord["category"], number> = {
    Power: 0,
    Water: 0,
    Roads: 0,
    Sanitation: 0,
  };

  const departmentStats = new Map<
    string,
    {
      issuesLogged: number;
      resolvedTimes: number[];
      breaches: number;
      workDonePhotosUploaded: number;
    }
  >();

  const noticeTriggers: NoticeTrigger[] = [];
  const proofGallery: ProofGalleryItem[] = [];
  const now = new Date();

  for (const complaint of complaints) {
    const lat = Number(complaint.lat.toFixed(2));
    const lng = Number(complaint.lng.toFixed(2));
    const key = `${lat}:${lng}`;
    const current = heatmapBuckets.get(key) ?? {
      lat,
      lng,
      count: 0,
      resolved: 0,
      intensity: "LOW" as const,
    };
    current.count += 1;
    if (complaint.status === ComplaintStatus.RESOLVED) {
      current.resolved += 1;
    }
    current.intensity =
      current.count >= 10 ? "HIGH" : current.count >= 5 ? "MEDIUM" : "LOW";
    heatmapBuckets.set(key, current);

    const ward = complaint.area?.trim() || "Unmapped Ward";
    const wardCurrent = wardStats.get(ward) ?? {
      total: 0,
      resolved: 0,
      resolutionDays: [] as number[],
    };
    wardCurrent.total += 1;

    let complaintResolvedAt: Date | null = null;
    for (const assignment of complaint.assignments) {
      const resolvedResponse = assignment.responses.find(
        (item) => item.type === ResponseType.RESOLVED
      );
      if (resolvedResponse) {
        complaintResolvedAt = complaintResolvedAt
          ? new Date(Math.min(complaintResolvedAt.getTime(), resolvedResponse.createdAt.getTime()))
          : resolvedResponse.createdAt;
      }
    }

    if (!complaintResolvedAt && complaint.status === ComplaintStatus.RESOLVED) {
      complaintResolvedAt = complaint.updatedAt;
    }

    if (complaintResolvedAt) {
      wardCurrent.resolved += 1;
      wardCurrent.resolutionDays.push(
        toDays(complaintResolvedAt.getTime() - complaint.createdAt.getTime())
      );
      if (complaint.user.voterId) {
        votersAssisted.add(complaint.user.id);
      }

      const serviceCategory = normalizeServiceCategory(complaint.category);
      if (serviceCategory) {
        serviceRecordCounter[serviceCategory] += 1;
      }

      const beforeMedia = complaint.media.find((item) => item.type === "IMAGE") ?? complaint.media[0];
      let afterMedia: string | null = null;
      for (const assignment of complaint.assignments) {
        const resolvedWithProof = assignment.responses.find(
          (item) => item.type === ResponseType.RESOLVED && item.proofUrl
        );
        if (resolvedWithProof?.proofUrl) {
          afterMedia = resolvedWithProof.proofUrl;
          break;
        }
      }

      if (beforeMedia?.fileUrl && afterMedia) {
        proofGallery.push({
          complaintId: complaint.id,
          category: complaint.category,
          area: complaint.area ?? "N/A",
          beforeUrl: beforeMedia.fileUrl,
          afterUrl: afterMedia,
          resolvedAt: complaintResolvedAt.toISOString(),
        });
      }
    } else {
      const unresolvedKey = `${ward}::${complaint.category}`;
      const cluster = unresolvedCluster.get(unresolvedKey) ?? {
        area: ward,
        category: complaint.category,
        count: 0,
      };
      cluster.count += 1;
      unresolvedCluster.set(unresolvedKey, cluster);
    }

    wardStats.set(ward, wardCurrent);

    for (const assignment of complaint.assignments) {
      const department = assignment.officer.department.name;
      const deptCurrent = departmentStats.get(department) ?? {
        issuesLogged: 0,
        resolvedTimes: [] as number[],
        breaches: 0,
        workDonePhotosUploaded: 0,
      };

      deptCurrent.issuesLogged += 1;

      for (const response of assignment.responses) {
        if (response.proofUrl) {
          deptCurrent.workDonePhotosUploaded += 1;
        }
      }

      const resolvedResponse = assignment.responses.find(
        (item) => item.type === ResponseType.RESOLVED
      );
      const resolvedAt =
        resolvedResponse?.createdAt ??
        (assignment.status === AssignmentStatus.RESOLVED ? assignment.updatedAt : null);

      if (resolvedAt) {
        deptCurrent.resolvedTimes.push(
          toDays(resolvedAt.getTime() - assignment.createdAt.getTime())
        );
      }

      const hasBreached = resolvedAt
        ? resolvedAt.getTime() > assignment.dueDate.getTime()
        : now.getTime() > assignment.dueDate.getTime() && assignment.status !== AssignmentStatus.RESOLVED;

      if (hasBreached) {
        deptCurrent.breaches += 1;
      }

      const reminderCount = assignment.notifications.length;
      const isOverdueOpen =
        now.getTime() > assignment.dueDate.getTime() && assignment.status !== AssignmentStatus.RESOLVED;

      if (isOverdueOpen && reminderCount >= 2) {
        noticeTriggers.push({
          assignmentId: assignment.id,
          ticketId: complaint.id,
          officerName: assignment.officer.name,
          department,
          firstReportDate: complaint.createdAt.toISOString(),
          reminderCount,
          daysOverdue: Math.max(1, Math.floor(toDays(now.getTime() - assignment.dueDate.getTime()))),
          lat: complaint.lat,
          lng: complaint.lng,
        });
      }

      departmentStats.set(department, deptCurrent);
    }
  }

  const wards: WardPerformance[] = Array.from(wardStats.entries())
    .map(([ward, stats]) => {
      const resolutionRate = stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0;
      const avgResolutionDays =
        stats.resolutionDays.length > 0
          ? stats.resolutionDays.reduce((sum, value) => sum + value, 0) / stats.resolutionDays.length
          : 0;

      let color: WardPerformance["color"] = "GREEN";
      if (resolutionRate < 55 || avgResolutionDays > 10) {
        color = "RED";
      } else if (resolutionRate < 75 || avgResolutionDays > 6) {
        color = "AMBER";
      }

      return {
        ward,
        total: stats.total,
        resolved: stats.resolved,
        resolutionRate: Number(resolutionRate.toFixed(1)),
        avgResolutionDays: Number(avgResolutionDays.toFixed(1)),
        color,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  const masterCases: MasterCase[] = Array.from(unresolvedCluster.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((item) => ({
      key: `${item.area}-${item.category}`,
      area: item.area,
      category: item.category,
      activeCases: item.count,
      icon: categoryIcon(item.category),
    }));

  const departmentReportCard: DepartmentRanking[] = Array.from(departmentStats.entries())
    .map(([department, stats]) => {
      const avgResolutionDays =
        stats.resolvedTimes.length > 0
          ? stats.resolvedTimes.reduce((sum, value) => sum + value, 0) / stats.resolvedTimes.length
          : 0;
      const slaBreachPercent =
        stats.issuesLogged > 0 ? (stats.breaches / stats.issuesLogged) * 100 : 0;

      return {
        department,
        issuesLogged: stats.issuesLogged,
        avgResolutionDays: Number(avgResolutionDays.toFixed(1)),
        slaBreachPercent: Number(slaBreachPercent.toFixed(1)),
        workDonePhotosUploaded: stats.workDonePhotosUploaded,
      };
    })
    .sort((a, b) => b.issuesLogged - a.issuesLogged);

  const totalSentimentVotes = sentimentPositive + sentimentNegative;
  const sentimentScore =
    totalSentimentVotes > 0
      ? ((sentimentPositive - sentimentNegative) / totalSentimentVotes) * 100
      : 0;

  return {
    voterHealthMap: {
      heatmap: Array.from(heatmapBuckets.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 50),
      wards,
      masterCases,
    },
    voterImpact: {
      totalVotersAssisted: votersAssisted.size,
      serviceRecord: [
        { category: "Power", fixed: serviceRecordCounter.Power },
        { category: "Water", fixed: serviceRecordCounter.Water },
        { category: "Roads", fixed: serviceRecordCounter.Roads },
        { category: "Sanitation", fixed: serviceRecordCounter.Sanitation },
      ],
      constituencySentiment: {
        positive: sentimentPositive,
        negative: sentimentNegative,
        score: Number(sentimentScore.toFixed(1)),
      },
    },
    departmentReportCard,
    noticeTriggerList: noticeTriggers
      .sort((a, b) => b.daysOverdue - a.daysOverdue)
      .slice(0, 15),
    proofGallery: proofGallery.slice(0, 30),
    systemicCrises: masterCases,
  };
}
