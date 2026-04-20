"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";

import { useLanguage } from "@/components/language-provider";
import { COMPLAINT_CATEGORIES } from "@/lib/constants";
import { getLocalizedCategory } from "@/lib/complaint-i18n";
import {
  buildPriorityClusters,
  DEMO_COMPLAINTS,
  getClusterKey,
} from "./demo-data";

const { Title, Text } = Typography;

const STATUS_OPTIONS = [
  "PENDING",
  "IN_PROGRESS",
  "QUERY_RAISED",
  "RESOLVED",
  "REJECTED",
  "ESCALATED",
  "AUTO_CLOSED",
] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "orange",
  IN_PROGRESS: "blue",
  QUERY_RAISED: "volcano",
  RESOLVED: "green",
  REJECTED: "red",
  ESCALATED: "purple",
  AUTO_CLOSED: "default",
};

type Complaint = {
  id: number;
  category: string;
  subcategory: string;
  description: string;
  createdAt: string;
  area: string;
  status: string;
  lat: number;
  lng: number;
  assignments: Array<{
    id: number;
    officer: { name: string; department: { name: string } };
  }>;
};

export default function AdminQueueDemoPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(
    undefined,
  );
  const [areaFilter, setAreaFilter] = useState("");
  const [appliedFilter, setAppliedFilter] = useState<{
    status?: string;
    category?: string;
    area?: string;
  }>({});

  function applyFilters() {
    setAppliedFilter({
      status: statusFilter,
      category: categoryFilter,
      area: areaFilter.trim() || undefined,
    });
  }

  const complaints = useMemo(() => {
    return DEMO_COMPLAINTS.filter((complaint) => {
      if (appliedFilter.status && complaint.status !== appliedFilter.status) {
        return false;
      }
      if (
        appliedFilter.category &&
        complaint.category !== appliedFilter.category
      ) {
        return false;
      }
      if (
        appliedFilter.area &&
        !(complaint.area ?? "")
          .toLowerCase()
          .includes(appliedFilter.area.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [appliedFilter]);

  const priorityClusters = useMemo(
    () => buildPriorityClusters(DEMO_COMPLAINTS),
    [],
  );
  const priorityByKey = useMemo(
    () => new Map(priorityClusters.map((cluster) => [cluster.key, cluster])),
    [priorityClusters],
  );

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
      render: (cat: string) => (
        <Text strong>{getLocalizedCategory(cat, t)}</Text>
      ),
    },
    {
      title: "Priority",
      key: "priority",
      width: 140,
      render: (_, record) => {
        const cluster = priorityByKey.get(getClusterKey(record));
        return cluster ? (
          <Tag color="red" style={{ fontWeight: 700 }}>
            Cluster {cluster.complaintIds.length}
          </Tag>
        ) : (
          <Text type="secondary">Normal</Text>
        );
      },
    },
    {
      title: t("admin.table.area"),
      dataIndex: "area",
      key: "area",
      render: (area: string | null) =>
        area ? <Text>{area}</Text> : <Text type="secondary">-</Text>,
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
      title: t("admin.table.officer"),
      key: "officer",
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
      render: (_, record) =>
        record.assignments.length > 0 ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.assignments[0].officer.department.name}
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            -
          </Text>
        ),
    },
    {
      title: t("admin.table.action"),
      key: "action",
      width: 100,
      render: (_, record) => (
        <Link href={`/admin/queue-demo/${record.id}`}>
          <Button type="link" size="small" style={{ padding: 0 }}>
            {t("admin.table.view")}
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
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
              prefix={<span style={{ color: "#bbb" }}>#</span>}
              allowClear
              onPressEnter={applyFilters}
            />
          </Col>
          <Col xs={24} sm={5}>
            <Button
              type="primary"
              block
              onClick={applyFilters}
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
          size="middle"
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `${total} ${t("admin.queue.complaints")}`,
          }}
          locale={{
            emptyText: (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <Text type="secondary">{t("admin.queue.empty")}</Text>
              </div>
            ),
          }}
          onRow={(record) => ({
            style: { cursor: "pointer" },
            onClick: () => {
              router.push(`/admin/queue-demo/${record.id}`);
            },
          })}
        />
      </Card>
    </div>
  );
}
