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
  Upload,
  Divider,
  Skeleton,
  Tag,
} from "antd";

import type { UploadFile } from "antd/es/upload";
import { useLanguage } from "@/components/language-provider";
import { getLocalizedCategory } from "@/lib/complaint-i18n";

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
            <Alert type="error" title={loadStatus} showIcon />
          )}
        </Card>
      </div>
    );
  }

  if (!assignment) return null;

  const problemEvidence = assignment.complaint.media[0] ?? null;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t("officer.banner")} &rsaquo;{" "}
          <Text strong style={{ color: "#1a3c6e" }}>
            {assignment.officer.name}
          </Text>
        </Text>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          title={alert.text}
          showIcon
          closable
          onClose={() => setAlert(null)}
          style={{ marginBottom: 20 }}
        />
      )}

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card
            style={{ borderRadius: 6 }}
            title={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ color: "#1a3c6e", fontWeight: 700 }}>
                  {t("officer.assignedComplaint")} #{assignment.complaintId} —{" "}
                  {getLocalizedCategory(assignment.complaint.category, t)}
                </span>
                <Tag color="blue" style={{ fontWeight: 600 }}>
                  {assignment.officer.department.name}
                </Tag>
              </div>
            }
            extra={
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <a
                  href={`https://www.google.com/maps?layer=c&cbll=${assignment.complaint.lat},${assignment.complaint.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button size="small" style={{ borderColor: "#1a3c6e", color: "#1a3c6e" }}>
                    {t("officer.openMap")}
                  </Button>
                </a>
                {problemEvidence && (
                  <a href={problemEvidence.fileUrl} target="_blank" rel="noreferrer">
                    <Button size="small" style={{ borderColor: "#e07b00", color: "#e07b00" }}>
                      {t("officer.viewProblem")}
                    </Button>
                  </a>
                )}
              </div>
            }
          >
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="rounded-md bg-gray-100 p-3 flex-1">
                <h1 className="text-sm font-normal">{t("officer.complaintId")}</h1>
                <p className="text-xs font-semibold text-gray-500">#{assignment.complaintId}</p>
              </div>
              <div className="rounded-md bg-gray-100 p-3 flex-1">
                <h1 className="text-sm font-normal">{t("officer.category")}</h1>
                <p className="text-xs font-semibold text-gray-500">
                  {getLocalizedCategory(assignment.complaint.category, t)}
                </p>
              </div>
            </div>

            <div className="h-4" />

            <div className="flex flex-col gap-4 md:flex-row">
              <div className="rounded-md bg-gray-100 p-3 flex-1">
                <h1 className="text-sm font-normal">{t("officer.department")}</h1>
                <p className="text-xs font-semibold text-gray-500">
                  {assignment.officer.department.name}
                </p>
              </div>
              <div className="rounded-md bg-gray-100 p-3 flex-1">
                <h1 className="text-sm font-normal">{t("officer.coordinates")}</h1>
                <p className="text-xs font-semibold text-gray-500">
                  {assignment.complaint.lat}, {assignment.complaint.lng}
                </p>
                <a
                  href={`https://www.google.com/maps?layer=c&cbll=${assignment.complaint.lat},${assignment.complaint.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-block", marginTop: 8 }}
                >
                  <Button size="small" style={{ borderColor: "#1a3c6e", color: "#1a3c6e", fontSize: 11 }}>
                    {t("officer.openMap")}
                  </Button>
                </a>
              </div>
            </div>

            <div className="h-4" />

            <div className="rounded-md bg-gray-100 p-3 flex-1">
              <h1 className="text-sm font-normal">{t("officer.description")}</h1>
              <p className="text-xs font-semibold text-gray-500 whitespace-pre-wrap break-words">
                {assignment.complaint.description}
              </p>
            </div>

            {assignment.complaint.media.length > 0 && (
              <>
                <Divider plain style={{ fontSize: 13, color: "#888", margin: "16px 0 12px" }}>
                  {t("officer.problemEvidence")}
                </Divider>
                <Row gutter={[8, 8]}>
                  {assignment.complaint.media.map((item) => (
                    <Col key={item.id} xs={24} sm={12}>
                      <a href={item.fileUrl} target="_blank" rel="noreferrer">
                        <Card
                          size="small"
                          hoverable
                          style={{
                            borderRadius: 4,
                            borderLeft: "3px solid #1a3c6e",
                          }}
                          styles={{
                            body: {
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            },
                          }}
                        >
                          <Tag style={{ fontSize: 10 }}>{item.type}</Tag>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {item.fileUrl.split("/").pop()}
                          </Text>
                        </Card>
                      </a>
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            style={{ borderRadius: 6, boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}
            title={
              <Text strong style={{ color: "#1a3c6e" }}>
                {t("officer.submitResponse")}
              </Text>
            }
          >
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
            <Col xs={24}>
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
            <Col xs={24}>
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
        </Col>
      </Row>
    </div>
  );
}

