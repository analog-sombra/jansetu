"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  Form,
  Select,
  Input,
  Button,
  Typography,
  Alert,
  Row,
  Col,
  Descriptions,
  Upload,
  Divider,
  Skeleton,
} from "antd";

import type { UploadFile } from "antd/es/upload";
import { useLanguage } from "@/components/language-provider";

const { Title, Text } = Typography;

type Assignment = {
  id: number;
  complaintId: number;
  complaint: {
    category: string;
    description: string;
    lat: number;
    lng: number;
    media: Array<{ id: number; fileUrl: string; type: string }>;
  };
  officer: {
    name: string;
    department: { name: string };
  };
};

type FormValues = {
  type: string;
  message: string;
};

export default function OfficerTokenPage() {
  const params = useParams<{ token: string }>();
  const { t } = useLanguage();
  const [form] = Form.useForm<FormValues>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [alert, setAlert] = useState<{
    type: "error" | "success" | "info" | "warning";
    text: string;
  } | null>(null);
  const [loadStatus, setLoadStatus] = useState(t("officer.loading"));

  useEffect(() => {
    async function loadAssignment() {
      const response = await fetch(`/api/officer/${params.token}`);
      const result = await response.json();
      if (!response.ok) {
        setLoadStatus(result.error ?? t("officer.error.invalidToken"));
        return;
      }
      setAssignment(result.assignment);
      setLoadStatus("");
    }
    void loadAssignment();
  }, [params.token]);

  async function handleProofUpload(file: File): Promise<boolean> {
    setUploading(true);
    setAlert({ type: "info", text: t("officer.uploading") });
    const data = new FormData();
    data.append("file", file);
    const response = await fetch(`/api/officer/${params.token}/upload`, {
      method: "POST",
      body: data,
    });
    const result = await response.json();
    setUploading(false);
    if (!response.ok) {
      setAlert({ type: "error", text: result.error ?? t("officer.error.upload") });
      return false;
    }
    setProofUrl(result.fileUrl);
    setAlert({ type: "success", text: t("officer.success.upload") });
    return true;
  }

  async function onFinish(values: FormValues) {
    if (uploading) {
      setAlert({ type: "warning", text: t("officer.warning.waitUpload") });
      return;
    }
    setSubmitting(true);
    const response = await fetch("/api/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: params.token,
        type: values.type,
        message: values.message,
        proofUrl,
      }),
    });
    const result = await response.json();
    setSubmitting(false);
    if (response.ok) {
      setAlert({
        type: "success",
        text: t("officer.success.respond"),
      });
      form.resetFields();
      setFileList([]);
      setProofUrl("");
    } else {
      setAlert({ type: "error", text: result.error ?? t("officer.error.respond") });
    }
  }

  if (!assignment && loadStatus) {
    return (
      <div style={{ maxWidth: 520, margin: "80px auto", textAlign: "center" }}>
        <Card style={{ borderRadius: 6 }}>
          {loadStatus === t("officer.loading") ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <Alert type="error" message={loadStatus} showIcon />
          )}
        </Card>
      </div>
    );
  }

  if (!assignment) return null;

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      {/* Officer Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #12294a 0%, #1a3c6e 100%)",
          borderRadius: "6px 6px 0 0",
          padding: "24px 28px",
          marginBottom: 0,
        }}
      >
        <Text
          style={{
            color: "#FF9933",
            fontSize: 10,
            letterSpacing: "0.12em",
            fontWeight: 700,
            display: "block",
            marginBottom: 6,
          }}
        >
          {t("officer.banner")}
        </Text>
        <Title level={4} style={{ color: "#fff", margin: 0 }}>
          {assignment.officer.name}
        </Title>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
          {t("officer.department")}: {assignment.officer.department.name}
        </Text>
      </div>

      {/* Complaint Info */}
      <Card
        style={{ borderRadius: "0 0 0 0", borderTop: 0, marginBottom: 2 }}
        title={
          <Text strong style={{ color: "#1a3c6e" }}>
            {t("officer.assignedComplaint")} #{assignment.complaintId}
          </Text>
        }
      >
        <Descriptions
          column={{ xs: 1, sm: 2 }}
          bordered
          size="small"
          styles={{ label: { fontWeight: 600, background: "#f7f9fc", width: 130 } }}
        >
          <Descriptions.Item label={t("officer.complaintId")}>
            #{assignment.complaintId}
          </Descriptions.Item>
          <Descriptions.Item label={t("officer.category")}>
            {assignment.complaint.category}
          </Descriptions.Item>
          <Descriptions.Item label={t("officer.description")} span={2}>
            <Text style={{ lineHeight: 1.7 }}>{assignment.complaint.description}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={t("officer.coordinates")}>
            {assignment.complaint.lat}, {assignment.complaint.lng}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Response Form */}
      <Card
        style={{ borderRadius: "0 0 6px 6px", boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}
        title={
          <Text strong style={{ color: "#1a3c6e" }}>
            {t("officer.submitResponse")}
          </Text>
        }
      >
        {alert && (
          <Alert
            type={alert.type}
            message={alert.text}
            showIcon
            closable
            onClose={() => setAlert(null)}
            style={{ marginBottom: 20 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark
          initialValues={{ type: "RESOLVED" }}
        >
          <Form.Item
            name="type"
            label={t("officer.responseType")}
            rules={[{ required: true, message: t("officer.validation.responseType") }]}
          >
            <Select
              size="large"
              options={[
                {
                  value: "RESOLVED",
                  label: `✅ ${t("officer.type.resolved")}`,
                },
                {
                  value: "QUERY",
                  label: `❓ ${t("officer.type.query")}`,
                },
                {
                  value: "REJECTED",
                  label: `❌ ${t("officer.type.rejected")}`,
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="message"
            label={t("officer.responseDetails")}
            rules={[
              { required: true, message: t("officer.validation.details") },
              {
                min: 10,
                message: t("officer.validation.detailsMin"),
              },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder={t("officer.responsePlaceholder")}
              showCount
              maxLength={500}
              size="large"
            />
          </Form.Item>

          <Divider plain style={{ fontSize: 13, color: "#888", margin: "4px 0 16px" }}>
            {t("officer.proofOptional")}
          </Divider>

          <Row gutter={16} align="top">
            <Col xs={24} sm={16}>
              <Form.Item label={t("officer.uploadLabel")}>
                <Upload
                  listType="text"
                  fileList={fileList}
                  accept="image/*"
                  maxCount={1}
                  customRequest={async ({ file, onSuccess, onError }) => {
                    const ok = await handleProofUpload(file as File);
                    if (ok) onSuccess?.("ok");
                    else onError?.(new Error("Upload failed"));
                  }}
                  onChange={({ fileList: newList }) => setFileList(newList)}
                >
                  <Button
  
                    disabled={uploading}
                    style={{ borderColor: "#1a3c6e", color: "#1a3c6e" }}
                  >
                    {uploading ? t("officer.uploadingShort") : t("officer.uploadButton")}
                  </Button>
                </Upload>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 6 }}>
                  {t("officer.uploadHint")}
                </Text>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              {proofUrl && (
                <div
                  style={{
                    padding: 12,
                    background: "#f0f7f0",
                    borderRadius: 4,
                    border: "1px solid #c3e6cb",
                    marginTop: 28,
                  }}
                >
                  <Text style={{ fontSize: 12, color: "#2e7d32" }}>✅ {t("officer.proofUploaded")}</Text>
                  <br />
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, color: "#1a3c6e" }}
                  >
                    {t("officer.viewUploaded")}
                  </a>
                </div>
              )}
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              type="primary"
              size="large"
              block
              htmlType="submit"
              loading={submitting || uploading}
              style={{
                background: "#1a3c6e",
                borderColor: "#1a3c6e",
                height: 46,
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {uploading ? t("officer.uploadingButton") : t("officer.submitButton")}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

