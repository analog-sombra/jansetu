"use client";

import { useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Row,
  Col,
  DatePicker,
  Alert,
  Spin,
  message,
  Space,
} from "antd";
import { useRouter } from "next/navigation";
import { createWorkAction } from "@/actions/mla/works";
import dayjs from "dayjs";

interface Department {
  id: number;
  name: string;
}

interface Ward {
  id: number;
  name: string;
}

interface CreateWorkFormValues {
  title: string;
  description: string;
  departmentId: number;
  wardId?: number;
  priority?: number;
  estimated_budget?: number;
  start_date?: ReturnType<typeof dayjs>;
  target_completion_date?: ReturnType<typeof dayjs>;
  remarks?: string;
}

interface CreateWorkClientProps {
  departments: Department[];
  wards: Ward[];
}

export default function CreateWorkClient({
  departments,
  wards,
}: CreateWorkClientProps) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (values: CreateWorkFormValues) => {
    setLoading(true);
    setError("");

    try {
      const payload = {
        title: values.title,
        description: values.description,
        departmentId: values.departmentId,
        wardId: values.wardId || undefined,
        priority: values.priority || 50,
        estimated_budget: values.estimated_budget || undefined,
        start_date: values.start_date ? values.start_date.toISOString() : undefined,
        target_completion_date: values.target_completion_date ? values.target_completion_date.toISOString() : undefined,
        remarks: values.remarks || undefined,
      };

      const result = await createWorkAction(payload);

      if (result.ok) {
        message.success("Work created successfully!");
        setTimeout(() => {
          router.push(`/admin/works/${result.data.id}`);
        }, 600);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to create work");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card title="Create New Work" className="max-w-4xl mx-auto">
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            closable
            className="mb-4"
          />
        )}

        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Form.Item
                  name="title"
                  label="Work Title"
                  rules={[
                    { required: true, message: "Please enter work title" },
                    { min: 5, message: "Title must be at least 5 characters" },
                    { max: 200, message: "Title must not exceed 200 characters" },
                  ]}
                >
                  <Input placeholder="Enter work title" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Form.Item
                  name="description"
                  label="Description"
                  rules={[
                    { required: true, message: "Please enter description" },
                    { min: 20, message: "Description must be at least 20 characters" },
                    { max: 5000, message: "Description must not exceed 5000 characters" },
                  ]}
                >
                  <Input.TextArea
                    rows={4}
                    placeholder="Enter detailed description of the work"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="departmentId"
                  label="Department"
                  rules={[{ required: true, message: "Please select a department" }]}
                >
                  <Select
                    placeholder="Select department"
                    options={departments.map((dept) => ({
                      label: dept.name,
                      value: dept.id,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="wardId"
                  label="Ward (Optional)"
                >
                  <Select
                    placeholder="Select ward"
                    allowClear
                    options={wards.map((ward) => ({
                      label: ward.name,
                      value: ward.id,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="priority"
                  label="Priority (1-100)"
                  initialValue={50}
                >
                  <InputNumber
                    min={1}
                    max={100}
                    className="w-full"
                    placeholder="Enter priority level"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="estimated_budget"
                  label="Estimated Budget (₹)"
                >
                  <InputNumber
                    min={0}
                    className="w-full"
                    placeholder="Enter estimated budget"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="start_date"
                  label="Start Date (Optional)"
                >
                  <DatePicker className="w-full" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="target_completion_date"
                  label="Target Completion Date (Optional)"
                >
                  <DatePicker className="w-full" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Form.Item
                  name="remarks"
                  label="Remarks (Optional)"
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Enter any additional remarks"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Space className="w-full justify-end">
                  <Button onClick={() => router.back()}>Cancel</Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Create Work
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}
