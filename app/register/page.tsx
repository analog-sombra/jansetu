"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Form, Input, Button, Typography, Alert, Row, Col } from "antd";
import { useLanguage } from "@/components/language-provider";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [form] = Form.useForm<{
    name: string;
    address: string;
    aadhaar?: string;
    voterId: string;
  }>();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function onFinish(values: {
    name: string;
    address: string;
    aadhaar?: string;
    voterId: string;
  }) {
    setLoading(true);
    setAlert(null);
    const response = await fetch("/api/auth/complete-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setAlert({ type: "error", text: result.error ?? t("register.error.completeProfile") });
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      {/* Page Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #12294a 0%, #1a3c6e 100%)",
          borderRadius: "6px 6px 0 0",
          padding: "24px 28px",
        }}
      >
        <Title level={4} style={{ color: "#fff", margin: 0, letterSpacing: "0.02em" }}>
          {t("register.title")}
        </Title>
        <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, display: "block", marginTop: 4 }}>
          {t("register.subtitle")}
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
            title={alert.text}
            showIcon
            closable
            style={{ marginBottom: 20 }}
            onClose={() => setAlert(null)}
          />
        )}

        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark>
          <Form.Item
            name="name"
            label={t("register.nameLabel")}
            rules={[
              { required: true, message: t("register.validation.nameRequired") },
              { min: 3, message: t("register.validation.nameMin") },
            ]}
          >
            <Input placeholder={t("register.namePlaceholder")} size="large" />
          </Form.Item>

          <Form.Item
            name="address"
            label={t("register.addressLabel")}
            rules={[
              { required: true, message: t("register.validation.addressRequired") },
              { min: 10, message: t("register.validation.addressMin") },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder={t("register.addressPlaceholder")}
              size="large"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="aadhaar"
                label={t("register.aadhaarLabel")}
                rules={[
                  {
                    pattern: /^\d{12}$/,
                    message: t("register.validation.aadhaarInvalid"),
                  },
                ]}
              >
                <Input placeholder={t("register.aadhaarPlaceholder")} maxLength={12} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="voterId"
                label={t("register.voterIdLabel")}
                rules={[{ required: true, message: t("register.validation.voterIdRequired") }]}
              >
                <Input placeholder={t("register.voterIdPlaceholder")} size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              type="primary"
              size="large"
              block
              htmlType="submit"
              loading={loading}
              style={{
                background: "#1a3c6e",
                borderColor: "#1a3c6e",
                height: 46,
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {t("register.submitButton")}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

