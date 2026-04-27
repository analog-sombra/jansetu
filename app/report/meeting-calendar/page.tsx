"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Button,
  Calendar,
  Card,
  Col,
  Row,
  Statistic,
  Tag,
  Table,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

import { useLanguage } from "@/components/language-provider";
import {
  TODAY_TASKS,
  TodayTaskRow,
} from "@/app/report/meeting-calendar/task-data";

const { Title, Text } = Typography;

type CalendarMode = "month" | "year";
type TaskStatus = "PENDING" | "APPROVED" | "COMPLETED" | "REJECTED";
type TaskRecord = TodayTaskRow & { date: string; status: TaskStatus };
type PeriodKey = "7d" | "30d" | "90d";
type ReportWindow = "weekly" | "monthly";
type GroupByKey = "ward" | "category";

type WardStatus = "GREEN" | "AMBER" | "RED";

type AreaStatus = "GREEN" | "AMBER" | "RED";

type DemoOverview = {
  summary: {
    totalVotersAssisted: number;
    resolvedThisPeriod: number;
    pendingFollowUps: number;
    satisfactionScore: number;
  };
  trend: Array<{
    name: string;
    complaints: number;
    resolved: number;
  }>;
  areaHeatmap: Array<{
    area: string;
    complaints: number;
    resolved: number;
    severityScore: number;
    avgResolutionDays: number;
    topIssue: string;
    escalation: string;
    trend: string;
    color: AreaStatus;
  }>;
  wards: Array<{
    ward: string;
    total: number;
    resolved: number;
    resolutionRate: number;
    avgResolutionDays: number;
    color: WardStatus;
  }>;
  serviceRecord: Array<{
    category: string;
    fixed: number;
    backlog: number;
  }>;
  constituencySentiment: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  departmentReportCard: Array<{
    department: string;
    issuesLogged: number;
    avgResolutionDays: number;
    slaBreachPercent: number;
    workDonePhotosUploaded: number;
  }>;
  noticeTriggerList: Array<{
    assignmentId: number;
    ticketId: number;
    officerName: string;
    department: string;
    reminderCount: number;
    daysOverdue: number;
    area: string;
  }>;
  proofGallery: Array<{
    complaintId: number;
    category: string;
    area: string;
    resolvedAt: string;
    beforeLabel: string;
    afterLabel: string;
    beforeTone: string;
    afterTone: string;
  }>;
  systemicCrises: Array<{
    key: string;
    area: string;
    category: string;
    activeCases: number;
    icon: string;
    severity: string;
  }>;
};

type DemoCaseEntry = {
  id: number;
  ward: string;
  area: string;
  category: string;
  statusType: "SOLVED" | "UNSOLVED";
  priority: boolean;
  assignedTo: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  createdAt: string;
  resolvedAt: string | null;
};

const DEMO_DATA: Record<PeriodKey, DemoOverview> = {
  "7d": {
    summary: {
      totalVotersAssisted: 2680,
      resolvedThisPeriod: 182,
      pendingFollowUps: 29,
      satisfactionScore: 78,
    },
    trend: [
      { name: "Mon", complaints: 24, resolved: 18 },
      { name: "Tue", complaints: 28, resolved: 21 },
      { name: "Wed", complaints: 22, resolved: 20 },
      { name: "Thu", complaints: 31, resolved: 25 },
      { name: "Fri", complaints: 34, resolved: 27 },
      { name: "Sat", complaints: 20, resolved: 19 },
      { name: "Sun", complaints: 18, resolved: 16 },
    ],
    areaHeatmap: [
      {
        area: "Raghubir Nagar",
        complaints: 36,
        resolved: 22,
        severityScore: 88,
        avgResolutionDays: 5.6,
        topIssue: "Drain overflow",
        escalation: "Critical",
        trend: "Rising",
        color: "RED",
      },
      {
        area: "Rajouri Garden Main Market",
        complaints: 28,
        resolved: 19,
        severityScore: 76,
        avgResolutionDays: 4.2,
        topIssue: "Parking and sanitation",
        escalation: "High",
        trend: "Rising",
        color: "RED",
      },
      {
        area: "Tagore Garden Extension",
        complaints: 22,
        resolved: 16,
        severityScore: 62,
        avgResolutionDays: 3.8,
        topIssue: "Water leakage",
        escalation: "Watch",
        trend: "Stable",
        color: "AMBER",
      },
      {
        area: "Vishal Enclave",
        complaints: 18,
        resolved: 14,
        severityScore: 48,
        avgResolutionDays: 3.1,
        topIssue: "Streetlights",
        escalation: "Moderate",
        trend: "Stable",
        color: "AMBER",
      },
      {
        area: "Shivaji Enclave",
        complaints: 14,
        resolved: 12,
        severityScore: 34,
        avgResolutionDays: 2.7,
        topIssue: "Road patchwork",
        escalation: "Controlled",
        trend: "Falling",
        color: "GREEN",
      },
      {
        area: "Mansarovar Garden",
        complaints: 11,
        resolved: 9,
        severityScore: 29,
        avgResolutionDays: 2.4,
        topIssue: "Garbage pickup",
        escalation: "Controlled",
        trend: "Falling",
        color: "GREEN",
      },
    ],
    wards: [
      {
        ward: "Ward 11",
        total: 41,
        resolved: 34,
        resolutionRate: 83,
        avgResolutionDays: 2.8,
        color: "GREEN",
      },
      {
        ward: "Ward 8",
        total: 37,
        resolved: 28,
        resolutionRate: 76,
        avgResolutionDays: 3.2,
        color: "AMBER",
      },
      {
        ward: "Ward 3",
        total: 29,
        resolved: 20,
        resolutionRate: 69,
        avgResolutionDays: 4.4,
        color: "AMBER",
      },
      {
        ward: "Ward 14",
        total: 33,
        resolved: 21,
        resolutionRate: 64,
        avgResolutionDays: 4.9,
        color: "RED",
      },
    ],
    serviceRecord: [
      { category: "Roads", fixed: 42, backlog: 8 },
      { category: "Water", fixed: 38, backlog: 12 },
      { category: "Power", fixed: 35, backlog: 10 },
      { category: "Sanitation", fixed: 44, backlog: 6 },
      { category: "Health", fixed: 23, backlog: 4 },
    ],
    constituencySentiment: [
      { name: "Positive", value: 61, color: "#2e7d32" },
      { name: "Neutral", value: 24, color: "#faad14" },
      { name: "Negative", value: 15, color: "#c62828" },
    ],
    departmentReportCard: [
      {
        department: "Public Works",
        issuesLogged: 57,
        avgResolutionDays: 3.1,
        slaBreachPercent: 8,
        workDonePhotosUploaded: 45,
      },
      {
        department: "Water Supply",
        issuesLogged: 49,
        avgResolutionDays: 3.8,
        slaBreachPercent: 11,
        workDonePhotosUploaded: 36,
      },
      {
        department: "Electricity",
        issuesLogged: 44,
        avgResolutionDays: 2.6,
        slaBreachPercent: 6,
        workDonePhotosUploaded: 31,
      },
      {
        department: "Sanitation",
        issuesLogged: 51,
        avgResolutionDays: 2.4,
        slaBreachPercent: 5,
        workDonePhotosUploaded: 40,
      },
    ],
    noticeTriggerList: [
      {
        assignmentId: 701,
        ticketId: 1422,
        officerName: "A. Verma",
        department: "Water Supply",
        reminderCount: 2,
        daysOverdue: 5,
        area: "Shivaji Nagar",
      },
      {
        assignmentId: 702,
        ticketId: 1431,
        officerName: "P. Singh",
        department: "Public Works",
        reminderCount: 3,
        daysOverdue: 7,
        area: "Lakshmi Colony",
      },
    ],
    proofGallery: [
      {
        complaintId: 9201,
        category: "Roads",
        area: "Ward 11 Main Road",
        resolvedAt: "2026-04-11",
        beforeLabel: "Potholes reported",
        afterLabel: "Patchwork completed",
        beforeTone: "#6b7280",
        afterTone: "#2e7d32",
      },
      {
        complaintId: 9208,
        category: "Water",
        area: "Shanti Vihar",
        resolvedAt: "2026-04-12",
        beforeLabel: "Pipeline leakage",
        afterLabel: "Valve repaired",
        beforeTone: "#1d4ed8",
        afterTone: "#0f766e",
      },
      {
        complaintId: 9216,
        category: "Sanitation",
        area: "Ward 8 Market",
        resolvedAt: "2026-04-13",
        beforeLabel: "Garbage overflow",
        afterLabel: "Daily pickup restored",
        beforeTone: "#92400e",
        afterTone: "#15803d",
      },
    ],
    systemicCrises: [
      {
        key: "water-grid",
        area: "Ward 14",
        category: "Water",
        activeCases: 12,
        icon: "💧",
        severity: "High priority",
      },
      {
        key: "road-belt",
        area: "Ward 3",
        category: "Roads",
        activeCases: 9,
        icon: "🛣️",
        severity: "Escalation watch",
      },
      {
        key: "night-power",
        area: "Ward 8",
        category: "Power",
        activeCases: 7,
        icon: "⚡",
        severity: "Monitoring",
      },
    ],
  },
  "30d": {
    summary: {
      totalVotersAssisted: 10480,
      resolvedThisPeriod: 726,
      pendingFollowUps: 113,
      satisfactionScore: 82,
    },
    trend: [
      { name: "Week 1", complaints: 124, resolved: 98 },
      { name: "Week 2", complaints: 140, resolved: 114 },
      { name: "Week 3", complaints: 131, resolved: 120 },
      { name: "Week 4", complaints: 118, resolved: 109 },
    ],
    areaHeatmap: [
      {
        area: "Raghubir Nagar",
        complaints: 122,
        resolved: 76,
        severityScore: 91,
        avgResolutionDays: 5.9,
        topIssue: "Drain overflow",
        escalation: "Critical",
        trend: "Rising",
        color: "RED",
      },
      {
        area: "Rajouri Garden Main Market",
        complaints: 97,
        resolved: 69,
        severityScore: 84,
        avgResolutionDays: 4.7,
        topIssue: "Parking and sanitation",
        escalation: "High",
        trend: "Rising",
        color: "RED",
      },
      {
        area: "Tagore Garden",
        complaints: 81,
        resolved: 58,
        severityScore: 72,
        avgResolutionDays: 4.1,
        topIssue: "Water pressure",
        escalation: "High",
        trend: "Stable",
        color: "AMBER",
      },
      {
        area: "Vishal Enclave",
        complaints: 65,
        resolved: 48,
        severityScore: 58,
        avgResolutionDays: 3.6,
        topIssue: "Streetlights",
        escalation: "Watch",
        trend: "Stable",
        color: "AMBER",
      },
      {
        area: "Subhash Nagar Border",
        complaints: 54,
        resolved: 42,
        severityScore: 49,
        avgResolutionDays: 3.3,
        topIssue: "Road cuts",
        escalation: "Moderate",
        trend: "Falling",
        color: "AMBER",
      },
      {
        area: "Shivaji Enclave",
        complaints: 39,
        resolved: 31,
        severityScore: 36,
        avgResolutionDays: 2.9,
        topIssue: "Road patchwork",
        escalation: "Controlled",
        trend: "Falling",
        color: "GREEN",
      },
      {
        area: "Mansarovar Garden",
        complaints: 31,
        resolved: 25,
        severityScore: 28,
        avgResolutionDays: 2.6,
        topIssue: "Garbage pickup",
        escalation: "Controlled",
        trend: "Falling",
        color: "GREEN",
      },
      {
        area: "Mayapuri Link",
        complaints: 27,
        resolved: 22,
        severityScore: 24,
        avgResolutionDays: 2.5,
        topIssue: "Industrial waste",
        escalation: "Controlled",
        trend: "Stable",
        color: "GREEN",
      },
    ],
    wards: [
      {
        ward: "Ward 11",
        total: 163,
        resolved: 141,
        resolutionRate: 87,
        avgResolutionDays: 3.0,
        color: "GREEN",
      },
      {
        ward: "Ward 8",
        total: 149,
        resolved: 119,
        resolutionRate: 80,
        avgResolutionDays: 3.4,
        color: "GREEN",
      },
      {
        ward: "Ward 3",
        total: 121,
        resolved: 88,
        resolutionRate: 73,
        avgResolutionDays: 4.6,
        color: "AMBER",
      },
      {
        ward: "Ward 14",
        total: 134,
        resolved: 91,
        resolutionRate: 68,
        avgResolutionDays: 5.1,
        color: "RED",
      },
      {
        ward: "Ward 6",
        total: 97,
        resolved: 74,
        resolutionRate: 76,
        avgResolutionDays: 3.8,
        color: "AMBER",
      },
    ],
    serviceRecord: [
      { category: "Roads", fixed: 164, backlog: 28 },
      { category: "Water", fixed: 152, backlog: 34 },
      { category: "Power", fixed: 143, backlog: 20 },
      { category: "Sanitation", fixed: 181, backlog: 22 },
      { category: "Health", fixed: 86, backlog: 9 },
    ],
    constituencySentiment: [
      { name: "Positive", value: 64, color: "#2e7d32" },
      { name: "Neutral", value: 21, color: "#faad14" },
      { name: "Negative", value: 15, color: "#c62828" },
    ],
    departmentReportCard: [
      {
        department: "Public Works",
        issuesLogged: 198,
        avgResolutionDays: 3.3,
        slaBreachPercent: 9,
        workDonePhotosUploaded: 147,
      },
      {
        department: "Water Supply",
        issuesLogged: 182,
        avgResolutionDays: 4.2,
        slaBreachPercent: 13,
        workDonePhotosUploaded: 131,
      },
      {
        department: "Electricity",
        issuesLogged: 156,
        avgResolutionDays: 2.9,
        slaBreachPercent: 7,
        workDonePhotosUploaded: 108,
      },
      {
        department: "Sanitation",
        issuesLogged: 203,
        avgResolutionDays: 2.5,
        slaBreachPercent: 6,
        workDonePhotosUploaded: 164,
      },
    ],
    noticeTriggerList: [
      {
        assignmentId: 715,
        ticketId: 1468,
        officerName: "R. Khan",
        department: "Water Supply",
        reminderCount: 3,
        daysOverdue: 9,
        area: "Azad Chowk",
      },
      {
        assignmentId: 718,
        ticketId: 1489,
        officerName: "S. Patel",
        department: "Public Works",
        reminderCount: 2,
        daysOverdue: 6,
        area: "Ward 14 Ring Road",
      },
      {
        assignmentId: 721,
        ticketId: 1497,
        officerName: "M. Yadav",
        department: "Electricity",
        reminderCount: 2,
        daysOverdue: 4,
        area: "Model Town",
      },
    ],
    proofGallery: [
      {
        complaintId: 9324,
        category: "Roads",
        area: "Ward 11 Main Road",
        resolvedAt: "2026-04-04",
        beforeLabel: "Broken surface",
        afterLabel: "Resurfaced corridor",
        beforeTone: "#4b5563",
        afterTone: "#166534",
      },
      {
        complaintId: 9351,
        category: "Power",
        area: "Model Town",
        resolvedAt: "2026-04-06",
        beforeLabel: "Transformer outage",
        afterLabel: "Backup line restored",
        beforeTone: "#7c2d12",
        afterTone: "#b45309",
      },
      {
        complaintId: 9390,
        category: "Health",
        area: "Civil Dispensary",
        resolvedAt: "2026-04-08",
        beforeLabel: "Medicine shortage",
        afterLabel: "Stock replenished",
        beforeTone: "#7f1d1d",
        afterTone: "#15803d",
      },
    ],
    systemicCrises: [
      {
        key: "water-grid",
        area: "Ward 14",
        category: "Water",
        activeCases: 28,
        icon: "💧",
        severity: "High priority",
      },
      {
        key: "road-belt",
        area: "Ward 3",
        category: "Roads",
        activeCases: 21,
        icon: "🛣️",
        severity: "Escalation watch",
      },
      {
        key: "clinic-shortage",
        area: "Ward 6",
        category: "Health",
        activeCases: 11,
        icon: "🏥",
        severity: "Monitoring",
      },
    ],
  },
  "90d": {
    summary: {
      totalVotersAssisted: 31820,
      resolvedThisPeriod: 2144,
      pendingFollowUps: 341,
      satisfactionScore: 79,
    },
    trend: [
      { name: "Jan", complaints: 410, resolved: 326 },
      { name: "Feb", complaints: 452, resolved: 377 },
      { name: "Mar", complaints: 438, resolved: 381 },
      { name: "Apr", complaints: 391, resolved: 344 },
    ],
    areaHeatmap: [
      {
        area: "Raghubir Nagar",
        complaints: 344,
        resolved: 227,
        severityScore: 93,
        avgResolutionDays: 6.2,
        topIssue: "Drain overflow",
        escalation: "Critical",
        trend: "Rising",
        color: "RED",
      },
      {
        area: "Rajouri Garden Main Market",
        complaints: 281,
        resolved: 204,
        severityScore: 86,
        avgResolutionDays: 5.0,
        topIssue: "Parking and sanitation",
        escalation: "Critical",
        trend: "Rising",
        color: "RED",
      },
      {
        area: "Tagore Garden",
        complaints: 239,
        resolved: 176,
        severityScore: 74,
        avgResolutionDays: 4.4,
        topIssue: "Water pressure",
        escalation: "High",
        trend: "Stable",
        color: "AMBER",
      },
      {
        area: "Vishal Enclave",
        complaints: 204,
        resolved: 158,
        severityScore: 61,
        avgResolutionDays: 3.8,
        topIssue: "Streetlights",
        escalation: "Watch",
        trend: "Stable",
        color: "AMBER",
      },
      {
        area: "Subhash Nagar Border",
        complaints: 178,
        resolved: 139,
        severityScore: 53,
        avgResolutionDays: 3.6,
        topIssue: "Road cuts",
        escalation: "Watch",
        trend: "Stable",
        color: "AMBER",
      },
      {
        area: "Shivaji Enclave",
        complaints: 141,
        resolved: 117,
        severityScore: 38,
        avgResolutionDays: 3.1,
        topIssue: "Road patchwork",
        escalation: "Controlled",
        trend: "Falling",
        color: "GREEN",
      },
      {
        area: "Mansarovar Garden",
        complaints: 127,
        resolved: 108,
        severityScore: 32,
        avgResolutionDays: 2.9,
        topIssue: "Garbage pickup",
        escalation: "Controlled",
        trend: "Falling",
        color: "GREEN",
      },
      {
        area: "Mayapuri Link",
        complaints: 118,
        resolved: 101,
        severityScore: 27,
        avgResolutionDays: 2.8,
        topIssue: "Industrial waste",
        escalation: "Controlled",
        trend: "Stable",
        color: "GREEN",
      },
    ],
    wards: [
      {
        ward: "Ward 11",
        total: 449,
        resolved: 382,
        resolutionRate: 85,
        avgResolutionDays: 3.4,
        color: "GREEN",
      },
      {
        ward: "Ward 8",
        total: 401,
        resolved: 321,
        resolutionRate: 80,
        avgResolutionDays: 3.9,
        color: "GREEN",
      },
      {
        ward: "Ward 3",
        total: 366,
        resolved: 256,
        resolutionRate: 70,
        avgResolutionDays: 5.0,
        color: "AMBER",
      },
      {
        ward: "Ward 14",
        total: 394,
        resolved: 257,
        resolutionRate: 65,
        avgResolutionDays: 5.6,
        color: "RED",
      },
      {
        ward: "Ward 6",
        total: 288,
        resolved: 216,
        resolutionRate: 75,
        avgResolutionDays: 4.1,
        color: "AMBER",
      },
      {
        ward: "Ward 2",
        total: 247,
        resolved: 195,
        resolutionRate: 79,
        avgResolutionDays: 3.7,
        color: "GREEN",
      },
    ],
    serviceRecord: [
      { category: "Roads", fixed: 472, backlog: 82 },
      { category: "Water", fixed: 437, backlog: 94 },
      { category: "Power", fixed: 392, backlog: 61 },
      { category: "Sanitation", fixed: 516, backlog: 57 },
      { category: "Health", fixed: 221, backlog: 18 },
    ],
    constituencySentiment: [
      { name: "Positive", value: 58, color: "#2e7d32" },
      { name: "Neutral", value: 26, color: "#faad14" },
      { name: "Negative", value: 16, color: "#c62828" },
    ],
    departmentReportCard: [
      {
        department: "Public Works",
        issuesLogged: 602,
        avgResolutionDays: 3.7,
        slaBreachPercent: 11,
        workDonePhotosUploaded: 438,
      },
      {
        department: "Water Supply",
        issuesLogged: 571,
        avgResolutionDays: 4.5,
        slaBreachPercent: 15,
        workDonePhotosUploaded: 403,
      },
      {
        department: "Electricity",
        issuesLogged: 490,
        avgResolutionDays: 3.1,
        slaBreachPercent: 8,
        workDonePhotosUploaded: 355,
      },
      {
        department: "Sanitation",
        issuesLogged: 633,
        avgResolutionDays: 2.8,
        slaBreachPercent: 7,
        workDonePhotosUploaded: 491,
      },
    ],
    noticeTriggerList: [
      {
        assignmentId: 801,
        ticketId: 1608,
        officerName: "K. Sharma",
        department: "Water Supply",
        reminderCount: 4,
        daysOverdue: 12,
        area: "Ward 14 Low Zone",
      },
      {
        assignmentId: 806,
        ticketId: 1621,
        officerName: "D. Mishra",
        department: "Public Works",
        reminderCount: 3,
        daysOverdue: 10,
        area: "Bypass Corridor",
      },
      {
        assignmentId: 814,
        ticketId: 1654,
        officerName: "N. Ali",
        department: "Sanitation",
        reminderCount: 3,
        daysOverdue: 8,
        area: "Old Market",
      },
    ],
    proofGallery: [
      {
        complaintId: 9511,
        category: "Roads",
        area: "Bypass Corridor",
        resolvedAt: "2026-03-15",
        beforeLabel: "Unsafe shoulder",
        afterLabel: "Drain and shoulder rebuilt",
        beforeTone: "#374151",
        afterTone: "#166534",
      },
      {
        complaintId: 9562,
        category: "Water",
        area: "Ward 14 Low Zone",
        resolvedAt: "2026-03-28",
        beforeLabel: "Low pressure blocks",
        afterLabel: "Booster line commissioned",
        beforeTone: "#1e3a8a",
        afterTone: "#0f766e",
      },
      {
        complaintId: 9604,
        category: "Sanitation",
        area: "Old Market",
        resolvedAt: "2026-04-02",
        beforeLabel: "Overflowing bins",
        afterLabel: "Route optimization applied",
        beforeTone: "#92400e",
        afterTone: "#15803d",
      },
    ],
    systemicCrises: [
      {
        key: "water-grid",
        area: "Ward 14",
        category: "Water",
        activeCases: 54,
        icon: "💧",
        severity: "High priority",
      },
      {
        key: "road-belt",
        area: "Ward 3",
        category: "Roads",
        activeCases: 33,
        icon: "🛣️",
        severity: "Escalation watch",
      },
      {
        key: "night-power",
        area: "Ward 8",
        category: "Power",
        activeCases: 19,
        icon: "⚡",
        severity: "Monitoring",
      },
    ],
  },
};

const DEMO_WARDS = ["Ward 11", "Ward 8", "Ward 3", "Ward 14", "Ward 6"];
const DEMO_AREAS = [
  "Rajouri Garden Main Market",
  "Raghubir Nagar",
  "Tagore Garden Extension",
  "Subhash Nagar Border",
  "Vishal Enclave",
  "Shivaji Enclave",
  "Mansarovar Garden",
  "Mayapuri Link",
];
const DEMO_CATEGORIES = ["Roads", "Water", "Power", "Sanitation", "Health"];

const UNSPLASH_BEFORE = [
  "/image/clean bf.jpg",
  "/image/light bf.jpg",
  "/image/pothole 2 bf.jpg",
  "/image/pothole 3 bf.jpg",
  "/image/pothole 4 bf.jpg",
  "/image/road 1 bf.jpg",
  "/image/road bf.jpg",
  "/image/water 1 before.jpg",
  "/image/water 2 before.jpg",
  "/image/water log 1 before.jpg",
];

const UNSPLASH_AFTER = [
  "/image/clean af.jpg",
  "/image/light af.jpg",
  "/image/pothole 2 af.jpg",
  "/image/pothole 3 af.jpg",
  "/image/pothole 4 af.jpg",
  "/image/road 1 af.jpg",
  "/image/road 2 af.jpg",
  "/image/water 1 after.jpg",
  "/image/water 2 after.jpg",
  "/image/water log 1 af.jpg",
];

const CategoryNames = [
  "Drain Cleanup",
  "Streetlight Repair",
  "Pothole Repair",
  "Pothole Repair",
  "Pothole Repair",
  "Pothole Repair",
  "Pothole Repair",
  "Water Leakage",
  "Water Leakage",
  "Water Cloging",
];

const DEMO_CASES: DemoCaseEntry[] = Array.from({ length: 50 }, (_, index) => {
  const id = 12001 + index;
  const combinationIndex = index % (DEMO_WARDS.length * DEMO_CATEGORIES.length);
  const ward = DEMO_WARDS[combinationIndex % DEMO_WARDS.length];
  const category = CategoryNames[index % CategoryNames.length];
  const area = DEMO_AREAS[(combinationIndex + index) % DEMO_AREAS.length];
  const statusType =
    index < DEMO_WARDS.length * DEMO_CATEGORIES.length ||
    combinationIndex % 2 === 0
      ? "UNSOLVED"
      : "SOLVED";
  const priority =
    index < DEMO_WARDS.length * DEMO_CATEGORIES.length ||
    combinationIndex % 3 === 0;

  return {
    id,
    ward,
    area,
    category,
    statusType,
    priority,
    assignedTo: `Officer ${(index % 12) + 1}`,
    beforeImageUrl: UNSPLASH_BEFORE[index % UNSPLASH_BEFORE.length],
    afterImageUrl: UNSPLASH_AFTER[index % UNSPLASH_AFTER.length],
    createdAt: new Date(
      Date.UTC(2026, 2, (index % 28) + 1, 9, 10),
    ).toISOString(),
    resolvedAt:
      statusType === "SOLVED"
        ? new Date(Date.UTC(2026, 3, (index % 26) + 1, 11, 30)).toISOString()
        : null,
  };
});

export default function ReportMeetingCalendarPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [calendarValue, setCalendarValue] = useState<Dayjs>(dayjs());
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");
  const [windowMode] = useState<ReportWindow>("monthly");
  const [groupBy] = useState<GroupByKey>("ward");
  const wardFilter = "ALL";
  const categoryFilter = "ALL";

  const overviewPeriod: PeriodKey = windowMode === "weekly" ? "7d" : "30d";
  const overview = DEMO_DATA[overviewPeriod];

  const taskRecords = useMemo<TaskRecord[]>(() => {
    const baseDate = dayjs().startOf("day");
    const statusByIndex: TaskStatus[] = [
      "PENDING",
      "APPROVED",
      "COMPLETED",
      "PENDING",
      "COMPLETED",
      "APPROVED",
      "COMPLETED",
      "PENDING",
      "REJECTED",
      "PENDING",
    ];
    const dayOffsets = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    return TODAY_TASKS.map((task, index) => ({
      ...task,
      date: baseDate.add(dayOffsets[index] ?? 0, "day").format("YYYY-MM-DD"),
      status: statusByIndex[index] ?? "PENDING",
    }));
  }, []);

  const dashboardCards = useMemo(() => {
    const now = dayjs();
    const next10DaysBoundary = now.add(10, "day").endOf("day");

    let pending = 0;
    let approved = 0;
    let completed = 0;
    let rejected = 0;
    let todayMeetings = 0;
    let next10DaysMeetings = 0;

    for (const item of taskRecords) {
      if (item.status === "PENDING") pending += 1;
      if (item.status === "APPROVED") approved += 1;
      if (item.status === "COMPLETED") completed += 1;
      if (item.status === "REJECTED") rejected += 1;

      const meetingDate = dayjs(item.date);

      if (meetingDate.isSame(now, "day")) {
        todayMeetings += 1;
      }

      if (
        meetingDate.isAfter(now.startOf("day")) &&
        meetingDate.isBefore(next10DaysBoundary)
      ) {
        next10DaysMeetings += 1;
      }
    }

    const pendingWork = pending + approved;

    return [
      {
        key: "pending-work",
        title: "Work Pending",
        value: pendingWork,
        color: "#c62828",
      },
      {
        key: "completed",
        title: "Completed Meetings",
        value: completed,
        color: "#2e7d32",
      },
      {
        key: "today",
        title: "Today's Meetings",
        value: todayMeetings,
        color: "#1a3c6e",
      },
      {
        key: "next-7-days",
        title: "Next 10 Days",
        value: next10DaysMeetings,
        color: "#722ed1",
      },
      {
        key: "total",
        title: "Total Meetings",
        value: taskRecords.length,
        color: "#1a3c6e",
      },
      {
        key: "pending-approval",
        title: "Pending Approval",
        value: pending,
        color: "#e07b00",
      },
      {
        key: "approved",
        title: "Approved",
        value: approved,
        color: "#1565c0",
      },
      {
        key: "rejected",
        title: "Rejected",
        value: rejected,
        color: "#6d4c41",
      },
    ];
  }, [taskRecords]);

  const todayTaskColumns: TableColumnsType<TodayTaskRow> = [
    {
      title: "Time",
      dataIndex: "time",
      key: "time",
      width: 110,
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "Meeting Type",
      dataIndex: "meetingType",
      key: "meetingType",
      width: 180,
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      width: 260,
    },
    {
      title: "Whom To Meet",
      dataIndex: "person",
      key: "person",
      width: 190,
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, row) => (
        <Button
          size="small"
          type="primary"
          onClick={() =>
            router.push(`/report/meeting-calendar/task/${row.key}`)
          }
          style={{ background: "#1a3c6e", borderColor: "#1a3c6e" }}
        >
          View
        </Button>
      ),
    },
  ];

  const meetingDates = useMemo(() => {
    return new Set(taskRecords.map((item) => item.date));
  }, [taskRecords]);

  const groupedColumns = [
    {
      title: groupBy === "ward" ? "Ward" : "Category",
      dataIndex: "groupName",
      key: "groupName",
      render: (value: string) => <Text strong>{value}</Text>,
    },
    { title: "Total", dataIndex: "total", key: "total" },
    { title: "Solved", dataIndex: "solved", key: "solved" },
    { title: "Unsolved", dataIndex: "unsolved", key: "unsolved" },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (value: number) => <Tag color="red">{value}</Tag>,
    },
  ];

  const caseColumns = [
    {
      title: "Ref",
      dataIndex: "id",
      key: "id",
      width: 90,
      render: (value: number) => <Text strong>#{value}</Text>,
    },
    { title: "Ward", dataIndex: "ward", key: "ward" },
    { title: "Area", dataIndex: "area", key: "area" },
    { title: "Category", dataIndex: "category", key: "category" },
    {
      title: "Status",
      dataIndex: "statusType",
      key: "statusType",
      render: (value: "SOLVED" | "UNSOLVED") => (
        <Tag color={value === "SOLVED" ? "green" : "orange"}>{value}</Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (value: boolean) =>
        value ? (
          <Tag color="red">PRIORITY</Tag>
        ) : (
          <Text type="secondary">Normal</Text>
        ),
    },
    { title: "Assigned", dataIndex: "assignedTo", key: "assignedTo" },
  ];

  const filteredCases = useMemo(() => {
    const latestCreatedAt = Math.max(
      ...DEMO_CASES.map((item) => new Date(item.createdAt).getTime()),
    );
    const lookbackDays = windowMode === "weekly" ? 7 : 30;
    const cutoff = latestCreatedAt - lookbackDays * 24 * 60 * 60 * 1000;

    return DEMO_CASES.filter((item) => {
      const withinWindow = new Date(item.createdAt).getTime() >= cutoff;
      const matchesWard = wardFilter === "ALL" || item.ward === wardFilter;
      const matchesCategory =
        categoryFilter === "ALL" || item.category === categoryFilter;
      return withinWindow && matchesWard && matchesCategory;
    });
  }, [categoryFilter, windowMode, wardFilter]);

  const groupedRows = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        groupName: string;
        total: number;
        solved: number;
        unsolved: number;
        priority: number;
      }
    >();

    for (const item of filteredCases) {
      const key = groupBy === "ward" ? item.ward : item.category;
      const existing = groups.get(key);

      if (!existing) {
        groups.set(key, {
          key,
          groupName: key,
          total: 1,
          solved: item.statusType === "SOLVED" ? 1 : 0,
          unsolved: item.statusType === "UNSOLVED" ? 1 : 0,
          priority: item.priority ? 1 : 0,
        });
      } else {
        existing.total += 1;
        if (item.statusType === "SOLVED") existing.solved += 1;
        if (item.statusType === "UNSOLVED") existing.unsolved += 1;
        if (item.priority) existing.priority += 1;
      }
    }

    return [...groups.values()].sort((a, b) => b.total - a.total);
  }, [groupBy, filteredCases]);

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 4,
              height: 22,
              background: "#FF9933",
              borderRadius: 2,
            }}
          />
          <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
            {t("report.title")}
          </Title>
        </div>
        <Text type="secondary" style={{ marginLeft: 14 }}>
          {t("report.subtitle")}
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={12} xl={6}>
          <Card size="small" style={{ borderTop: "3px solid #1a3c6e" }}>
            <Statistic
              title={t("report.totalVotersAssisted")}
              value={overview.summary.totalVotersAssisted}
              styles={{ content: { color: "#1a3c6e", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card size="small" style={{ borderTop: "3px solid #2e7d32" }}>
            <Statistic
              title={t("report.resolvedThisPeriod")}
              value={overview.summary.resolvedThisPeriod}
              styles={{ content: { color: "#2e7d32", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card size="small" style={{ borderTop: "3px solid #e07b00" }}>
            <Statistic
              title={t("report.pendingFollowUps")}
              value={overview.summary.pendingFollowUps}
              styles={{ content: { color: "#e07b00", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card size="small" style={{ borderTop: "3px solid #722ed1" }}>
            <Statistic
              title={t("report.netScore")}
              value={overview.summary.satisfactionScore}
              suffix="%"
              styles={{ content: { color: "#722ed1", fontWeight: 800 } }}
            />
          </Card>
        </Col>
      </Row>
      <Card style={{ borderRadius: 8, marginTop: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <Title level={4} style={{ margin: 0, color: "#1a3c6e" }}>
            Today&apos;s Tasks
          </Title>
        </div>
        <Table
          size="small"
          rowKey="key"
          columns={todayTaskColumns}
          dataSource={TODAY_TASKS}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </Card>
      <div
      className="h-10"
      ></div>

      <Card
        style={{ borderRadius: 6, marginBottom: 20 }}
        title={
          <Text strong style={{ color: "#1a3c6e" }}>
            Urgent Case Register (57 Entries)
          </Text>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <Card
              size="small"
              title={`Grouped by ${groupBy === "ward" ? "Ward" : "Category"}`}
            >
              <Table
                rowKey="key"
                columns={groupedColumns}
                dataSource={groupedRows}
                size="small"
                scroll={{ x: "max-content" }}
                pagination={false}
              />
            </Card>
          </Col>
          <Col xs={24} lg={14}>
            <Table
              rowKey="id"
              columns={caseColumns}
              dataSource={filteredCases}
              size="small"
              pagination={{
                pageSize: 10,
                showTotal: (total) => `${total} entries`,
              }}
              scroll={{ x: 900 }}
            />
          </Col>
        </Row>
      </Card>

      {/* <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 4,
              height: 22,
              background: "#FF9933",
              borderRadius: 2,
            }}
          />
          <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
            Meeting Operations Dashboard
          </Title>
        </div>
        <Text type="secondary" style={{ marginLeft: 14 }}>
          Live command view of upcoming, pending, approved, and completed
          meetings.
        </Text>
      </div> */}

      {/* <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Row gutter={[12, 12]}>
            {dashboardCards.map((card) => (
              <Col xs={24} sm={12} lg={24} xl={10} key={card.key}>
                <Card
                  size="small"
                  style={{
                    borderTop: `3px solid ${card.color}`,
                  }}
                >
                  <Statistic
                    title={card.title}
                    value={card.value}
                    styles={{
                      content: {
                        color: card.color,
                        fontWeight: 800,
                      },
                    }}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Col>

        <Col xs={24} lg={10}>
          <Card style={{ borderRadius: 8, height: "100%" }}>
            <Calendar
              fullscreen={false}
              value={calendarValue}
              mode={calendarMode}
              onSelect={(value) => {
                setCalendarValue(value);
                if (calendarMode === "year") {
                  setCalendarMode("month");
                }
              }}
              onPanelChange={(value, mode) => {
                setCalendarValue(value);
                setCalendarMode(mode as CalendarMode);
              }}
              headerRender={({ value, onChange }) => {
                const shiftUnit = calendarMode === "month" ? "month" : "year";
                const headerLabel =
                  calendarMode === "month"
                    ? value.format("MMMM YYYY")
                    : value.format("YYYY");

                return (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <Button
                      aria-label="Previous"
                      type="text"
                      icon={<LeftOutlined />}
                      onClick={() => onChange(value.subtract(1, shiftUnit))}
                    />
                    <Button
                      type="text"
                      onClick={() =>
                        setCalendarMode((currentMode) =>
                          currentMode === "month" ? "year" : "month",
                        )
                      }
                      style={{ fontWeight: 600, color: "#1a3c6e" }}
                    >
                      {headerLabel}
                    </Button>
                    <Button
                      aria-label="Next"
                      type="text"
                      icon={<RightOutlined />}
                      onClick={() => onChange(value.add(1, shiftUnit))}
                    />
                  </div>
                );
              }}
              fullCellRender={(current, info) => {
                if (info.type !== "date") {
                  return info.originNode;
                }

                const hasMeeting = meetingDates.has(
                  current.format("YYYY-MM-DD"),
                );
                const isSelected = current.isSame(calendarValue, "date");

                return (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      margin: "0 auto",
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: isSelected ? 700 : 400,
                      background: hasMeeting ? "#dbeafe" : "transparent",
                      border: isSelected
                        ? "2px solid #1a3c6e"
                        : "1px solid transparent",
                      color: hasMeeting ? "#1a3c6e" : undefined,
                    }}
                  >
                    {current.date()}
                  </div>
                );
              }}
            />
          </Card>
        </Col>
      </Row> */}
    </div>
  );
}
