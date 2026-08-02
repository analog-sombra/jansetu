"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Button, Card, Col, Input, Row, Select, Table, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { AdminPriorityCaseItem } from "@/actions/admin";
import { useLanguage } from "@/components/provider/language_provider";

const { Title, Text } = Typography;

type PriorityCasesClientProps = {
  initialCases: AdminPriorityCaseItem[];
  initialError?: string;
};

export default function PriorityCasesClient({
  initialCases,
  initialError,
}: PriorityCasesClientProps) {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [areaFilter, setAreaFilter] = useState("");
  const [appliedFilter, setAppliedFilter] = useState<{
    status?: string;
    category?: string;
    area?: string;
  }>({});

  const statusOptions = useMemo(
    () => Array.from(new Set(initialCases.map((item) => item.status))),
    [initialCases],
  );

  const categoryOptions = useMemo(
    () => Array.from(new Set(initialCases.map((item) => item.category))),
    [initialCases],
  );

  function applyFilters() {
    setAppliedFilter({
      status: statusFilter,
      category: categoryFilter,
      area: areaFilter.trim() || undefined,
    });
  }

  const filteredCases = useMemo(() => {
    return initialCases.filter((item) => {
      if (appliedFilter.status && item.status !== appliedFilter.status) {
        return false;
      }
      if (appliedFilter.category && item.category !== appliedFilter.category) {
        return false;
      }
      if (
        appliedFilter.area &&
        !(item.area ?? "").toLowerCase().includes(appliedFilter.area.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [appliedFilter, initialCases]);

  const columns: TableColumnsType<AdminPriorityCaseItem> = [
    {
      title: t("admin.table.refNo"),
      dataIndex: "id",
      key: "id",
      render: (id: number) => <Text strong>#{id}</Text>,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: t("admin.table.category"),
      key: "category",
      render: (_, row) => (
        <div>
          <Text strong>{row.category}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.subcategory || "General"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: t("admin.table.area"),
      dataIndex: "area",
      key: "area",
      sorter: (a, b) => a.area.localeCompare(b.area),
    },
    {
      title: t("admin.table.status"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "ESCALATED" ? "red" : "orange"}>
          {status.replaceAll("_", " ")}
        </Tag>
      ),
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority: number) => (
        <Tag color={priority >= 100 ? "red" : priority >= 60 ? "volcano" : "gold"}>
          {priority}
        </Tag>
      ),
      sorter: (a, b) => a.priority - b.priority,
      defaultSortOrder: "descend",
    },
    {
      title: t("dashboard.table.filedOn"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: string) =>
        new Date(createdAt).toLocaleDateString("en-IN"),
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: t("admin.table.action"),
      key: "action",
      render: (_, row) => (
        <Link href={`/admin/complaint/${row.id}`}>
          <Text style={{ color: "#1a3c6e", fontWeight: 700 }}>
            {t("admin.table.view")}
          </Text>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
          {t("admin.priority.title")}
        </Title>
      </div>

      {initialError && (
        <Alert
          type="error"
          showIcon
          message={initialError}
          style={{ marginBottom: 16 }}
        />
      )}

      <Card style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text style={{ fontSize: 12, color: "#888", fontWeight: 700 }}>
                Status
              </Text>
              <Select
                value={statusFilter || undefined}
                onChange={(val) => setStatusFilter(val)}
                placeholder="Filter by status"
                allowClear
                options={statusOptions.map((status) => ({
                  label: status.replaceAll("_", " "),
                  value: status,
                }))}
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text style={{ fontSize: 12, color: "#888", fontWeight: 700 }}>
                Category
              </Text>
              <Select
                value={categoryFilter || undefined}
                onChange={(val) => setCategoryFilter(val)}
                placeholder="Filter by category"
                allowClear
                options={categoryOptions.map((category) => ({
                  label: category,
                  value: category,
                }))}
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text style={{ fontSize: 12, color: "#888", fontWeight: 700 }}>
                Area/Locality
              </Text>
              <Input
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                placeholder="Search by area"
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: "100%" }}>
              <Button
                type="primary"
                onClick={applyFilters}
                style={{
                  background: "#1a3c6e",
                  borderColor: "#1a3c6e",
                  fontWeight: 700,
                }}
                block
              >
                Apply Filters
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <span style={{ color: "#1a3c6e", fontWeight: 700 }}>
            Top 10 Priority Cases
          </span>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredCases}
          size="small"
          scroll={{ x: "max-content" }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `${total} cases`,
          }}
          locale={{
            emptyText: (
              <div style={{ padding: "20px 0" }}>
                <Text type="secondary">No active priority cases found.</Text>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
}
