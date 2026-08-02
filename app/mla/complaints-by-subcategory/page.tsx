"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Row,
  Skeleton,
  Table,
  Tag,
  Typography,
  Empty,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { getComplaintsBySubcategoryAction, type SubcategoryGroup, type ComplaintDetail } from "@/actions/mla/getComplaintsBySubcategoryAction";
import { useLanguage } from "@/components/provider/language_provider";

const { Title, Text } = Typography;

const COMPLAINT_STATUS_COLOR: Record<string, string> = {
  PENDING: "default",
  IN_PROGRESS: "processing",
  RESOLVED: "success",
  REJECTED: "error",
};

const PAGE_COPY = {
  en: {
    back: "Back",
    title: "Complaints by Subcategory",
    loading: "Loading complaints...",
    error: "Error loading complaints",
    empty: "No complaints found",
    subcategory: "Subcategory",
    totalComplaints: "Total Complaints",
    complaintId: "ID",
    category: "Category",
    subcategoryLabel: "Subcategory",
    status: "Status",
    area: "Area",
    citizens: "Affected Citizens",
    date: "Date",
    citizen: "Citizen",
    mobile: "Mobile",
    assignedOfficer: "Assigned Officer",
    noOfficer: "Not Assigned",
    description: "Description",
  },
};

export default function ComplaintsBySubcategoryPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<SubcategoryGroup[]>([]);

  useEffect(() => {
    async function loadComplaints() {
      setLoading(true);
      const result = await getComplaintsBySubcategoryAction();
      setLoading(false);

      if (!result.ok) {
        setError(result.error || PAGE_COPY.en.error);
        return;
      }

      setSubcategories(result.subcategories || []);
    }

    void loadComplaints();
  }, []);

  const copy = PAGE_COPY.en;

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active />
      </div>
    );
  }

  const tableColumns = [
    {
      title: copy.complaintId,
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a: ComplaintDetail, b: ComplaintDetail) => a.id - b.id,
    },
    {
      title: copy.category,
      dataIndex: "category",
      key: "category",
      width: 120,
    },
    {
      title: copy.status,
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => (
        <Tag color={COMPLAINT_STATUS_COLOR[status] || "default"}>
          {status}
        </Tag>
      ),
    },
    {
      title: copy.area,
      dataIndex: "area",
      key: "area",
      width: 120,
      render: (area: string | null) => area || "N/A",
    },
    {
      title: copy.citizens,
      dataIndex: "affectedCitizensCount",
      key: "affectedCitizensCount",
      width: 100,
      sorter: (a: ComplaintDetail, b: ComplaintDetail) =>
        a.affectedCitizensCount - b.affectedCitizensCount,
    },
    {
      title: copy.citizen,
      dataIndex: "citizenName",
      key: "citizenName",
      width: 140,
    },
    {
      title: copy.mobile,
      dataIndex: "citizenMobile",
      key: "citizenMobile",
      width: 120,
    },
    {
      title: copy.assignedOfficer,
      dataIndex: "assignedOfficers",
      key: "assignedOfficers",
      width: 140,
      render: (officers: string[]) =>
        officers.length > 0 ? officers.join(", ") : copy.noOfficer,
    },
    {
      title: copy.date,
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date: Date) => new Date(date).toLocaleDateString(),
      sorter: (a: ComplaintDetail, b: ComplaintDetail) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

  const expandedColumns = [
    ...tableColumns,
    {
      title: copy.description,
      dataIndex: "description",
      key: "description",
      render: (text: string) => (
        <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 300 }}>
          {text}
        </Text>
      ),
    },
  ];

  const collapseItems = subcategories.map((group) => ({
    key: group.subcategoryName || "uncategorized",
    label: (
      <div>
        <Text strong>{group.subcategoryName || "Uncategorized"}</Text>
        <Tag color="blue" style={{ marginLeft: 12 }}>
          {group.count} {group.count === 1 ? "complaint" : "complaints"}
        </Tag>
      </div>
    ),
    children: (
      <Table
        columns={expandedColumns}
        dataSource={group.complaints}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        size="small"
        scroll={{ x: 1200 }}
      />
    ),
  }));

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 0]} align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
          >
            {copy.back}
          </Button>
        </Col>
        <Col>
          <Title level={2} style={{ color: "#1a3c6e", margin: 0 }}>
            {copy.title}
          </Title>
        </Col>
      </Row>

      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginBottom: 20 }}
        />
      )}

      {subcategories.length === 0 ? (
        <Empty description={copy.empty} style={{ marginTop: 48 }} />
      ) : (
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              Total Subcategories: {subcategories.length} | Total Complaints:{" "}
              {subcategories.reduce((sum, group) => sum + group.count, 0)}
            </Text>
          </div>
          <Collapse items={collapseItems} defaultActiveKey={[subcategories[0]?.subcategoryName || "uncategorized"]} />
        </Card>
      )}
    </div>
  );
}
