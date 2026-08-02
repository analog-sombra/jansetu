"use client";

import { useState } from "react";
import {
  Button,
  Select,
  Space,
  Table,
  Tag,
  Card,
  Row,
  Col,
  Alert,
  Spin,
  Empty,
} from "antd";
import { PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { WorkDTO, getWorksListingAction } from "@/actions/mla/works";
import { WORKSTATUS } from "@prisma/client";

interface WorksListingClientProps {
  initialWorks: WorkDTO[];
  initialTotal: number;
  initialError: string;
}

const statusColors: Record<WORKSTATUS, string> = {
  PROPOSED: "default",
  APPROVED: "processing",
  IN_PROGRESS: "processing",
  COMPLETED: "success",
  ON_HOLD: "warning",
  CANCELLED: "error",
};

const statusLabels: Record<WORKSTATUS, string> = {
  PROPOSED: "Proposed",
  APPROVED: "Approved",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
};

export default function WorksListingClient({
  initialWorks,
  initialTotal,
  initialError,
}: WorksListingClientProps) {
  const router = useRouter();
  const [works, setWorks] = useState<WorkDTO[]>(initialWorks);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [statusFilter, setStatusFilter] = useState<WORKSTATUS | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const handleTableChange = async (pagination: any) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
    setLoading(true);
    setError("");

    try {
      const result = await getWorksListingAction({
        page: pagination.current,
        limit: pagination.pageSize,
        status: statusFilter || undefined,
      });

      if (result.ok) {
        setWorks(result.data.items);
        setTotal(result.data.total);
      } else {
        setError(result.error);
        console.error("Works fetch error:", result.error);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to fetch works";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (workId: number) => {
    router.push(`/mla/works/${workId}`);
  };

  const handleCreateNew = () => {
    router.push("/mla/works/create");
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: "25%",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Department",
      dataIndex: ["department", "name"],
      key: "department",
      width: "15%",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "15%",
      render: (status: WORKSTATUS) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: "10%",
      render: (priority: number) => {
        let color = "green";
        if (priority < 50) color = "green";
        else if (priority < 75) color = "orange";
        else color = "red";
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: "Progress",
      dataIndex: "completion_percentage",
      key: "progress",
      width: "15%",
      render: (percentage: number) => `${percentage}%`,
    },
    {
      title: "Actions",
      key: "actions",
      width: "20%",
      render: (_: any, record: WorkDTO) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Works Management</h1>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateNew}
                size="large"
              >
                Create New Work
              </Button>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            closable
            className="mb-4"
          />
        )}

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: "100%" }}
              allowClear
              options={[
                { label: "All Statuses", value: "" },
                ...Object.entries(statusLabels).map(([key, label]) => ({
                  label,
                  value: key,
                })),
              ]}
            />
          </Col>
        </Row>

        <Spin spinning={loading}>
          {works.length === 0 ? (
            <Empty description="No works found" />
          ) : (
            <Table
              columns={columns}
              dataSource={works}
              rowKey="id"
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
              onChange={handleTableChange}
              loading={loading}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
}
