"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Image as AntImage,
  Input,
  List,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLanguage } from "@/components/language-provider";

const { Title, Text, Paragraph } = Typography;

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

const WARD_COLOR: Record<WardStatus, string> = {
  GREEN: "#2e7d32",
  AMBER: "#e07b00",
  RED: "#c62828",
};

const HEATMAP_CARD_BACKGROUND: Record<AreaStatus, string> = {
  GREEN: "linear-gradient(155deg, #e8f5e9 0%, #c8e6c9 100%)",
  AMBER: "linear-gradient(155deg, #fff4e5 0%, #ffe0b2 100%)",
  RED: "linear-gradient(155deg, #ffebee 0%, #ffcdd2 100%)",
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
      { area: "Raghubir Nagar", complaints: 36, resolved: 22, severityScore: 88, avgResolutionDays: 5.6, topIssue: "Drain overflow", escalation: "Critical", trend: "Rising", color: "RED" },
      { area: "Rajouri Garden Main Market", complaints: 28, resolved: 19, severityScore: 76, avgResolutionDays: 4.2, topIssue: "Parking and sanitation", escalation: "High", trend: "Rising", color: "RED" },
      { area: "Tagore Garden Extension", complaints: 22, resolved: 16, severityScore: 62, avgResolutionDays: 3.8, topIssue: "Water leakage", escalation: "Watch", trend: "Stable", color: "AMBER" },
      { area: "Vishal Enclave", complaints: 18, resolved: 14, severityScore: 48, avgResolutionDays: 3.1, topIssue: "Streetlights", escalation: "Moderate", trend: "Stable", color: "AMBER" },
      { area: "Shivaji Enclave", complaints: 14, resolved: 12, severityScore: 34, avgResolutionDays: 2.7, topIssue: "Road patchwork", escalation: "Controlled", trend: "Falling", color: "GREEN" },
      { area: "Mansarovar Garden", complaints: 11, resolved: 9, severityScore: 29, avgResolutionDays: 2.4, topIssue: "Garbage pickup", escalation: "Controlled", trend: "Falling", color: "GREEN" },
    ],
    wards: [
      { ward: "Ward 11", total: 41, resolved: 34, resolutionRate: 83, avgResolutionDays: 2.8, color: "GREEN" },
      { ward: "Ward 8", total: 37, resolved: 28, resolutionRate: 76, avgResolutionDays: 3.2, color: "AMBER" },
      { ward: "Ward 3", total: 29, resolved: 20, resolutionRate: 69, avgResolutionDays: 4.4, color: "AMBER" },
      { ward: "Ward 14", total: 33, resolved: 21, resolutionRate: 64, avgResolutionDays: 4.9, color: "RED" },
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
      { department: "Public Works", issuesLogged: 57, avgResolutionDays: 3.1, slaBreachPercent: 8, workDonePhotosUploaded: 45 },
      { department: "Water Supply", issuesLogged: 49, avgResolutionDays: 3.8, slaBreachPercent: 11, workDonePhotosUploaded: 36 },
      { department: "Electricity", issuesLogged: 44, avgResolutionDays: 2.6, slaBreachPercent: 6, workDonePhotosUploaded: 31 },
      { department: "Sanitation", issuesLogged: 51, avgResolutionDays: 2.4, slaBreachPercent: 5, workDonePhotosUploaded: 40 },
    ],
    noticeTriggerList: [
      { assignmentId: 701, ticketId: 1422, officerName: "A. Verma", department: "Water Supply", reminderCount: 2, daysOverdue: 5, area: "Shivaji Nagar" },
      { assignmentId: 702, ticketId: 1431, officerName: "P. Singh", department: "Public Works", reminderCount: 3, daysOverdue: 7, area: "Lakshmi Colony" },
    ],
    proofGallery: [
      { complaintId: 9201, category: "Roads", area: "Ward 11 Main Road", resolvedAt: "2026-04-11", beforeLabel: "Potholes reported", afterLabel: "Patchwork completed", beforeTone: "#6b7280", afterTone: "#2e7d32" },
      { complaintId: 9208, category: "Water", area: "Shanti Vihar", resolvedAt: "2026-04-12", beforeLabel: "Pipeline leakage", afterLabel: "Valve repaired", beforeTone: "#1d4ed8", afterTone: "#0f766e" },
      { complaintId: 9216, category: "Sanitation", area: "Ward 8 Market", resolvedAt: "2026-04-13", beforeLabel: "Garbage overflow", afterLabel: "Daily pickup restored", beforeTone: "#92400e", afterTone: "#15803d" },
    ],
    systemicCrises: [
      { key: "water-grid", area: "Ward 14", category: "Water", activeCases: 12, icon: "💧", severity: "High priority" },
      { key: "road-belt", area: "Ward 3", category: "Roads", activeCases: 9, icon: "🛣️", severity: "Escalation watch" },
      { key: "night-power", area: "Ward 8", category: "Power", activeCases: 7, icon: "⚡", severity: "Monitoring" },
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
      { area: "Raghubir Nagar", complaints: 122, resolved: 76, severityScore: 91, avgResolutionDays: 5.9, topIssue: "Drain overflow", escalation: "Critical", trend: "Rising", color: "RED" },
      { area: "Rajouri Garden Main Market", complaints: 97, resolved: 69, severityScore: 84, avgResolutionDays: 4.7, topIssue: "Parking and sanitation", escalation: "High", trend: "Rising", color: "RED" },
      { area: "Tagore Garden", complaints: 81, resolved: 58, severityScore: 72, avgResolutionDays: 4.1, topIssue: "Water pressure", escalation: "High", trend: "Stable", color: "AMBER" },
      { area: "Vishal Enclave", complaints: 65, resolved: 48, severityScore: 58, avgResolutionDays: 3.6, topIssue: "Streetlights", escalation: "Watch", trend: "Stable", color: "AMBER" },
      { area: "Subhash Nagar Border", complaints: 54, resolved: 42, severityScore: 49, avgResolutionDays: 3.3, topIssue: "Road cuts", escalation: "Moderate", trend: "Falling", color: "AMBER" },
      { area: "Shivaji Enclave", complaints: 39, resolved: 31, severityScore: 36, avgResolutionDays: 2.9, topIssue: "Road patchwork", escalation: "Controlled", trend: "Falling", color: "GREEN" },
      { area: "Mansarovar Garden", complaints: 31, resolved: 25, severityScore: 28, avgResolutionDays: 2.6, topIssue: "Garbage pickup", escalation: "Controlled", trend: "Falling", color: "GREEN" },
      { area: "Mayapuri Link", complaints: 27, resolved: 22, severityScore: 24, avgResolutionDays: 2.5, topIssue: "Industrial waste", escalation: "Controlled", trend: "Stable", color: "GREEN" },
    ],
    wards: [
      { ward: "Ward 11", total: 163, resolved: 141, resolutionRate: 87, avgResolutionDays: 3.0, color: "GREEN" },
      { ward: "Ward 8", total: 149, resolved: 119, resolutionRate: 80, avgResolutionDays: 3.4, color: "GREEN" },
      { ward: "Ward 3", total: 121, resolved: 88, resolutionRate: 73, avgResolutionDays: 4.6, color: "AMBER" },
      { ward: "Ward 14", total: 134, resolved: 91, resolutionRate: 68, avgResolutionDays: 5.1, color: "RED" },
      { ward: "Ward 6", total: 97, resolved: 74, resolutionRate: 76, avgResolutionDays: 3.8, color: "AMBER" },
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
      { department: "Public Works", issuesLogged: 198, avgResolutionDays: 3.3, slaBreachPercent: 9, workDonePhotosUploaded: 147 },
      { department: "Water Supply", issuesLogged: 182, avgResolutionDays: 4.2, slaBreachPercent: 13, workDonePhotosUploaded: 131 },
      { department: "Electricity", issuesLogged: 156, avgResolutionDays: 2.9, slaBreachPercent: 7, workDonePhotosUploaded: 108 },
      { department: "Sanitation", issuesLogged: 203, avgResolutionDays: 2.5, slaBreachPercent: 6, workDonePhotosUploaded: 164 },
    ],
    noticeTriggerList: [
      { assignmentId: 715, ticketId: 1468, officerName: "R. Khan", department: "Water Supply", reminderCount: 3, daysOverdue: 9, area: "Azad Chowk" },
      { assignmentId: 718, ticketId: 1489, officerName: "S. Patel", department: "Public Works", reminderCount: 2, daysOverdue: 6, area: "Ward 14 Ring Road" },
      { assignmentId: 721, ticketId: 1497, officerName: "M. Yadav", department: "Electricity", reminderCount: 2, daysOverdue: 4, area: "Model Town" },
    ],
    proofGallery: [
      { complaintId: 9324, category: "Roads", area: "Ward 11 Main Road", resolvedAt: "2026-04-04", beforeLabel: "Broken surface", afterLabel: "Resurfaced corridor", beforeTone: "#4b5563", afterTone: "#166534" },
      { complaintId: 9351, category: "Power", area: "Model Town", resolvedAt: "2026-04-06", beforeLabel: "Transformer outage", afterLabel: "Backup line restored", beforeTone: "#7c2d12", afterTone: "#b45309" },
      { complaintId: 9390, category: "Health", area: "Civil Dispensary", resolvedAt: "2026-04-08", beforeLabel: "Medicine shortage", afterLabel: "Stock replenished", beforeTone: "#7f1d1d", afterTone: "#15803d" },
    ],
    systemicCrises: [
      { key: "water-grid", area: "Ward 14", category: "Water", activeCases: 28, icon: "💧", severity: "High priority" },
      { key: "road-belt", area: "Ward 3", category: "Roads", activeCases: 21, icon: "🛣️", severity: "Escalation watch" },
      { key: "clinic-shortage", area: "Ward 6", category: "Health", activeCases: 11, icon: "🏥", severity: "Monitoring" },
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
      { area: "Raghubir Nagar", complaints: 344, resolved: 227, severityScore: 93, avgResolutionDays: 6.2, topIssue: "Drain overflow", escalation: "Critical", trend: "Rising", color: "RED" },
      { area: "Rajouri Garden Main Market", complaints: 281, resolved: 204, severityScore: 86, avgResolutionDays: 5.0, topIssue: "Parking and sanitation", escalation: "Critical", trend: "Rising", color: "RED" },
      { area: "Tagore Garden", complaints: 239, resolved: 176, severityScore: 74, avgResolutionDays: 4.4, topIssue: "Water pressure", escalation: "High", trend: "Stable", color: "AMBER" },
      { area: "Vishal Enclave", complaints: 204, resolved: 158, severityScore: 61, avgResolutionDays: 3.8, topIssue: "Streetlights", escalation: "Watch", trend: "Stable", color: "AMBER" },
      { area: "Subhash Nagar Border", complaints: 178, resolved: 139, severityScore: 53, avgResolutionDays: 3.6, topIssue: "Road cuts", escalation: "Watch", trend: "Stable", color: "AMBER" },
      { area: "Shivaji Enclave", complaints: 141, resolved: 117, severityScore: 38, avgResolutionDays: 3.1, topIssue: "Road patchwork", escalation: "Controlled", trend: "Falling", color: "GREEN" },
      { area: "Mansarovar Garden", complaints: 127, resolved: 108, severityScore: 32, avgResolutionDays: 2.9, topIssue: "Garbage pickup", escalation: "Controlled", trend: "Falling", color: "GREEN" },
      { area: "Mayapuri Link", complaints: 118, resolved: 101, severityScore: 27, avgResolutionDays: 2.8, topIssue: "Industrial waste", escalation: "Controlled", trend: "Stable", color: "GREEN" },
    ],
    wards: [
      { ward: "Ward 11", total: 449, resolved: 382, resolutionRate: 85, avgResolutionDays: 3.4, color: "GREEN" },
      { ward: "Ward 8", total: 401, resolved: 321, resolutionRate: 80, avgResolutionDays: 3.9, color: "GREEN" },
      { ward: "Ward 3", total: 366, resolved: 256, resolutionRate: 70, avgResolutionDays: 5.0, color: "AMBER" },
      { ward: "Ward 14", total: 394, resolved: 257, resolutionRate: 65, avgResolutionDays: 5.6, color: "RED" },
      { ward: "Ward 6", total: 288, resolved: 216, resolutionRate: 75, avgResolutionDays: 4.1, color: "AMBER" },
      { ward: "Ward 2", total: 247, resolved: 195, resolutionRate: 79, avgResolutionDays: 3.7, color: "GREEN" },
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
      { department: "Public Works", issuesLogged: 602, avgResolutionDays: 3.7, slaBreachPercent: 11, workDonePhotosUploaded: 438 },
      { department: "Water Supply", issuesLogged: 571, avgResolutionDays: 4.5, slaBreachPercent: 15, workDonePhotosUploaded: 403 },
      { department: "Electricity", issuesLogged: 490, avgResolutionDays: 3.1, slaBreachPercent: 8, workDonePhotosUploaded: 355 },
      { department: "Sanitation", issuesLogged: 633, avgResolutionDays: 2.8, slaBreachPercent: 7, workDonePhotosUploaded: 491 },
    ],
    noticeTriggerList: [
      { assignmentId: 801, ticketId: 1608, officerName: "K. Sharma", department: "Water Supply", reminderCount: 4, daysOverdue: 12, area: "Ward 14 Low Zone" },
      { assignmentId: 806, ticketId: 1621, officerName: "D. Mishra", department: "Public Works", reminderCount: 3, daysOverdue: 10, area: "Bypass Corridor" },
      { assignmentId: 814, ticketId: 1654, officerName: "N. Ali", department: "Sanitation", reminderCount: 3, daysOverdue: 8, area: "Old Market" },
    ],
    proofGallery: [
      { complaintId: 9511, category: "Roads", area: "Bypass Corridor", resolvedAt: "2026-03-15", beforeLabel: "Unsafe shoulder", afterLabel: "Drain and shoulder rebuilt", beforeTone: "#374151", afterTone: "#166534" },
      { complaintId: 9562, category: "Water", area: "Ward 14 Low Zone", resolvedAt: "2026-03-28", beforeLabel: "Low pressure blocks", afterLabel: "Booster line commissioned", beforeTone: "#1e3a8a", afterTone: "#0f766e" },
      { complaintId: 9604, category: "Sanitation", area: "Old Market", resolvedAt: "2026-04-02", beforeLabel: "Overflowing bins", afterLabel: "Route optimization applied", beforeTone: "#92400e", afterTone: "#15803d" },
    ],
    systemicCrises: [
      { key: "water-grid", area: "Ward 14", category: "Water", activeCases: 54, icon: "💧", severity: "High priority" },
      { key: "road-belt", area: "Ward 3", category: "Roads", activeCases: 33, icon: "🛣️", severity: "Escalation watch" },
      { key: "night-power", area: "Ward 8", category: "Power", activeCases: 19, icon: "⚡", severity: "Monitoring" },
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
  "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=840&q=80",
  "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=840&q=80",
  "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=840&q=80",
  "https://images.unsplash.com/photo-1517022812141-23620dba5c23?auto=format&fit=crop&w=840&q=80",
  "https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?auto=format&fit=crop&w=840&q=80",
  "https://images.unsplash.com/photo-1457530378978-8bac673b8062?auto=format&fit=crop&w=840&q=80",
  "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=840&q=80",
  "https://images.unsplash.com/photo-1532960400857-e8d9d275d858?auto=format&fit=crop&w=840&q=80",
  "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=840&q=80",
  "https://images.unsplash.com/photo-1579508542697-bb18e7d9aeaa?auto=format&fit=crop&w=840&q=80",
];

const UNSPLASH_AFTER = [
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=840&q=80",
  "https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=840&q=80",
  "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=840&q=80",
  "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=840&q=80",
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=840&q=80",
  "https://images.unsplash.com/photo-1508450859948-4e04fabaa4ea?auto=format&fit=crop&w=840&q=80",
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=840&q=80",
  "https://images.unsplash.com/photo-1431576901776-e539bd916ba2?auto=format&fit=crop&w=840&q=80",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=840&q=80",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=840&q=80",
];

const DEMO_CASES: DemoCaseEntry[] = Array.from({ length: 50 }, (_, index) => {
  const id = 12001 + index;
  const ward = DEMO_WARDS[index % DEMO_WARDS.length];
  const area = DEMO_AREAS[index % DEMO_AREAS.length];
  const category = DEMO_CATEGORIES[index % DEMO_CATEGORIES.length];
  const statusType = index % 4 === 0 || index % 7 === 0 ? "UNSOLVED" : "SOLVED";
  const priority = index % 5 === 0 || index % 9 === 0;

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
    createdAt: new Date(Date.UTC(2026, 2, (index % 28) + 1, 9, 10)).toISOString(),
    resolvedAt:
      statusType === "SOLVED"
        ? new Date(Date.UTC(2026, 3, (index % 26) + 1, 11, 30)).toISOString()
        : null,
  };
});

function buildLetterDraft(entry: DemoCaseEntry) {
  return [
    "OFFICE OF MLA - JAN SETU",
    "Subject: Show Cause Notice for Delayed Grievance Resolution",
    "",
    `Complaint Ref: #${entry.id}`,
    `Ward: ${entry.ward}`,
    `Area: ${entry.area}`,
    `Category: ${entry.category}`,
    `Assigned Officer: ${entry.assignedTo}`,
    `Priority Flag: ${entry.priority ? "Yes" : "No"}`,
    "",
    "You are hereby directed to submit a written explanation for delay and provide an immediate action plan within 24 hours.",
    "Failure to comply may invite disciplinary review as per office protocol.",
    "",
    "Issued by:",
    "MLA Constituency Office",
  ].join("\n");
}

export default function ReportDashboardPage() {
  const { t } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  const [windowMode, setWindowMode] = useState<ReportWindow>("monthly");
  const [wardFilter, setWardFilter] = useState<string>("ALL");
  const [groupBy, setGroupBy] = useState<GroupByKey>("ward");
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftCase, setDraftCase] = useState<DemoCaseEntry | null>(null);
  const [exporting, setExporting] = useState<ReportWindow | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const overviewPeriod: PeriodKey = windowMode === "weekly" ? "7d" : "30d";
  const overview = DEMO_DATA[overviewPeriod];

  function getFilteredCasesForWindow(mode: ReportWindow) {
    const latestCreatedAt = Math.max(
      ...DEMO_CASES.map((item) => new Date(item.createdAt).getTime()),
    );
    const lookbackDays = mode === "weekly" ? 7 : 30;
    const cutoff = latestCreatedAt - lookbackDays * 24 * 60 * 60 * 1000;

    return DEMO_CASES.filter((item) => {
      const withinWindow = new Date(item.createdAt).getTime() >= cutoff;
      const matchesWard = wardFilter === "ALL" || item.ward === wardFilter;
      return withinWindow && matchesWard;
    });
  }

  function getNoticeRows(cases: DemoCaseEntry[]) {
    return cases
      .filter((item) => item.statusType === "UNSOLVED" || item.priority)
      .slice(0, 8)
      .map((item, index) => ({
        assignmentId: 900 + index,
        ticketId: item.id,
        officerName: item.assignedTo,
        department: item.category,
        reminderCount: item.priority ? 3 : 2,
        daysOverdue: item.priority ? 7 : 4,
        area: item.area,
      }));
  }

  async function downloadReportExcel(mode: ReportWindow) {
    setExporting(mode);
    try {
      const { utils, writeFile } = await import("xlsx");
      const period: PeriodKey = mode === "weekly" ? "7d" : "30d";
      const report = DEMO_DATA[period];
      const cases = getFilteredCasesForWindow(mode);
      const solved = cases.filter((item) => item.statusType === "SOLVED");
      const unsolved = cases.filter((item) => item.statusType === "UNSOLVED");
      const priority = cases.filter((item) => item.priority);

      const groupedMap = new Map<
        string,
        { group: string; total: number; solved: number; unsolved: number; priority: number }
      >();
      for (const item of cases) {
        const key = groupBy === "ward" ? item.ward : item.category;
        const existing = groupedMap.get(key);
        if (!existing) {
          groupedMap.set(key, {
            group: key,
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

      const areaMap = new Map<
        string,
        { area: string; total: number; solved: number; unsolved: number; priority: number }
      >();
      for (const item of cases) {
        const existing = areaMap.get(item.area);
        if (!existing) {
          areaMap.set(item.area, {
            area: item.area,
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

      const areaSummary = [...areaMap.values()].sort((a, b) => b.total - a.total);

      function appendFormattedSheet(sheetName: string, rows: Array<Record<string, unknown>>) {
        const worksheet = utils.json_to_sheet(rows);
        if (rows.length > 0) {
          const headers = Object.keys(rows[0]);
          worksheet["!cols"] = headers.map((key) => {
            const maxLen = Math.max(
              key.length,
              ...rows.map((row) => String(row[key] ?? "").length),
            );
            return { wch: Math.min(Math.max(maxLen + 2, 12), 42) };
          });

          const endCol = utils.encode_col(headers.length - 1);
          const endRow = rows.length + 1;
          worksheet["!autofilter"] = { ref: `A1:${endCol}${endRow}` };
          worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };
        }

        utils.book_append_sheet(workbook, worksheet, sheetName);
      }

      const workbook = utils.book_new();

      appendFormattedSheet("Summary", [
        {
          "Report Window": mode,
          "Ward Filter": wardFilter,
          "Group By": groupBy,
          "Total Entries": cases.length,
          "Solved Cases": solved.length,
          "Unsolved Cases": unsolved.length,
          "Priority Cases": priority.length,
          "Total Voters Assisted": report.summary.totalVotersAssisted,
          "Resolved This Period": report.summary.resolvedThisPeriod,
          "Pending Follow Ups": report.summary.pendingFollowUps,
          "Satisfaction Score": report.summary.satisfactionScore,
          "Areas Covered": areaSummary.map((item) => item.area).join(", "),
        },
      ]);

      appendFormattedSheet(
        "Case Register",
        cases.map((item) => ({
          "Complaint ID": item.id,
          Ward: item.ward,
          Area: item.area,
          Category: item.category,
          Status: item.statusType,
          Priority: item.priority ? "YES" : "NO",
          "Assigned To": item.assignedTo,
          "Created At": item.createdAt,
          "Resolved At": item.resolvedAt ?? "",
          "Before Image URL": item.beforeImageUrl,
          "After Image URL": item.afterImageUrl,
        })),
      );

      appendFormattedSheet(
        "Grouped",
        [...groupedMap.values()].map((row) => ({
          Group: row.group,
          "Total Cases": row.total,
          Solved: row.solved,
          Unsolved: row.unsolved,
          Priority: row.priority,
        })),
      );

      appendFormattedSheet("Area Summary", areaSummary);

      appendFormattedSheet("Trend", report.trend);

      appendFormattedSheet("Area Heatmap", report.areaHeatmap);

      appendFormattedSheet("Wards", report.wards);

      appendFormattedSheet("Departments", report.departmentReportCard);

      appendFormattedSheet("Notice Triggers", getNoticeRows(cases));

      appendFormattedSheet(
        "Proof Gallery",
        solved.slice(0, 10).map((item) => ({
          "Complaint ID": item.id,
          Area: item.area,
          Category: item.category,
          "Resolved At": item.resolvedAt ?? "",
          "Before Image URL": item.beforeImageUrl,
          "After Image URL": item.afterImageUrl,
        })),
      );

      appendFormattedSheet("Systemic Crises", report.systemicCrises);

      writeFile(workbook, `report-demo-${mode}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExporting(null);
    }
  }

  const filteredCases = useMemo(() => {
    const latestCreatedAt = Math.max(
      ...DEMO_CASES.map((item) => new Date(item.createdAt).getTime()),
    );
    const lookbackDays = windowMode === "weekly" ? 7 : 30;
    const cutoff = latestCreatedAt - lookbackDays * 24 * 60 * 60 * 1000;

    return DEMO_CASES.filter((item) => {
      const withinWindow = new Date(item.createdAt).getTime() >= cutoff;
      const matchesWard = wardFilter === "ALL" || item.ward === wardFilter;
      return withinWindow && matchesWard;
    });
  }, [windowMode, wardFilter]);

  const wardOptions = useMemo(
    () => [
      { label: t("report.filter.allWards"), value: "ALL" },
      ...overview.wards.map((item) => ({
        label: item.ward,
        value: item.ward,
      })),
    ],
    [overview.wards, t],
  );

  const filteredWards = useMemo(() => {
    const summary = new Map<
      string,
      { ward: string; total: number; resolved: number; avgResolutionDays: number; color: WardStatus }
    >();

    for (const item of filteredCases) {
      const existing = summary.get(item.ward);
      if (!existing) {
        summary.set(item.ward, {
          ward: item.ward,
          total: 1,
          resolved: item.statusType === "SOLVED" ? 1 : 0,
          avgResolutionDays: item.statusType === "SOLVED" ? 3.2 : 5.4,
          color: "AMBER",
        });
      } else {
        existing.total += 1;
        if (item.statusType === "SOLVED") existing.resolved += 1;
      }
    }

    return [...summary.values()].map((row) => {
      const resolutionRate = row.total > 0 ? Math.round((row.resolved / row.total) * 100) : 0;
      let color: WardStatus = "RED";
      if (resolutionRate >= 80) color = "GREEN";
      else if (resolutionRate >= 65) color = "AMBER";

      return {
        ward: row.ward,
        total: row.total,
        resolved: row.resolved,
        resolutionRate,
        avgResolutionDays: row.avgResolutionDays,
        color,
      };
    });
  }, [filteredCases]);

  const topAffectedAreas = useMemo(
    () => [...overview.areaHeatmap].sort((left, right) => right.complaints - left.complaints),
    [overview.areaHeatmap],
  );

  const departmentColumns = [
    {
      title: t("report.table.department"),
      dataIndex: "department",
      key: "department",
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: t("report.table.issuesLogged"),
      dataIndex: "issuesLogged",
      key: "issuesLogged",
    },
    {
      title: t("report.table.avgResolution"),
      dataIndex: "avgResolutionDays",
      key: "avgResolutionDays",
      render: (value: number) => `${value} ${t("report.days")}`,
    },
    {
      title: t("report.table.slaBreach"),
      dataIndex: "slaBreachPercent",
      key: "slaBreachPercent",
      render: (value: number) => (
        <Tag color={value >= 20 ? "red" : value >= 10 ? "orange" : "green"}>
          {value}%
        </Tag>
      ),
    },
    {
      title: t("report.table.workDonePhotos"),
      dataIndex: "workDonePhotosUploaded",
      key: "workDonePhotosUploaded",
    },
  ];

  const solvedCases = filteredCases.filter((item) => item.statusType === "SOLVED");
  const unsolvedCases = filteredCases.filter((item) => item.statusType === "UNSOLVED");
  const priorityCases = filteredCases.filter((item) => item.priority);
  const proofPhotoCases = solvedCases.slice(0, 10);

  const noticeTriggerRows = useMemo(() => {
    return filteredCases
      .filter((item) => item.statusType === "UNSOLVED" || item.priority)
      .slice(0, 8)
      .map((item, index) => ({
        assignmentId: 900 + index,
        ticketId: item.id,
        officerName: item.assignedTo,
        department: item.category,
        reminderCount: item.priority ? 3 : 2,
        daysOverdue: item.priority ? 7 : 4,
        area: item.area,
      }));
  }, [filteredCases]);

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
        value ? <Tag color="red">PRIORITY</Tag> : <Text type="secondary">Normal</Text>,
    },
    { title: "Assigned", dataIndex: "assignedTo", key: "assignedTo" },
  ];

  function openDraftFromNotice(area: string) {
    const matched =
      filteredCases.find(
        (item) =>
          item.area.toLowerCase().includes(area.toLowerCase()) &&
          item.statusType === "UNSOLVED",
      ) ?? priorityCases[0] ?? filteredCases[0] ?? DEMO_CASES[0];

    setDraftCase(matched);
    setDraftOpen(true);
  }

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

      {/* <Alert
        type="info"
        showIcon
        style={{ marginBottom: 20, borderRadius: 8 }}
        title={t("report.demoBanner")}
        description={t("report.demoBannerDesc")}
      /> */}

      <Card style={{ borderRadius: 6, marginBottom: 20 }}>
        <Space wrap style={{ width: "100%" }}>
          <div>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              Report Window
            </Text>
            <Select
              value={windowMode}
              onChange={(value) => setWindowMode(value as ReportWindow)}
              style={{ minWidth: 170 }}
              options={[
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
              ]}
            />
          </div>

          <div>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              Group By
            </Text>
            <Select
              value={groupBy}
              onChange={(value) => setGroupBy(value as GroupByKey)}
              style={{ minWidth: 170 }}
              options={[
                { value: "ward", label: "Ward" },
                { value: "category", label: "Category" },
              ]}
            />
          </div>

          <div>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {t("report.filter.wardFocus")}
            </Text>
            <Select
              value={wardFilter}
              onChange={setWardFilter}
              style={{ minWidth: 220 }}
              options={wardOptions}
            />
          </div>

          <div style={{ marginLeft: "auto" }}>
            <Space>
              <Tag color="blue">{t("report.demoTag")}</Tag>
              <Button
                onClick={() => void downloadReportExcel("weekly")}
                loading={exporting === "weekly"}
              >
                Download Weekly Report
              </Button>
              <Button
                type="primary"
                onClick={() => void downloadReportExcel("monthly")}
                loading={exporting === "monthly"}
                style={{ background: "#1a3c6e", borderColor: "#1a3c6e" }}
              >
                Download Monthly Report
              </Button>
            </Space>
          </div>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={12} xl={6}>
          <Card size="small" style={{ borderTop: "3px solid #1a3c6e" }}>
            <Statistic
              title="Total Entries"
              value={filteredCases.length}
              styles={{ content: { color: "#1a3c6e", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card size="small" style={{ borderTop: "3px solid #2e7d32" }}>
            <Statistic
              title="Solved"
              value={solvedCases.length}
              styles={{ content: { color: "#2e7d32", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card size="small" style={{ borderTop: "3px solid #e07b00" }}>
            <Statistic
              title="Unsolved"
              value={unsolvedCases.length}
              styles={{ content: { color: "#e07b00", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card size="small" style={{ borderTop: "3px solid #c62828" }}>
            <Statistic
              title="Priority"
              value={priorityCases.length}
              styles={{ content: { color: "#c62828", fontWeight: 800 } }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ borderRadius: 6, marginBottom: 20 }}
        title={
          <Text strong style={{ color: "#1a3c6e" }}>
            Case Register (50 Entries)
          </Text>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <Card size="small" title={`Grouped by ${groupBy === "ward" ? "Ward" : "Category"}`}>
              <Table
                rowKey="key"
                columns={groupedColumns}
                dataSource={groupedRows}
                size="small"
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

      <Card
        style={{ borderRadius: 6, marginBottom: 20 }}
        title={
          <Text strong style={{ color: "#1a3c6e" }}>
            {t("report.section.healthMap")}
          </Text>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card size="small" title={t("report.demoTrendTitle")}>
              <div style={{ height: 280 }}>
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={overview.trend}>
                      <defs>
                        <linearGradient id="complaintsFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1a3c6e" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#1a3c6e" stopOpacity={0.04} />
                        </linearGradient>
                        <linearGradient id="resolvedFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#2e7d32" stopOpacity={0.04} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="complaints"
                        stroke="#1a3c6e"
                        fill="url(#complaintsFill)"
                        strokeWidth={2}
                        name={t("report.demoComplaints")}
                      />
                      <Area
                        type="monotone"
                        dataKey="resolved"
                        stroke="#2e7d32"
                        fill="url(#resolvedFill)"
                        strokeWidth={2}
                        name={t("report.demoResolved")}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: "100%", borderRadius: 8, background: "linear-gradient(180deg, #f7f9fc 0%, #eef3f8 100%)" }} />
                )}
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card size="small" title={t("report.healthMap.wardPerformance")}>
              <div style={{ height: 280 }}>
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredWards}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="ward" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value ?? 0}%`, t("report.resolutionRate")]} />
                      <Bar dataKey="resolutionRate" radius={[6, 6, 0, 0]}>
                        {filteredWards.map((entry) => (
                          <Cell key={entry.ward} fill={WARD_COLOR[entry.color]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: "100%", borderRadius: 8, background: "linear-gradient(180deg, #f7f9fc 0%, #eef3f8 100%)" }} />
                )}
              </div>
            </Card>
          </Col>

          <Col span={24}>
            <Card size="small" title={t("report.rajouriGardenMapTitle")}>
              <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                {t("report.rajouriGardenMapDesc")}
              </Paragraph>

              <Space wrap size={[8, 8]} style={{ marginBottom: 16 }}>
                <Tag color="red">{t("report.heatLegend.red")}</Tag>
                <Tag color="orange">{t("report.heatLegend.orange")}</Tag>
                <Tag color="green">{t("report.heatLegend.green")}</Tag>
              </Space>

              <Row gutter={[16, 16]}>
                <Col xs={24} xl={16}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {overview.areaHeatmap.map((item) => {
                      const resolutionRate = Math.round((item.resolved / item.complaints) * 100);
                      return (
                        <div
                          key={item.area}
                          style={{
                            background: HEATMAP_CARD_BACKGROUND[item.color],
                            border: `1px solid ${WARD_COLOR[item.color]}22`,
                            borderRadius: 10,
                            padding: 14,
                            minHeight: 170,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                              <Text strong style={{ color: "#1f2937", fontSize: 14 }}>
                                {item.area}
                              </Text>
                              <Tag color={item.color === "RED" ? "red" : item.color === "AMBER" ? "orange" : "green"}>
                                {item.escalation}
                              </Tag>
                            </div>
                            <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 6 }}>
                              {t("report.dominantIssue")}: {item.topIssue}
                            </Text>
                          </div>

                          <Space orientation="vertical" size={6} style={{ width: "100%" }}>
                            <Text>
                              <strong>{item.complaints}</strong> {t("report.grievances")}
                            </Text>
                            <Progress
                              percent={resolutionRate}
                              strokeColor={WARD_COLOR[item.color]}
                              size="small"
                              format={() => `${resolutionRate}% ${t("report.demoResolved")}`}
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {t("report.avgResolution")}: {item.avgResolutionDays} {t("report.days")} | {t("report.demoTrend")}: {item.trend}
                            </Text>
                          </Space>
                        </div>
                      );
                    })}
                  </div>
                </Col>

                <Col xs={24} xl={8}>
                  <Card size="small" title={t("report.topAffectedAreas")} style={{ height: "100%" }}>
                    <List
                      dataSource={topAffectedAreas.slice(0, 5)}
                      renderItem={(item, index) => {
                        const resolutionRate = Math.round((item.resolved / item.complaints) * 100);
                        return (
                          <List.Item>
                            <div style={{ width: "100%" }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 10,
                                  marginBottom: 6,
                                }}
                              >
                                <Text strong>
                                  {index + 1}. {item.area}
                                </Text>
                                <Tag color={item.color === "RED" ? "red" : item.color === "AMBER" ? "orange" : "green"}>
                                  {item.severityScore}
                                </Tag>
                              </div>
                              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                                {item.topIssue}
                              </Text>
                              <Progress
                                percent={Math.min(item.severityScore, 100)}
                                strokeColor={WARD_COLOR[item.color]}
                                size="small"
                                format={() => `${item.complaints} ${t("report.grievances")}`}
                              />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {t("report.resolutionRate")}: {resolutionRate}% | {t("report.demoTrend")}: {item.trend}
                              </Text>
                            </div>
                          </List.Item>
                        );
                      }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col span={24}>
            <Card size="small" title={t("report.healthMap.masterCases")}>
              <Row gutter={[12, 12]}>
                {overview.systemicCrises.map((item) => (
                  <Col xs={24} md={8} key={item.key}>
                    <Card
                      size="small"
                      style={{
                        borderLeft: "4px solid #c62828",
                        boxShadow: "0 0 0 1px rgba(198,40,40,0.08)",
                      }}
                    >
                      <Space orientation="vertical" size={4} style={{ width: "100%" }}>
                        <Text strong style={{ fontSize: 16 }}>
                          {item.icon} {item.category}
                        </Text>
                        <Text type="secondary">
                          {t("report.area")}: {item.area}
                        </Text>
                        <Text>
                          {t("report.activeCluster")}: <strong>{item.activeCases}</strong> {t("report.grievances")}
                        </Text>
                        <Tag color="red">{item.severity}</Tag>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card
        style={{ borderRadius: 6, marginBottom: 20 }}
        title={
          <Text strong style={{ color: "#1a3c6e" }}>
            {t("report.section.impact")}
          </Text>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card size="small" title={t("report.serviceRecord")}>
              <div style={{ height: 300 }}>
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overview.serviceRecord}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="fixed" stackId="services" fill="#1a3c6e" radius={[6, 6, 0, 0]} name={t("report.demoResolved")} />
                      <Bar dataKey="backlog" stackId="services" fill="#e07b00" radius={[6, 6, 0, 0]} name={t("report.demoBacklog")} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: "100%", borderRadius: 8, background: "linear-gradient(180deg, #f7f9fc 0%, #eef3f8 100%)" }} />
                )}
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card size="small" title={t("report.sentimentTitle")}>
              <div style={{ height: 300 }}>
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overview.constituencySentiment}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={92}
                        paddingAngle={3}
                      >
                        {overview.constituencySentiment.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value ?? 0}%`, t("report.netScore")]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: "100%", borderRadius: 8, background: "linear-gradient(180deg, #f7f9fc 0%, #eef3f8 100%)" }} />
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card
        style={{ borderRadius: 6, marginBottom: 20 }}
        title={
          <Text strong style={{ color: "#1a3c6e" }}>
            {t("report.section.departmental")}
          </Text>
        }
      >
        <Table
          columns={departmentColumns}
          dataSource={overview.departmentReportCard}
          rowKey="department"
          pagination={false}
          size="middle"
          scroll={{ x: 720 }}
        />

        <Divider />
        <Title level={5}>{t("report.noticeTriggers")}</Title>
        <List
          dataSource={noticeTriggerRows}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key={item.assignmentId}
                  size="small"
                  type="primary"
                  onClick={() => openDraftFromNotice(item.area)}
                  style={{ background: "#1a3c6e", borderColor: "#1a3c6e" }}
                >
                  Create Letter Draft
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>
                      {t("report.ticket")} #{item.ticketId}
                    </Text>
                    <Tag color="red">
                      {item.daysOverdue} {t("report.daysOverdue")}
                    </Tag>
                  </Space>
                }
                description={`${item.department} | ${item.officerName} | ${item.reminderCount} reminders | ${item.area}`}
              />
            </List.Item>
          )}
        />
      </Card>

      <Card
        style={{ borderRadius: 6, marginBottom: 20 }}
        title={
          <Text strong style={{ color: "#1a3c6e" }}>
            {t("report.section.proof")} (10 Cases)
          </Text>
        }
      >
        <Row gutter={[12, 12]}>
          {proofPhotoCases.map((item) => (
            <Col xs={24} md={12} lg={8} key={item.id}>
              <Card size="small" title={`#${item.id} - ${item.category}`}>
                <Row gutter={10}>
                  <Col span={12}>
                    <Text strong style={{ display: "block", marginBottom: 6 }}>
                      {t("report.before")}
                    </Text>
                    <AntImage
                      src={item.beforeImageUrl}
                      alt={`Before case ${item.id}`}
                      preview={false}
                      style={{ width: "100%", height: 128, borderRadius: 8, objectFit: "cover" }}
                    />
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 6 }}>
                      {item.area}
                    </Text>
                  </Col>
                  <Col span={12}>
                    <Text strong style={{ display: "block", marginBottom: 6 }}>
                      {t("report.after")}
                    </Text>
                    <AntImage
                      src={item.afterImageUrl}
                      alt={`After case ${item.id}`}
                      preview={false}
                      style={{ width: "100%", height: 128, borderRadius: 8, objectFit: "cover" }}
                    />
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 6 }}>
                      {t("report.resolvedOn")} {item.resolvedAt ? new Date(item.resolvedAt).toLocaleDateString("en-IN") : "-"}
                    </Text>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        style={{ borderRadius: 6 }}
        title={
          <Text strong style={{ color: "#1a3c6e" }}>
            {t("report.section.noticeHub")}
          </Text>
        }
      >
        <Paragraph type="secondary" style={{ marginBottom: 14 }}>
          {t("report.noticeHubDesc")}
        </Paragraph>

        <Row gutter={[16, 16]}>
          {filteredWards.map((item) => (
            <Col xs={24} md={12} lg={8} key={item.ward}>
              <Card size="small">
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  {item.ward}
                </Text>
                <Progress
                  percent={item.resolutionRate}
                  strokeColor={WARD_COLOR[item.color]}
                  size="small"
                  format={(value) => `${value}%`}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t("report.avgResolution")}: {item.avgResolutionDays} {t("report.days")} | {t("report.cases")}: {item.total}
                </Text>
                <div style={{ marginTop: 12 }}>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => openDraftFromNotice(item.ward)}
                    style={{ background: "#1a3c6e", borderColor: "#1a3c6e" }}
                  >
                    Create Letter Draft
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Modal
        title={draftCase ? `Letter Draft for #${draftCase.id}` : "Letter Draft"}
        open={draftOpen}
        onCancel={() => setDraftOpen(false)}
        width={760}
        footer={[
          <Button key="close" onClick={() => setDraftOpen(false)}>
            Close
          </Button>,
          <Button
            key="copy"
            type="primary"
            disabled={!draftCase}
            onClick={() => {
              if (!draftCase) return;
              void navigator.clipboard.writeText(buildLetterDraft(draftCase));
            }}
          >
            Copy Draft
          </Button>,
        ]}
      >
        <Input.TextArea
          rows={16}
          readOnly
          value={draftCase ? buildLetterDraft(draftCase) : "Select a case to create a draft"}
        />
      </Modal>
    </div>
  );
}