"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Select,
  Input,
  Button,
  Row,
  Col,
  Statistic,
  Typography,
  Tag,
  Alert,
} from "antd";

import { COMPLAINT_CATEGORIES } from "@/lib/constants";
import type { TableColumnsType } from "antd";
import { useLanguage } from "@/components/language-provider";
import { getLocalizedCategory } from "@/lib/complaint-i18n";

const { Title, Text } = Typography;

const STATUS_OPTIONS = [
  "PENDING",
  "IN_PROGRESS",
  "WORK_IN_PROGESS",
  "QUERY_RAISED",
  "RESOLVED",
  "REJECTED",
  "ESCALATED",
  "AUTO_CLOSED",
] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "orange",
  IN_PROGRESS: "blue",
  WORK_IN_PROGESS: "cyan",
  QUERY_RAISED: "volcano",
  RESOLVED: "green",
  REJECTED: "red",
  ESCALATED: "purple",
  AUTO_CLOSED: "default",
};

type Complaint = {
  id: number;
  category: string;
  area: string | null;
  status: string;
  plannedCompletionDate: string | null;
  lat: number;
  lng: number;
  assignments: Array<{
    id: number;
    officer: { name: string; department: { name: string } };
  }>;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(
    undefined,
  );
  const [areaFilter, setAreaFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData(overrides?: {
    status?: string;
    category?: string;
    area?: string;
  }) {
    setLoading(true);
    const query = new URLSearchParams();
    const s = overrides?.status ?? statusFilter;
    const c = overrides?.category ?? categoryFilter;
    const a = overrides?.area ?? areaFilter;
    if (s) query.set("status", s);
    if (c) query.set("category", c);
    if (a?.trim()) query.set("area", a.trim());

    const response = await fetch(`/api/complaints?${query.toString()}`);
    const result = await response.json();
    setLoading(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }
    if (!response.ok) {
      setError(result.error ?? t("admin.error.fetch"));
      return;
    }
    setComplaints(result.complaints);
    setError("");
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void loadData();
    });
    return () => cancelAnimationFrame(frame);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const analytics = useMemo(() => {
    const byDepartment: Record<string, number> = {};
    let resolved = 0;
    for (const complaint of complaints) {
      if (complaint.status === "RESOLVED") resolved++;
      for (const assignment of complaint.assignments) {
        const dept = assignment.officer.department.name;
        byDepartment[dept] = (byDepartment[dept] ?? 0) + 1;
      }
    }
    const resolutionRate =
      complaints.length > 0 ? (resolved / complaints.length) * 100 : 0;
    return { byDepartment, resolutionRate, resolved };
  }, [complaints]);

  const columns: TableColumnsType<Complaint> = [
    {
      title: t("admin.table.refNo"),
      dataIndex: "id",
      key: "id",
      width: 80,
      render: (id: number) => (
        <Text strong style={{ color: "#1a3c6e" }}>
          #{id}
        </Text>
      ),
      sorter: (a, b) => a.id - b.id,
      defaultSortOrder: "descend",
    },
    {
      title: t("admin.table.category"),
      dataIndex: "category",
      key: "category",
      width: 150,
      render: (cat: string) => <Text strong>{getLocalizedCategory(cat, t)}</Text>,
    },
    {
      title: t("admin.table.area"),
      dataIndex: "area",
      key: "area",
      width: 130,
      render: (area: string | null) =>
        area ? <Text>{area}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: t("admin.table.status"),
      dataIndex: "status",
      key: "status",
      width: 145,
      render: (status: string) => (
        <Tag
          color={STATUS_COLORS[status] ?? "default"}
          style={{ fontWeight: 600, fontSize: 11 }}
        >
          {status.replaceAll("_", " ")}
        </Tag>
      ),
    },
    {
      title: t("admin.table.targetDate"),
      dataIndex: "plannedCompletionDate",
      key: "plannedCompletionDate",
      width: 125,
      render: (date: string | null) =>
        date ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {new Date(date).toLocaleDateString("en-IN")}
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            —
          </Text>
        ),
    },
    {
      title: t("admin.table.officer"),
      key: "officer",
      width: 130,
      render: (_, record) =>
        record.assignments.length > 0 ? (
          <Text>{record.assignments[0].officer.name}</Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t("admin.table.unassigned")}
          </Text>
        ),
    },
    {
      title: t("admin.table.department"),
      key: "dept",
      width: 160,
      render: (_, record) =>
        record.assignments.length > 0 ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.assignments[0].officer.department.name}
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            —
          </Text>
        ),
    },
    {
      title: t("admin.table.action"),
      key: "action",
      width: 80,
      render: (_, record) => (
        <Link href={`/admin/complaint/${record.id}`}>
          <Button
            type="link"
            size="small"
            style={{ color: "#1a3c6e", padding: 0 }}
          >
            {t("admin.table.view")}
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 4,
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
            {t("admin.title")}
          </Title>
        </div>
        <Text type="secondary" style={{ fontSize: 13, marginLeft: 14 }}>
          {t("admin.subtitle")}
        </Text>
      </div>

      {error && (
        <Alert
          type="error"
          title={error}
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{ borderLeft: "4px solid #1a3c6e", borderRadius: 6 }}
          >
            <Statistic
              title={
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#888",
                    letterSpacing: "0.04em",
                  }}
                >
                  {t("admin.stats.total")}
                </Text>
              }
              value={complaints.length}
              styles={{ content: { color: "#1a3c6e", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{ borderLeft: "4px solid #2e7d32", borderRadius: 6 }}
          >
            <Statistic
              title={
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#888",
                    letterSpacing: "0.04em",
                  }}
                >
                  {t("admin.stats.resolved")}
                </Text>
              }
              value={analytics.resolved}
              styles={{ content: { color: "#2e7d32", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{ borderLeft: "4px solid #e07b00", borderRadius: 6 }}
          >
            <Statistic
              title={
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#888",
                    letterSpacing: "0.04em",
                  }}
                >
                  {t("admin.stats.rate")}
                </Text>
              }
              value={analytics.resolutionRate.toFixed(1)}
              suffix="%"
              styles={{ content: { color: "#e07b00", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{ borderLeft: "4px solid #0277bd", borderRadius: 6 }}
          >
            <Statistic
              title={
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#888",
                    letterSpacing: "0.04em",
                  }}
                >
                  {t("admin.stats.departments")}
                </Text>
              }
              value={Object.keys(analytics.byDepartment).length}
              styles={{ content: { color: "#0277bd", fontWeight: 800 } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card
            size="small"
            style={{ borderRadius: 8, borderTop: "3px solid #1a3c6e" }}
            title={<Text strong style={{ color: "#1a3c6e" }}>Create Meeting</Text>}
            extra={
              <Link href="/admin/create-meeting">
                <Button type="primary" size="small" style={{ background: "#1a3c6e", borderColor: "#1a3c6e" }}>
                  Open
                </Button>
              </Link>
            }
          >
            <Text type="secondary">
              Create constituency, department, citizen, and personal meetings with the required fields.
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            size="small"
            style={{ borderRadius: 8, borderTop: "3px solid #e07b00" }}
            title={<Text strong style={{ color: "#1a3c6e" }}>Meeting Section</Text>}
            extra={
              <Link href="/admin/meeting-section">
                <Button size="small" style={{ borderColor: "#1a3c6e", color: "#1a3c6e" }}>
                  Open
                </Button>
              </Link>
            }
          >
            <Text type="secondary">
              View meeting calendar, eight summary boxes, full meeting list, and approve pending citizen meetings.
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card
        size="small"
        style={{ marginBottom: 20, borderRadius: 6 }}
        title={
          <Text strong style={{ color: "#1a3c6e", fontSize: 13 }}>
            {t("admin.filter.title")}
          </Text>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={6}>
            <Select
              placeholder={t("admin.filter.allStatus")}
              allowClear
              style={{ width: "100%" }}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={STATUS_OPTIONS.map((s) => ({
                value: s,
                label: s.replaceAll("_", " "),
              }))}
            />
          </Col>
          <Col xs={24} sm={7}>
            <Select
              placeholder={t("admin.filter.allCategories")}
              allowClear
              style={{ width: "100%" }}
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              options={COMPLAINT_CATEGORIES.map((c) => ({
                value: c,
                label: getLocalizedCategory(c, t),
              }))}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Input
              placeholder={t("admin.filter.area")}
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              prefix={<span style={{ color: "#bbb" }}>🔍</span>}
              allowClear
              onPressEnter={() => void loadData()}
            />
          </Col>
          <Col xs={24} sm={5}>
            <Button
              type="primary"
              block
              onClick={() => void loadData()}
              style={{
                background: "#1a3c6e",
                borderColor: "#1a3c6e",
                fontWeight: 700,
              }}
            >
              {t("admin.filter.apply")}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Complaints Table */}
      <Card
        title={
          <span style={{ color: "#1a3c6e", fontWeight: 700, fontSize: 14 }}>
            {t("admin.queue.title")}
          </span>
        }
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            {complaints.length} {t("admin.queue.records")}
          </Text>
        }
        style={{ borderRadius: 6 }}
      >
        <Table
          columns={columns}
          dataSource={complaints}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1050 }}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `${total} ${t("admin.queue.complaints")}`,
          }}
          onRow={(record) => ({
            style: { cursor: "pointer" },
            onClick: () => router.push(`/admin/complaint/${record.id}`),
          })}
          locale={{
            emptyText: (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <Text type="secondary">{t("admin.queue.empty")}</Text>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
}
