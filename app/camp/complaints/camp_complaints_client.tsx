"use client";

import Link from "next/link";
import { Alert, Button, Card, Table, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useLanguage } from "@/components/provider/language_provider";
import { CampComplaintSummary } from "@/actions/camp";

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "orange",
  IN_PROGRESS: "blue",
  WORK_IN_PROGRESS: "cyan",
  QUERY_RAISED: "volcano",
  RESOLVED: "green",
  REJECTED: "red",
  ESCALATED: "purple",
  AUTO_CLOSED: "default",
};

type CampComplaintsClientProps = {
  initialComplaints: CampComplaintSummary[];
  initialError?: string;
};

export default function CampComplaintsClient({
  initialComplaints,
  initialError,
}: CampComplaintsClientProps) {
  const { t } = useLanguage();

  const columns: TableColumnsType<CampComplaintSummary> = [
    {
      title: t("dashboard.table.refNo"),
      dataIndex: "id",
      key: "id",
      width: 90,
      render: (id: number) => <Text strong>#{id}</Text>,
      sorter: (left, right) => left.id - right.id,
    },
    {
      title: t("camp.user.name"),
      dataIndex: "citizenName",
      key: "citizenName",
      width: 170,
    },
    {
      title: t("camp.user.mobile"),
      dataIndex: "citizenMobile",
      key: "citizenMobile",
      width: 130,
    },
    {
      title: t("dashboard.table.category"),
      dataIndex: "category",
      key: "category",
      width: 140,
    },
    {
      title: t("newComplaint.subcategory"),
      dataIndex: "subcategory",
      key: "subcategory",
      width: 160,
      render: (subcategory: string | null) => subcategory || "-",
    },
    {
      title: t("dashboard.table.status"),
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] ?? "default"}>
          {status.replaceAll("_", " ")}
        </Tag>
      ),
    },
    {
      title: t("newComplaint.area"),
      dataIndex: "area",
      key: "area",
      width: 160,
      render: (area: string) => area || "-",
    },
    {
      title: t("dashboard.table.filedOn"),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      render: (date: string) => new Date(date).toLocaleDateString("en-IN"),
      sorter: (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    },
    {
      title: t("dashboard.table.action"),
      key: "action",
      width: 120,
      render: (_, record) => (
        <Link href={`/camp/complaints/${record.id}`}>
          <Button size="small" style={{ borderColor: "#1a3c6e", color: "#1a3c6e" }}>
            View
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
            {t("camp.dashboard.title")}
          </Title>
          <Text type="secondary">{t("camp.dashboard.subtitle")}</Text>
        </div>

        <Link href="/camp/new">
          <Button type="primary" style={{ background: "#1a3c6e", borderColor: "#1a3c6e" }}>
            {t("camp.new.nav")}
          </Button>
        </Link>
      </div>

      {initialError && (
        <Alert type="error" title={initialError} showIcon style={{ marginBottom: 16 }} />
      )}

      <Card>
        <Table
          columns={columns}
          dataSource={initialComplaints}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `${total} ${t("dashboard.records")}`,
          }}
        />
      </Card>
    </div>
  );
}
