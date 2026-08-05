"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Col,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { upsertAdminTotalBudgetAction } from "@/actions/admin";

const { Title, Text } = Typography;

interface MlaBudgetClientProps {
  initialBudgets: Array<{
    id: number;
    scope: string;
    purpose: string;
    amount: number;
    createdAt: string;
  }>;
  initialSummary: {
    totalAllotted: number;
    totalApproved: number;
    totalUtilized: number;
  };
  initialError: string;
}

export default function MlaBudgetClient({
  initialBudgets,
  initialSummary,
  initialError,
}: MlaBudgetClientProps) {
  const router = useRouter();
  const [form] = Form.useForm<{ amount: number; purpose: string }>();
  const [budgets, setBudgets] = useState(initialBudgets);
  const [summary, setSummary] = useState(initialSummary);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState(initialError);
  const pendingBudget = summary.totalAllotted - summary.totalApproved;
  const pendingUtilization = summary.totalApproved - summary.totalUtilized;

  const onAddBudget = async (values: { amount: number; purpose: string }) => {
    const value = Number(values.amount);

    if (!Number.isFinite(value) || value < 0) {
      setError("Please enter a valid non-negative budget amount.");
      return;
    }

    setSaving(true);
    setError("");

    const result = await upsertAdminTotalBudgetAction({
      amount: value,
      purpose: values.purpose,
      scope: "GLOBAL",
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setBudgets((prev) => [result.budget, ...prev]);
    setSummary((prev) => ({
      ...prev,
      totalAllotted: prev.totalAllotted + result.budget.amount,
    }));
    form.resetFields();
    setModalOpen(false);
    message.success(result.message);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 90,
      render: (id: number) => `#${id}`,
    },
    {
      title: "Scope",
      dataIndex: "scope",
      key: "scope",
      width: 140,
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
      width: 220,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => `Rs. ${amount.toLocaleString("en-IN")}`,
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <div className="flex items-center justify-between">
            <Title level={3} style={{ margin: 0 }}>
              MLA Budget
            </Title>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalOpen(true)}
              >
                Add Budget
              </Button>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push("/admin/works")}
              >
                Back to Works
              </Button>
            </Space>
          </div>

          {error && (
            <Alert
              type="error"
              message="Error"
              description={error}
              closable
              onClose={() => setError("")}
            />
          )}

          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <Card
                size="small"
                style={{ background: "#effaf3", borderColor: "#b7ebc6" }}
              >
                <Text type="secondary">Total Budget Allotted</Text>
                <Title level={4} style={{ margin: 0 }}>
                  Rs. {summary.totalAllotted.toLocaleString("en-IN")}
                </Title>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                size="small"
                style={{ background: "#eef6ff", borderColor: "#b6d6ff" }}
              >
                <Text type="secondary">Total Approved</Text>
                <Title level={4} style={{ margin: 0 }}>
                  Rs. {summary.totalApproved.toLocaleString("en-IN")}
                </Title>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                size="small"
                style={{ background: "#fff7e6", borderColor: "#ffd591" }}
              >
                <Text type="secondary">Total Utilized</Text>
                <Title level={4} style={{ margin: 0 }}>
                  Rs. {summary.totalUtilized.toLocaleString("en-IN")}
                </Title>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                size="small"
                style={{ background: "#f4f0ff", borderColor: "#d3c4ff" }}
              >
                <Text type="secondary">Pending Budget</Text>
                <Title level={4} style={{ margin: 0 }}>
                  Rs. {pendingBudget.toLocaleString("en-IN")}
                </Title>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                size="small"
                style={{ background: "#fff1f0", borderColor: "#ffccc7" }}
              >
                <Text type="secondary">Pending Utilization</Text>
                <Title level={4} style={{ margin: 0 }}>
                  Rs. {pendingUtilization.toLocaleString("en-IN")}
                </Title>
              </Card>
            </Col>
          </Row>

          <Card size="small" style={{ background: "#f9fafb" }}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={budgets}
              pagination={{ pageSize: 10, showSizeChanger: false }}
            />
          </Card>
        </Space>
      </Card>

      <Modal
        title="Add Budget"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Add"
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" onFinish={onAddBudget}>
          <Form.Item
            label="Budget Amount"
            name="amount"
            rules={[{ required: true, message: "Please enter budget amount" }]}
          >
            <InputNumber<number>
              min={0}
              precision={2}
              style={{ width: "100%" }}
              placeholder="Enter budget amount"
            />
          </Form.Item>
          <Form.Item
            label="Purpose"
            name="purpose"
            rules={[{ required: true, message: "Please enter budget purpose" }]}
          >
            <Input placeholder="e.g. Drainage drive phase 1" maxLength={191} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
