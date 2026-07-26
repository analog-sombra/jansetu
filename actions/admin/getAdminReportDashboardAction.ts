"use server";

import { ASIGNMENTSTATUS, COMPLAINTSTATUS, RESPONSETYPE } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isAdminRole } from "./_shared";
import { isMlaPaRouteRole } from "@/actions/mla-pa/_shared";
import {
  type AdminReportAreaStatus,
  type AdminReportDashboardResult,
  type AdminReportOverview,
  type AdminReportPeriodKey,
  type AdminReportWardStatus,
} from "./types";

type TrendBucket = {
  name: string;
  start: Date;
  end: Date;
};

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function daysBetween(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  return Math.max(ms / (1000 * 60 * 60 * 24), 0);
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function getPeriodStart(period: AdminReportPeriodKey, now: Date) {
  if (period === "7d") {
    return addDays(now, -6);
  }

  if (period === "30d") {
    return addDays(now, -29);
  }

  return addDays(now, -89);
}

function getTrendBuckets(period: AdminReportPeriodKey, now: Date): TrendBucket[] {
  if (period === "7d") {
    return Array.from({ length: 7 }).map((_, offset) => {
      const day = startOfDay(addDays(now, -(6 - offset)));
      return {
        name: day.toLocaleDateString("en-IN", { weekday: "short" }),
        start: day,
        end: addDays(day, 1),
      };
    });
  }

  if (period === "30d") {
    return Array.from({ length: 4 }).map((_, index) => {
      const start = startOfDay(addDays(now, -27 + index * 7));
      return {
        name: `Week ${index + 1}`,
        start,
        end: addDays(start, 7),
      };
    });
  }

  const monthLabels = ["Month 1", "Month 2", "Month 3"];
  return Array.from({ length: 3 }).map((_, index) => {
    const start = startOfDay(addDays(now, -89 + index * 30));
    return {
      name: monthLabels[index],
      start,
      end: addDays(start, 30),
    };
  });
}

function isResolvedStatus(status: COMPLAINTSTATUS) {
  return (
    status === COMPLAINTSTATUS.RESOLVED ||
    status === COMPLAINTSTATUS.CLOSED ||
    status === COMPLAINTSTATUS.AUTO_CLOSED
  );
}

function toWardStatus(rate: number): AdminReportWardStatus {
  if (rate >= 80) {
    return "GREEN";
  }

  if (rate >= 60) {
    return "AMBER";
  }

  return "RED";
}

function toAreaStatus(severityScore: number): AdminReportAreaStatus {
  if (severityScore >= 75) {
    return "RED";
  }

  if (severityScore >= 45) {
    return "AMBER";
  }

  return "GREEN";
}

function getAreaEscalation(score: number) {
  if (score >= 85) {
    return "Critical";
  }

  if (score >= 70) {
    return "High";
  }

  if (score >= 50) {
    return "Watch";
  }

  return "Controlled";
}

function getAreaTrend(latestCount: number, previousCount: number) {
  if (latestCount > previousCount) {
    return "Rising";
  }

  if (latestCount < previousCount) {
    return "Falling";
  }

  return "Stable";
}

function getCategoryIcon(category: string) {
  const key = category.toLowerCase();
  if (key.includes("water")) {
    return "WTR";
  }

  if (key.includes("road")) {
    return "ROD";
  }

  if (key.includes("power") || key.includes("electric")) {
    return "PWR";
  }

  if (key.includes("sanitation") || key.includes("garbage")) {
    return "SAN";
  }

  return "GEN";
}

const PROOF_TONES = [
  { before: "#6b7280", after: "#2e7d32" },
  { before: "#1d4ed8", after: "#0f766e" },
  { before: "#92400e", after: "#15803d" },
  { before: "#374151", after: "#166534" },
  { before: "#4b5563", after: "#047857" },
];

const EMPTY_OVERVIEW: AdminReportOverview = {
  summary: {
    totalVotersAssisted: 0,
    resolvedThisPeriod: 0,
    pendingFollowUps: 0,
    satisfactionScore: 0,
  },
  trend: [],
  areaHeatmap: [],
  wards: [],
  serviceRecord: [],
  constituencySentiment: [
    { name: "Positive", value: 0, color: "#2e7d32" },
    { name: "Neutral", value: 100, color: "#faad14" },
    { name: "Negative", value: 0, color: "#c62828" },
  ],
  departmentReportCard: [],
  noticeTriggerList: [],
  proofGallery: [],
  systemicCrises: [],
};

export async function getAdminReportDashboardAction(
  period: AdminReportPeriodKey,
): Promise<AdminReportDashboardResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, error: "Please login again to continue." };
  }

  const isAuthorized = isAdminRole(user.role) || isMlaPaRouteRole(user.role);

  if (!isAuthorized) {
    return {
      ok: false,
      error: "You are not authorized for this section.",
    };
  }

  try {
    const now = new Date();
    const fromDate = getPeriodStart(period, now);
    const trendBuckets = getTrendBuckets(period, now);

    const complaints = await prisma.complaint.findMany({
      where: {
        createdAt: {
          gte: fromDate,
        },
      },
      select: {
        id: true,
        status: true,
        area: true,
        affectedCitizensCount: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            name: true,
          },
        },
        assignments: {
          select: {
            id: true,
            status: true,
            dueDate: true,
            officer: {
              select: {
                name: true,
                department: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            responses: {
              select: {
                id: true,
                type: true,
                proofUrl: true,
                createdAt: true,
              },
            },
          },
        },
        media: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (complaints.length === 0) {
      return {
        ok: true,
        period,
        overview: {
          ...EMPTY_OVERVIEW,
          trend: trendBuckets.map((bucket) => ({
            name: bucket.name,
            complaints: 0,
            resolved: 0,
          })),
        },
      };
    }

    const resolvedComplaints = complaints.filter((item) =>
      isResolvedStatus(item.status),
    );
    const pendingComplaints = complaints.filter(
      (item) => !isResolvedStatus(item.status),
    );

    const totalVotersAssisted = complaints.reduce(
      (acc, item) => acc + Math.max(item.affectedCitizensCount ?? 1, 1),
      0,
    );
    const resolvedThisPeriod = resolvedComplaints.length;
    const pendingFollowUps = pendingComplaints.length;
    const satisfactionScore = Math.round(
      complaints.length > 0 ? (resolvedThisPeriod / complaints.length) * 100 : 0,
    );

    const trend = trendBuckets.map((bucket) => {
      const bucketComplaints = complaints.filter(
        (item) => item.createdAt >= bucket.start && item.createdAt < bucket.end,
      );

      return {
        name: bucket.name,
        complaints: bucketComplaints.length,
        resolved: bucketComplaints.filter((item) => isResolvedStatus(item.status))
          .length,
      };
    });

    const areaMap = new Map<
      string,
      {
        complaints: number;
        resolved: number;
        totalResolutionDays: number;
        resolutionSamples: number;
        categoryCount: Map<string, number>;
        previousWindowComplaints: number;
        latestWindowComplaints: number;
      }
    >();

    const midpoint = new Date((fromDate.getTime() + now.getTime()) / 2);

    complaints.forEach((item) => {
      const areaKey = item.area?.trim() || "Unspecified Area";
      const current = areaMap.get(areaKey) ?? {
        complaints: 0,
        resolved: 0,
        totalResolutionDays: 0,
        resolutionSamples: 0,
        categoryCount: new Map<string, number>(),
        previousWindowComplaints: 0,
        latestWindowComplaints: 0,
      };

      current.complaints += 1;
      if (isResolvedStatus(item.status)) {
        current.resolved += 1;
        current.totalResolutionDays += daysBetween(item.createdAt, item.updatedAt);
        current.resolutionSamples += 1;
      }

      const categoryName = item.category.name;
      current.categoryCount.set(
        categoryName,
        (current.categoryCount.get(categoryName) ?? 0) + 1,
      );

      if (item.createdAt < midpoint) {
        current.previousWindowComplaints += 1;
      } else {
        current.latestWindowComplaints += 1;
      }

      areaMap.set(areaKey, current);
    });

    const areaHeatmap = Array.from(areaMap.entries())
      .map(([area, details]) => {
        const resolutionRate =
          details.complaints > 0 ? details.resolved / details.complaints : 0;
        const unresolvedRate = 1 - resolutionRate;
        const avgResolutionDays =
          details.resolutionSamples > 0
            ? details.totalResolutionDays / details.resolutionSamples
            : 0;
        const severityScore = Math.max(
          5,
          Math.min(
            99,
            Math.round(unresolvedRate * 70 + Math.min(avgResolutionDays, 10) * 3),
          ),
        );
        const topIssue = Array.from(details.categoryCount.entries()).sort(
          (left, right) => right[1] - left[1],
        )[0]?.[0] ?? "General";

        return {
          area,
          complaints: details.complaints,
          resolved: details.resolved,
          severityScore,
          avgResolutionDays: roundOne(avgResolutionDays),
          topIssue,
          escalation: getAreaEscalation(severityScore),
          trend: getAreaTrend(
            details.latestWindowComplaints,
            details.previousWindowComplaints,
          ),
          color: toAreaStatus(severityScore),
        };
      })
      .sort((left, right) => right.complaints - left.complaints)
      .slice(0, 8);

    const wards = areaHeatmap.map((item) => {
      const resolutionRate =
        item.complaints > 0 ? Math.round((item.resolved / item.complaints) * 100) : 0;
      return {
        ward: item.area,
        total: item.complaints,
        resolved: item.resolved,
        resolutionRate,
        avgResolutionDays: item.avgResolutionDays,
        color: toWardStatus(resolutionRate),
      };
    });

    const categoryMap = new Map<string, { fixed: number; backlog: number }>();

    complaints.forEach((item) => {
      const categoryName = item.category.name;
      const current = categoryMap.get(categoryName) ?? { fixed: 0, backlog: 0 };
      if (isResolvedStatus(item.status)) {
        current.fixed += 1;
      } else {
        current.backlog += 1;
      }
      categoryMap.set(categoryName, current);
    });

    const serviceRecord = Array.from(categoryMap.entries())
      .map(([category, value]) => ({
        category,
        fixed: value.fixed,
        backlog: value.backlog,
      }))
      .sort((left, right) => right.fixed + right.backlog - (left.fixed + left.backlog));

    const positive = satisfactionScore;
    const negative = Math.min(100 - positive, Math.round((pendingFollowUps / complaints.length) * 40));
    const neutral = Math.max(0, 100 - positive - negative);

    const constituencySentiment = [
      { name: "Positive", value: positive, color: "#2e7d32" },
      { name: "Neutral", value: neutral, color: "#faad14" },
      { name: "Negative", value: negative, color: "#c62828" },
    ];

    const departmentMap = new Map<
      string,
      {
        issuesLogged: number;
        totalResolutionDays: number;
        resolutionSamples: number;
        slaBreaches: number;
        workDonePhotosUploaded: number;
      }
    >();

    complaints.forEach((complaint) => {
      complaint.assignments.forEach((assignment) => {
        const departmentName = assignment.officer.department.name;
        const current = departmentMap.get(departmentName) ?? {
          issuesLogged: 0,
          totalResolutionDays: 0,
          resolutionSamples: 0,
          slaBreaches: 0,
          workDonePhotosUploaded: 0,
        };

        current.issuesLogged += 1;

        if (
          assignment.dueDate < now &&
          assignment.status !== ASIGNMENTSTATUS.RESOLVED
        ) {
          current.slaBreaches += 1;
        }

        if (isResolvedStatus(complaint.status)) {
          current.totalResolutionDays += daysBetween(
            complaint.createdAt,
            complaint.updatedAt,
          );
          current.resolutionSamples += 1;
        }

        current.workDonePhotosUploaded += assignment.responses.filter(
          (response) =>
            !!response.proofUrl &&
            (response.type === RESPONSETYPE.RESOLVED ||
              response.type === RESPONSETYPE.WORK_IN_PROGESS),
        ).length;

        departmentMap.set(departmentName, current);
      });
    });

    const departmentReportCard = Array.from(departmentMap.entries())
      .map(([department, value]) => ({
        department,
        issuesLogged: value.issuesLogged,
        avgResolutionDays:
          value.resolutionSamples > 0
            ? roundOne(value.totalResolutionDays / value.resolutionSamples)
            : 0,
        slaBreachPercent:
          value.issuesLogged > 0
            ? Math.round((value.slaBreaches / value.issuesLogged) * 100)
            : 0,
        workDonePhotosUploaded: value.workDonePhotosUploaded,
      }))
      .sort((left, right) => right.issuesLogged - left.issuesLogged);

    const noticeTriggerList = complaints
      .flatMap((complaint) =>
        complaint.assignments
          .filter(
            (assignment) =>
              assignment.dueDate < now && assignment.status !== ASIGNMENTSTATUS.RESOLVED,
          )
          .map((assignment) => ({
            assignmentId: assignment.id,
            ticketId: complaint.id,
            officerName: assignment.officer.name,
            department: assignment.officer.department.name,
            reminderCount: assignment.responses.filter(
              (response) => response.type === RESPONSETYPE.QUERY,
            ).length,
            daysOverdue: Math.max(
              1,
              Math.ceil(daysBetween(assignment.dueDate, now)),
            ),
            area: complaint.area?.trim() || "Unspecified Area",
          })),
      )
      .sort((left, right) => right.daysOverdue - left.daysOverdue)
      .slice(0, 8);

    const proofGallery = resolvedComplaints
      .slice(0, 9)
      .map((complaint, index) => {
        const tones = PROOF_TONES[index % PROOF_TONES.length];
        const hasMedia = complaint.media.length > 0;
        return {
          complaintId: complaint.id,
          category: complaint.category.name,
          area: complaint.area?.trim() || "Unspecified Area",
          resolvedAt: complaint.updatedAt.toISOString(),
          beforeLabel: hasMedia ? "Issue evidence submitted" : "Issue reported",
          afterLabel: hasMedia
            ? "Resolution proof uploaded"
            : "Resolution marked by department",
          beforeTone: tones.before,
          afterTone: tones.after,
        };
      });

    const systemicCrises = areaHeatmap
      .filter((item) => item.complaints > item.resolved)
      .slice(0, 3)
      .map((item) => {
        const category = item.topIssue;
        return {
          key: `${item.area}-${category}`,
          area: item.area,
          category,
          activeCases: item.complaints - item.resolved,
          icon: getCategoryIcon(category),
          severity: item.escalation,
        };
      });

    return {
      ok: true,
      period,
      overview: {
        summary: {
          totalVotersAssisted,
          resolvedThisPeriod,
          pendingFollowUps,
          satisfactionScore,
        },
        trend,
        areaHeatmap,
        wards,
        serviceRecord,
        constituencySentiment,
        departmentReportCard,
        noticeTriggerList,
        proofGallery,
        systemicCrises,
      },
    };
  } catch {
    return {
      ok: false,
      error: "Unable to load report dashboard.",
    };
  }
}
