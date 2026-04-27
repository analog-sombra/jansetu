"use client";

import { useMemo } from "react";
import { Card, Col, Row, Table, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";

import { useLanguage } from "@/components/language-provider";
import {
  getLocalizedCategory,
  getLocalizedSubcategory,
} from "@/lib/complaint-i18n";

const { Title, Text } = Typography;

type ComplaintRecord = {
  id: number;
  area: string;
  category: string;
  subcategory: string;
  status: "PENDING" | "IN_PROGRESS" | "QUERY_RAISED" | "ESCALATED" | "RESOLVED";
  createdAt: string;
};

type PriorityGroup = {
  key: string;
  area: string;
  category: string;
  subcategory: string;
  complaintIds: number[];
  pendingCount: number;
  escalatedCount: number;
  newestAt: string;
  priorityScore: number;
};

const DEMO_COMPLAINTS: ComplaintRecord[] = [
  {
    id: 4101,
    area: "Rajouri Garden",
    category: "ROAD",
    subcategory: "POTHOLE",
    status: "PENDING",
    createdAt: "2026-04-14T08:10:00Z",
  },
  {
    id: 4102,
    area: "Rajouri Garden",
    category: "ROAD",
    subcategory: "POTHOLE",
    status: "IN_PROGRESS",
    createdAt: "2026-04-15T09:15:00Z",
  },
  {
    id: 4103,
    area: "Rajouri Garden",
    category: "ROAD",
    subcategory: "POTHOLE",
    status: "ESCALATED",
    createdAt: "2026-04-16T07:20:00Z",
  },
  {
    id: 4104,
    area: "Tagore Garden",
    category: "SANITATION",
    subcategory: "GARBAGE_NOT_COLLECTED",
    status: "PENDING",
    createdAt: "2026-04-13T11:40:00Z",
  },
  {
    id: 4105,
    area: "Tagore Garden",
    category: "SANITATION",
    subcategory: "GARBAGE_NOT_COLLECTED",
    status: "QUERY_RAISED",
    createdAt: "2026-04-15T12:10:00Z",
  },
  {
    id: 4106,
    area: "Raghubir Nagar",
    category: "WATER",
    subcategory: "WATER_LEAKAGE",
    status: "RESOLVED",
    createdAt: "2026-04-10T10:00:00Z",
  },
  {
    id: 4107,
    area: "Raghubir Nagar",
    category: "WATER",
    subcategory: "WATER_LEAKAGE",
    status: "PENDING",
    createdAt: "2026-04-17T09:25:00Z",
  },
  {
    id: 4108,
    area: "Raghubir Nagar",
    category: "WATER",
    subcategory: "WATER_LEAKAGE",
    status: "IN_PROGRESS",
    createdAt: "2026-04-17T15:05:00Z",
  },
  {
    id: 4109,
    area: "Subhash Nagar",
    category: "ELECTRICITY",
    subcategory: "POWER_CUT",
    status: "PENDING",
    createdAt: "2026-04-16T18:15:00Z",
  },
];

function buildPriorityGroups(rows: ComplaintRecord[]) {
  const groups = new Map<string, PriorityGroup>();

  for (const row of rows) {
    const key = `${row.area}__${row.category}__${row.subcategory}`;
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        key,
        area: row.area,
        category: row.category,
        subcategory: row.subcategory,
        complaintIds: [row.id],
        pendingCount:
          row.status === "PENDING" || row.status === "IN_PROGRESS" ? 1 : 0,
        escalatedCount: row.status === "ESCALATED" ? 1 : 0,
        newestAt: row.createdAt,
        priorityScore: 0,
      });
      continue;
    }

    existing.complaintIds.push(row.id);
    if (row.status === "PENDING" || row.status === "IN_PROGRESS") {
      existing.pendingCount += 1;
    }
    if (row.status === "ESCALATED") {
      existing.escalatedCount += 1;
    }
    if (
      new Date(row.createdAt).getTime() > new Date(existing.newestAt).getTime()
    ) {
      existing.newestAt = row.createdAt;
    }
  }

  return [...groups.values()]
    .filter((group) => group.complaintIds.length >= 2)
    .map((group) => ({
      ...group,
      priorityScore:
        group.complaintIds.length * 10 +
        group.pendingCount * 3 +
        group.escalatedCount * 6,
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export default function PriorityCasesDemoPage() {
  const { t } = useLanguage();

  const priorityGroups = useMemo(
    () => buildPriorityGroups(DEMO_COMPLAINTS),
    [],
  );

  const totalPriorityComplaints = priorityGroups.reduce(
    (sum, group) => sum + group.complaintIds.length,
    0,
  );

  const columns: TableColumnsType<PriorityGroup> = [
    {
      title: "Priority Cluster",
      key: "cluster",
      render: (_, row) => (
        <div>
          <Text strong>{row.area}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {getLocalizedCategory(row.category, t)} /{" "}
              {getLocalizedSubcategory(row.subcategory, t)}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Complaint IDs",
      dataIndex: "complaintIds",
      key: "complaintIds",
      render: (ids: number[]) => ids.map((id) => `#${id}`).join(", "),
    },
    {
      title: "Volume",
      key: "volume",
      render: (_, row) => (
        <Tag color="orange" style={{ fontWeight: 700 }}>
          {row.complaintIds.length} complaints
        </Tag>
      ),
      sorter: (a, b) => a.complaintIds.length - b.complaintIds.length,
    },
    {
      title: "Pending",
      dataIndex: "pendingCount",
      key: "pendingCount",
      sorter: (a, b) => a.pendingCount - b.pendingCount,
    },
    {
      title: "Escalated",
      dataIndex: "escalatedCount",
      key: "escalatedCount",
      sorter: (a, b) => a.escalatedCount - b.escalatedCount,
    },
    {
      title: "Priority Score",
      dataIndex: "priorityScore",
      key: "priorityScore",
      render: (score: number) => (
        <Tag
          color={score >= 40 ? "red" : "volcano"}
          style={{ fontWeight: 700 }}
        >
          {score}
        </Tag>
      ),
      sorter: (a, b) => a.priorityScore - b.priorityScore,
      defaultSortOrder: "descend",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
          {t("admin.priority.title")}
        </Title>
        <Text type="secondary">{t("admin.priority.subtitle")}</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Text type="secondary">Priority Clusters</Text>
            <Title level={3} style={{ margin: "6px 0 0", color: "#1a3c6e" }}>
              {priorityGroups.length}
            </Title>
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Text type="secondary">Complaints in Priority</Text>
            <Title level={3} style={{ margin: "6px 0 0", color: "#1a3c6e" }}>
              {totalPriorityComplaints}
            </Title>
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Text type="secondary">Top Priority Score</Text>
            <Title level={3} style={{ margin: "6px 0 0", color: "#e07b00" }}>
              {priorityGroups[0]?.priorityScore ?? 0}
            </Title>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span style={{ color: "#1a3c6e", fontWeight: 700 }}>
            Priority Case Queue
          </span>
        }
      >
        <Table
          rowKey="key"
          columns={columns}
          dataSource={priorityGroups}
          size="small"
          scroll={{ x: "max-content" }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `${total} clusters`,
          }}
          locale={{
            emptyText: (
              <div style={{ padding: "20px 0" }}>
                <Text type="secondary">No priority clusters found in set.</Text>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
}
