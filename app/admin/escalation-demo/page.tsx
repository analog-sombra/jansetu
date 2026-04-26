"use client";

import Link from "next/link";
import {
  Button,
  Card,
  Col,
  Row,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";

import { useLanguage } from "@/components/language-provider";
import {
  getLocalizedCategory,
  getLocalizedSubcategory,
} from "@/lib/complaint-i18n";

const { Title, Text } = Typography;

type EscalationRecord = {
  id: number;
  complaintId: number;
  area: string;
  category: string;
  subcategory: string | null;
  officer: string;
  department: string;
  ageHours: number;
  status: "ASSIGNED" | "IN_PROGRESS" | "QUERY" | "ESCALATED";
  trigger: "REMINDER_48H" | "AUTO_ESCALATED_7D";
  lastActionAt: string;
};

const STATUS_COLORS: Record<EscalationRecord["status"], string> = {
  ASSIGNED: "orange",
  IN_PROGRESS: "blue",
  QUERY: "volcano",
  ESCALATED: "red",
};

const TRIGGER_COLORS: Record<EscalationRecord["trigger"], string> = {
  REMINDER_48H: "gold",
  AUTO_ESCALATED_7D: "magenta",
};

const DEMO_ESCALATIONS: EscalationRecord[] = [
  {
    id: 1,
    complaintId: 3102,
    area: "Rajouri Garden",
    category: "ROAD",
    subcategory: "POTHOLE",
    officer: "Rohit Verma",
    department: "PWD",
    ageHours: 168,
    status: "IN_PROGRESS",
    trigger: "REMINDER_48H",
    lastActionAt: "2026-04-15T12:20:00Z",
  },
  {
    id: 2,
    complaintId: 3093,
    area: "Tagore Garden",
    category: "SANITATION",
    subcategory: "GARBAGE_NOT_COLLECTED",
    officer: "Meena Sharma",
    department: "Sanitation",
    ageHours: 240,
    status: "ESCALATED",
    trigger: "AUTO_ESCALATED_7D",
    lastActionAt: "2026-04-10T10:10:00Z",
  },
  {
    id: 3,
    complaintId: 3088,
    area: "Raghubir Nagar",
    category: "WATER",
    subcategory: "WATER_LEAKAGE",
    officer: "Anil Kumar",
    department: "Delhi Jal Board",
    ageHours: 288,
    status: "QUERY",
    trigger: "REMINDER_48H",
    lastActionAt: "2026-04-14T08:45:00Z",
  },
  {
    id: 4,
    complaintId: 3079,
    area: "Rajouri Garden",
    category: "ROAD",
    subcategory: "POTHOLE",
    officer: "Rohit Verma",
    department: "PWD",
    ageHours: 336,
    status: "ESCALATED",
    trigger: "AUTO_ESCALATED_7D",
    lastActionAt: "2026-04-09T09:15:00Z",
  },
  {
    id: 5,
    complaintId: 3074,
    area: "Subhash Nagar",
    category: "ELECTRICITY",
    subcategory: "POWER_CUT",
    officer: "Pooja Singh",
    department: "BSES",
    ageHours: 360,
    status: "ASSIGNED",
    trigger: "REMINDER_48H",
    lastActionAt: "2026-04-15T14:00:00Z",
  },
];

export default function EscalationDemoPage() {
  const { t } = useLanguage();

  const escalatedCount = DEMO_ESCALATIONS.filter(
    (row) => row.status === "ESCALATED",
  ).length;
  const reminderCount = DEMO_ESCALATIONS.filter(
    (row) => row.trigger === "REMINDER_48H",
  ).length;
  const oldestHours = Math.max(...DEMO_ESCALATIONS.map((row) => row.ageHours));
  const oldestDays = Math.floor(oldestHours / 24);

  const columns: TableColumnsType<EscalationRecord> = [
    {
      title: "Complaint",
      dataIndex: "complaintId",
      key: "complaintId",
      render: (id: number) => <Text strong>#{id}</Text>,
      sorter: (a, b) => a.complaintId - b.complaintId,
    },
    {
      title: t("admin.table.category"),
      key: "category",
      render: (_, row) => (
        <div>
          <Text strong>{getLocalizedCategory(row.category, t)}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.subcategory
                ? getLocalizedSubcategory(row.subcategory, t)
                : "General"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: t("admin.table.area"),
      dataIndex: "area",
      key: "area",
    },
    {
      title: t("admin.table.officer"),
      key: "officer",
      render: (_, row) => (
        <div>
          <Text>{row.officer}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.department}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Open for (Days)",
      dataIndex: "ageHours",
      key: "ageHours",
      render: (value: number) => `${Math.floor(value / 24)} days`,
      sorter: (a, b) => a.ageHours - b.ageHours,
    },
    {
      title: "Trigger",
      dataIndex: "trigger",
      key: "trigger",
      render: (trigger: EscalationRecord["trigger"]) => (
        <Tag color={TRIGGER_COLORS[trigger]}>
          {trigger.replaceAll("_", " ")}
        </Tag>
      ),
    },
    {
      title: t("admin.table.status"),
      dataIndex: "status",
      key: "status",
      render: (status: EscalationRecord["status"]) => (
        <Tag color={STATUS_COLORS[status]}>{status.replaceAll("_", " ")}</Tag>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
          {t("admin.escalation.title")}
        </Title>
        <Text type="secondary">{t("admin.escalation.subtitle")}</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic title="Escalated Cases" value={escalatedCount} />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic title="48h Reminder Cases" value={reminderCount} />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Oldest Open Age"
              value={oldestDays}
              suffix="days"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span style={{ color: "#1a3c6e", fontWeight: 700 }}>
            Escalation Queue
          </span>
        }
        extra={
          <Link href="/admin/priority-cases-demo">
            <Button
              type="primary"
              size="small"
              style={{ background: "#1a3c6e" }}
            >
              View Priority Cases
            </Button>
          </Link>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={DEMO_ESCALATIONS}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `${total} records`,
          }}
        />
      </Card>
    </div>
  );
}
