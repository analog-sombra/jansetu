"use client";

import { useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Empty,
  Alert,
  Spin,
  Tag,
  Progress,
  Button,
  Space,
  Divider,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

interface DashboardData {
  summary: {
    total_works: number;
    proposed: number;
    approved: number;
    in_progress: number;
    completed: number;
    on_hold: number;
    cancelled: number;
    delayed: number;
  };
  budget: {
    total_approved: number;
    total_utilized: number;
    utilization_percentage: number;
  };
  department_metrics: Array<{
    department_id: number;
    department_name: string;
    work_count: number;
    completion_rate: number;
    delayed_count: number;
  }>;
  ward_distribution: Array<{
    ward_id: number;
    ward_name: string;
    work_count: number;
  }>;
  priority_works: Array<{
    id: number;
    title: string;
    priority: number;
    status: string;
    target_completion_date: Date | null;
  }>;
  works_due_soon: Array<{
    id: number;
    title: string;
    target_completion_date: Date | null;
    days_remaining: number;
    status: string;
  }>;
  recent_works: any[];
}

interface WorksDashboardClientProps {
  dashboardData: DashboardData | null;
  error: string;
}

const COLORS = ["#1890ff", "#52c41a", "#faad14", "#f5222d", "#eb2f96", "#13c2c2"];

export default function WorksDashboardClient({
  dashboardData,
  error: initialError,
}: WorksDashboardClientProps) {
  const router = useRouter();
  const [error, setError] = useState(initialError);

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <Spin size="large" />
      </div>
    );
  }

  const statusData = [
    { name: "Proposed", value: dashboardData.summary.proposed, fill: "#d9d9d9" },
    { name: "Approved", value: dashboardData.summary.approved, fill: "#1890ff" },
    { name: "In Progress", value: dashboardData.summary.in_progress, fill: "#faad14" },
    { name: "Completed", value: dashboardData.summary.completed, fill: "#52c41a" },
    { name: "On Hold", value: dashboardData.summary.on_hold, fill: "#ff7a45" },
  ];

  const departmentData = dashboardData.department_metrics.map((dept) => ({
    name: dept.department_name,
    works: dept.work_count,
    completion: Math.round(dept.completion_rate),
    delayed: dept.delayed_count,
  }));

  const priorityColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: "50%",
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: "15%",
      render: (priority: number) => (
        <Tag color={priority >= 75 ? "red" : priority >= 50 ? "orange" : "green"}>
          {priority}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "20%",
      render: (status: string) => (
        <Tag color={status === "COMPLETED" ? "success" : "processing"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "15%",
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          onClick={() => router.push(`/mla/works/${record.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  const dueColumnsData = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: "50%",
    },
    {
      title: "Days Remaining",
      dataIndex: "days_remaining",
      key: "days_remaining",
      width: "15%",
      render: (days: number) => (
        <span style={{ color: days < 7 ? "#f5222d" : days < 14 ? "#faad14" : "#52c41a" }}>
          {days} days
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "20%",
      render: (status: string) => (
        <Tag color={status === "COMPLETED" ? "success" : "processing"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "15%",
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          onClick={() => router.push(`/mla/works/${record.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Works Dashboard</h1>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Works"
              value={dashboardData.summary.total_works}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="In Progress"
              value={dashboardData.summary.in_progress}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completed"
              value={dashboardData.summary.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Delayed"
              value={dashboardData.summary.delayed}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Budget & Status Overview */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} md={12}>
          <Card title="Budget Overview">
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Statistic
                  title="Budget Utilization"
                  value={dashboardData.budget.utilization_percentage}
                  suffix="%"
                  prefix={<ArrowUpOutlined />}
                />
                <Progress
                  percent={dashboardData.budget.utilization_percentage}
                  status={
                    dashboardData.budget.utilization_percentage > 100
                      ? "exception"
                      : "active"
                  }
                  className="mt-2"
                />
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col xs={12}>
                <Statistic
                  title="Approved Budget"
                  value={Math.round(dashboardData.budget.total_approved)}
                  prefix="₹"
                  valueStyle={{ fontSize: "16px", color: "#1890ff" }}
                />
              </Col>
              <Col xs={12}>
                <Statistic
                  title="Utilized Budget"
                  value={Math.round(dashboardData.budget.total_utilized)}
                  prefix="₹"
                  valueStyle={{ fontSize: "16px", color: "#52c41a" }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Works Status Distribution">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Department Performance */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24}>
          <Card title="Department Performance">
            {departmentData.length === 0 ? (
              <Empty description="No department data" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="works" fill="#1890ff" name="Total Works" />
                  <Bar dataKey="completion" fill="#52c41a" name="Completion %" />
                  <Bar dataKey="delayed" fill="#f5222d" name="Delayed" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      {/* Priority Works */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24}>
          <Card title="High Priority Works" extra={<span>{dashboardData.priority_works.length} works</span>}>
            {dashboardData.priority_works.length === 0 ? (
              <Empty description="No priority works" />
            ) : (
              <Table
                columns={priorityColumns}
                dataSource={dashboardData.priority_works}
                rowKey="id"
                pagination={{ pageSize: 5 }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Works Due Soon */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Works Due Soon" extra={<span>{dashboardData.works_due_soon.length} works</span>}>
            {dashboardData.works_due_soon.length === 0 ? (
              <Empty description="No works due soon" />
            ) : (
              <Table
                columns={dueColumnsData}
                dataSource={dashboardData.works_due_soon}
                rowKey="id"
                pagination={{ pageSize: 5 }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
