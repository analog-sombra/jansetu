"use client";

import { useState } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Typography,
  Upload,
  Alert,
  Row,
  Col,
  Divider,
} from "antd";

import type { UploadFile } from "antd/es/upload";
import { COMPLAINT_CATEGORIES, SUBCATEGORIES } from "@/lib/constants";
import { useLanguage } from "@/components/language-provider";

const { Title, Text } = Typography;

type Uploaded = {
  fileUrl: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
};

type FormValues = {
  category: string;
  subcategory: string;
  description: string;
  area: string;
  lat: string;
  lng: string;
};

export default function NewComplaintPage() {
  const { t } = useLanguage();
  const [form] = Form.useForm<FormValues>();
  const [selectedCategory, setSelectedCategory] = useState<string>(COMPLAINT_CATEGORIES[0]);
  const [media, setMedia] = useState<Uploaded[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "error" | "success"; text: string } | null>(null);

  function handleCategoryChange(value: string) {
    setSelectedCategory(value);
    form.setFieldValue("subcategory", SUBCATEGORIES[value]?.[0] ?? "");
  }

  function pickLocation() {
    if (!navigator.geolocation) {
      setAlert({ type: "error", text: t("newComplaint.error.geoUnsupported") });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setFieldsValue({
          lat: String(position.coords.latitude),
          lng: String(position.coords.longitude),
        });
        setLocating(false);
      },
      () => {
        setAlert({
          type: "error",
          text: t("newComplaint.error.geoDetect"),
        });
        setLocating(false);
      }
    );
  }

  async function handleUpload(file: File): Promise<boolean> {
    const data = new FormData();
    data.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: data });
    const result = await response.json();
    if (!response.ok) {
      setAlert({ type: "error", text: result.error ?? t("newComplaint.error.upload") });
      return false;
    }
    setMedia((current) => [...current, { fileUrl: result.fileUrl, type: result.type }]);
    return true;
  }

  async function onFinish(values: FormValues) {
    setSubmitting(true);
    setAlert(null);
    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, media }),
      });
      const result = await response.json();
      if (!response.ok) {
        setAlert({ type: "error", text: result.error ?? t("newComplaint.error.submit") });
        return;
      }
      setAlert({
        type: "success",
        text: `${t("newComplaint.success.prefix")} #${result.complaint.id} ${t("newComplaint.success.suffix")}`,
      });
      form.resetFields();
      setMedia([]);
      setFileList([]);
      setSelectedCategory(COMPLAINT_CATEGORIES[0]);
    } catch {
      setAlert({ type: "error", text: t("newComplaint.error.network") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Page Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #12294a 0%, #1a3c6e 100%)",
          borderRadius: "6px 6px 0 0",
          padding: "24px 28px",
        }}
      >
        <Title level={4} style={{ color: "#fff", margin: 0, letterSpacing: "0.02em" }}>
          {t("newComplaint.title")}
        </Title>
        <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, display: "block", marginTop: 4 }}>
          {t("newComplaint.subtitle")} <Text style={{ color: "#FF9933" }}>*</Text>
        </Text>
      </div>

      <Card
        style={{
          borderRadius: "0 0 6px 6px",
          borderTop: 0,
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
        }}
      >
        {alert && (
          <Alert
            type={alert.type}
            message={alert.text}
            showIcon
            closable
            style={{ marginBottom: 24 }}
            onClose={() => setAlert(null)}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark
          initialValues={{
            category: COMPLAINT_CATEGORIES[0],
            subcategory: SUBCATEGORIES[COMPLAINT_CATEGORIES[0]]?.[0] ?? "",
          }}
        >
          {/* Category Row */}
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="category"
                label={t("newComplaint.category")}
                rules={[{ required: true, message: t("newComplaint.validation.category") }]}
              >
                <Select
                  size="large"
                  onChange={handleCategoryChange}
                  options={COMPLAINT_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="subcategory"
                label={t("newComplaint.subcategory")}
                rules={[{ required: true, message: t("newComplaint.validation.subcategory") }]}
              >
                <Select
                  size="large"
                  options={(SUBCATEGORIES[selectedCategory] ?? []).map((sub) => ({
                    value: sub,
                    label: sub,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Description */}
          <Form.Item
            name="description"
            label={t("newComplaint.description")}
            rules={[
              { required: true, message: t("newComplaint.validation.description") },
              { min: 20, message: t("newComplaint.validation.descriptionMin") },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder={t("newComplaint.descriptionPlaceholder")}
              size="large"
              showCount
              maxLength={1000}
            />
          </Form.Item>

          {/* Area */}
          <Form.Item name="area" label={t("newComplaint.area")}>
            <Input
              placeholder={t("newComplaint.areaPlaceholder")}
              size="large"
            />
          </Form.Item>

          {/* GPS Coordinates */}
          <Divider plain style={{ fontSize: 13, color: "#888", margin: "4px 0 16px" }}>
            {t("newComplaint.gps")}
          </Divider>
          <Row gutter={16} align="bottom">
            <Col xs={24} sm={9}>
              <Form.Item
                name="lat"
                label={t("newComplaint.latitude")}
                rules={[{ required: true, message: t("newComplaint.validation.latitude") }]}
              >
                <Input placeholder="e.g. 28.6139" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={9}>
              <Form.Item
                name="lng"
                label={t("newComplaint.longitude")}
                rules={[{ required: true, message: t("newComplaint.validation.longitude") }]}
              >
                <Input placeholder="e.g. 77.2090" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item label=" " colon={false}>
                <Button
                  block
                  size="large"
                  icon={<span>📍</span>}
                  loading={locating}
                  onClick={pickLocation}
                  style={{
                    borderColor: "#1a3c6e",
                    color: "#1a3c6e",
                    fontWeight: 600,
                  }}
                >
                  {locating ? t("newComplaint.detecting") : t("newComplaint.autoDetect")}
                </Button>
              </Form.Item>
            </Col>
          </Row>

          {/* File Upload */}
          <Form.Item
            label={
              <span>
                {t("newComplaint.evidence")}{" "}
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                  ({t("newComplaint.evidenceHint")})
                </Text>
              </span>
            }
          >
            <Upload
              listType="text"
              fileList={fileList}
              customRequest={async ({ file, onSuccess, onError }) => {
                const ok = await handleUpload(file as File);
                if (ok) onSuccess?.("ok");
                else onError?.(new Error("Upload failed"));
              }}
              onChange={({ fileList: newList }) => setFileList(newList)}
            >
              <Button style={{ borderColor: "#1a3c6e", color: "#1a3c6e" }}>
                {t("newComplaint.upload")}
              </Button>
            </Upload>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 6 }}>
              {t("newComplaint.uploadFormats")}
            </Text>
          </Form.Item>

          {/* Submit */}
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              type="primary"
              size="large"
              block
              htmlType="submit"
              loading={submitting}
              style={{
                background: "#1a3c6e",
                borderColor: "#1a3c6e",
                height: 46,
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {t("newComplaint.submit")}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

