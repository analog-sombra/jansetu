"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Space,
  Tooltip,
} from "antd";
import type { TableColumnsType } from "antd";
import { useLanguage } from "@/components/language-provider";
import { getLocalizedCategory } from "@/lib/complaint-i18n";

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "orange",
  IN_PROGRESS: "blue",
  QUERY_RAISED: "volcano",
  RESOLVED: "green",
  REJECTED: "red",
  ESCALATED: "purple",
  AUTO_CLOSED: "default",
};

type Response = {
  id: number;
  type: string;
  message: string;
  createdAt: string;
};

type Assignment = {
  id: number;
  officer: { name: string; department: { name: string } };
  responses: Response[];
};

type Complaint = {
  id: number;
  category: string;
  description: string;
  status: string;
  createdAt: string;
  assignments: Assignment[];
};

export default function CitizenDashboardPage() {
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      const response = await fetch("/api/my-complaints");
      const result = await response.json();
      setLoading(false);
      if (!response.ok) {
        setError(result.error ?? t("dashboard.error.fetch"));
        return;
      }
      setComplaints(result.complaints);
    }
    void loadData();
  }, []);

  async function confirmResolution(complaintId: number, confirmed: boolean) {
    const response = await fetch("/api/confirm-resolution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaintId, confirmed }),
    });
    if (response.ok) {
      setComplaints((current) =>
        current.map((item) =>
          item.id === complaintId
            ? { ...item, status: confirmed ? "RESOLVED" : "ESCALATED" }
            : item
        )
      );
    }
  }

  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter((c) => c.status === "RESOLVED").length;
  const pendingComplaints = complaints.filter((c) =>
    ["PENDING", "IN_PROGRESS"].includes(c.status)
  ).length;

  const columns: TableColumnsType<Complaint> = [
    {
      title: t("dashboard.table.refNo"),
      dataIndex: "id",
      key: "id",
      width: 80,
      render: (id: number) => (
        <Text strong style={{ color: "#1a3c6e" }}>
          #{id}
        </Text>
      ),
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: t("dashboard.table.category"),
      dataIndex: "category",
      key: "category",
      render: (cat: string) => <Text strong>{getLocalizedCategory(cat, t)}</Text>,
      filters: [...new Set(complaints.map((c) => c.category))].map((c) => ({
        text: getLocalizedCategory(c, t),
        value: c,
      })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: t("dashboard.table.description"),
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (desc: string) => (
        <Tooltip title={desc}>
          <Text type="secondary">{desc}</Text>
        </Tooltip>
      ),
    },
    {
      title: t("dashboard.table.status"),
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] ?? "default"} style={{ fontWeight: 600, fontSize: 11 }}>
          {status.replaceAll("_", " ")}
        </Tag>
      ),
      filters: Object.keys(STATUS_COLORS).map((s) => ({
        text: s.replaceAll("_", " "),
        value: s,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: t("dashboard.table.filedOn"),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(date).toLocaleDateString("en-IN")}
        </Text>
      ),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: t("dashboard.table.action"),
      key: "action",
      width: 180,
      render: (_, record) =>
        record.status === "RESOLVED" ? (
          <Space size="small">
            <Button
              size="small"
              type="primary"
              onClick={() => confirmResolution(record.id, true)}
              style={{ background: "#2e7d32", borderColor: "#2e7d32" }}
            >
              {t("dashboard.confirm")}
            </Button>
            <Button size="small" danger onClick={() => confirmResolution(record.id, false)}>
              {t("dashboard.dispute")}
            </Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <div>
      {/* Page Title */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 4, height: 22, background: "#FF9933", borderRadius: 2 }} />
            <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
              {t("dashboard.title")}
            </Title>
          </div>
          <Text type="secondary" style={{ fontSize: 13, marginLeft: 14 }}>
            {t("dashboard.subtitle")}
          </Text>
        </div>
        <Link href="/complaint/new">
          <Button
            type="primary"
            size="large"
            style={{
              background: "#1a3c6e",
              borderColor: "#1a3c6e",
              fontWeight: 700,
              height: 42,
            }}
          >
            {t("dashboard.newComplaintButton")}
          </Button>
        </Link>
      </div>

      {error && (
        <Alert type="error" title={error} showIcon style={{ marginBottom: 20 }} />
      )}

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderLeft: "4px solid #1a3c6e", borderRadius: 6 }}>
            <Statistic
              title={
                <Text style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>
                  {t("dashboard.stats.total")}
                </Text>
              }
              value={totalComplaints}
              styles={{ content: { color: "#1a3c6e", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderLeft: "4px solid #2e7d32", borderRadius: 6 }}>
            <Statistic
              title={
                <Text style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>
                  {t("dashboard.stats.resolved")}
                </Text>
              }
              value={resolvedComplaints}
              styles={{ content: { color: "#2e7d32", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderLeft: "4px solid #e07b00", borderRadius: 6 }}>
            <Statistic
              title={
                <Text style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>
                  {t("dashboard.stats.pending")}
                </Text>
              }
              value={pendingComplaints}
              styles={{ content: { color: "#e07b00", fontWeight: 800 } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Complaints Table */}
      <Card
        title={
          <span style={{ color: "#1a3c6e", fontWeight: 700, fontSize: 14 }}>
            {t("dashboard.registerTitle")}
          </span>
        }
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t("dashboard.lastUpdated")}: {new Date().toLocaleString("en-IN")}
          </Text>
        }
        style={{ borderRadius: 6 }}
      >
        <Table
          columns={columns}
          dataSource={complaints}
          rowKey="id"
          loading={loading}
          size="middle"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} ${t("dashboard.records")}` }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: "8px 0" }}>
                <Text strong style={{ display: "block", marginBottom: 6 }}>
                  {t("dashboard.fullDescription")}
                </Text>
                <Text type="secondary" style={{ lineHeight: 1.6 }}>
                  {record.description}
                </Text>
                {record.assignments.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <Text strong style={{ display: "block", marginBottom: 6 }}>
                      {t("dashboard.assignmentDetails")}
                    </Text>
                    {record.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        style={{
                          padding: "10px 14px",
                          background: "#f7f9fc",
                          borderLeft: "3px solid #1a3c6e",
                          borderRadius: 4,
                          marginBottom: 8,
                        }}
                      >
                        <Text>
                          {t("dashboard.assignedTo")}: {" "}
                          <strong>{assignment.officer.name}</strong> —{" "}
                          {assignment.officer.department.name}
                        </Text>
                        {assignment.responses.map((resp) => (
                          <div key={resp.id} style={{ marginTop: 6 }}>
                            <Tag color="blue" style={{ fontSize: 11 }}>
                              {resp.type}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {" "}
                              {resp.message}
                            </Text>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),
          }}
          locale={{
            emptyText: (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <Text type="secondary">
                  {t("dashboard.empty")}{" "}
                  <Link href="/complaint/new" style={{ color: "#1a3c6e" }}>
                    {t("dashboard.fileFirst")}
                  </Link>
                </Text>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
}

