"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  List,
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
      { key: "road-belt", area: "Ward 3", category: "Roads", activeCases: 9, icon:"🛣️", severity: "Escalation watch" },
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
      { key: "water-grid", area: "Ward 14", category: "Water", activeCases: 28, icon: "≡ƒÆº", severity: "High priority" },
      { key: "road-belt", area: "Ward 3", category: "Roads", activeCases: 21, icon: "≡ƒ¢ú∩╕Å", severity: "Escalation watch" },
      { key: "clinic-shortage", area: "Ward 6", category: "Health", activeCases: 11, icon: "≡ƒÅÑ", severity: "Monitoring" },
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
      { key: "water-grid", area: "Ward 14", category: "Water", activeCases: 54, icon: "≡ƒÆº", severity: "High priority" },
      { key: "road-belt", area: "Ward 3", category: "Roads", activeCases: 33, icon: "≡ƒ¢ú∩╕Å", severity: "Escalation watch" },
      { key: "night-power", area: "Ward 8", category: "Power", activeCases: 19, icon: "ΓÜí", severity: "Monitoring" },
    ],
  },
};

const PROOF_PANEL_STYLE = {
  borderRadius: 8,
  minHeight: 140,
  padding: 14,
  color: "#fff",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
};

export default function ReportDashboardPage() {
  const { t } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [wardFilter, setWardFilter] = useState<string>("ALL");

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const overview = DEMO_DATA[period];

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
    if (wardFilter === "ALL") {
      return overview.wards;
    }

    return overview.wards.filter((item) => item.ward === wardFilter);
  }, [overview.wards, wardFilter]);

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
              {t("report.filter.period")}
            </Text>
            <Select
              value={period}
              onChange={(value) => setPeriod(value as PeriodKey)}
              style={{ minWidth: 170 }}
              options={[
                { value: "7d", label: t("report.filter.last7") },
                { value: "30d", label: t("report.filter.last30") },
                { value: "90d", label: t("report.filter.last90") },
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
              <Button disabled>{t("report.exportSummary")}</Button>
            </Space>
          </div>
        </Space>
      </Card>

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
          dataSource={overview.noticeTriggerList}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button key={item.assignmentId} size="small" disabled>
                  {t("report.demoPreviewAction")}
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
            {t("report.section.proof")}
          </Text>
        }
      >
        <Row gutter={[12, 12]}>
          {overview.proofGallery.map((item) => (
            <Col xs={24} md={12} lg={8} key={item.complaintId}>
              <Card size="small" title={`#${item.complaintId} - ${item.category}`}>
                <Row gutter={10}>
                  <Col span={12}>
                    <Text strong style={{ display: "block", marginBottom: 6 }}>
                      {t("report.before")}
                    </Text>
                    <div
                      style={{
                        ...PROOF_PANEL_STYLE,
                        background: `linear-gradient(140deg, ${item.beforeTone}, #111827)`,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: 700 }}>{item.beforeLabel}</Text>
                      <Text style={{ color: "rgba(255,255,255,0.8)" }}>{item.area}</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text strong style={{ display: "block", marginBottom: 6 }}>
                      {t("report.after")}
                    </Text>
                    <div
                      style={{
                        ...PROOF_PANEL_STYLE,
                        background: `linear-gradient(140deg, ${item.afterTone}, #0f172a)`,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: 700 }}>{item.afterLabel}</Text>
                      <Text style={{ color: "rgba(255,255,255,0.8)" }}>{t("report.resolvedOn")} {new Date(item.resolvedAt).toLocaleDateString("en-IN")}</Text>
                    </div>
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
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}
