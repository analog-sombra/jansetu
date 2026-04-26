"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Form, Input, Button, Typography, Steps, Alert, Divider, Space } from "antd";
import { useLanguage } from "@/components/language-provider";

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [form] = Form.useForm<{ mobile: string; otp: string }>();
  const [otpSent, setOtpSent] = useState(false);
  const [sentOtp, setSentOtp] = useState("");
  const [alert, setAlert] = useState<{ type: "error" | "success" | "info"; text: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    try {
      await form.validateFields(["mobile"]);
    } catch {
      return;
    }
    setLoading(true);
    setAlert(null);
    const response = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: form.getFieldValue("mobile") }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setAlert({ type: "error", text: result.error ?? t("login.error.sendOtp") });
      return;
    }
    setOtpSent(true);
    setSentOtp(result.otp ?? "");
    setAlert({ type: "success", text: t("login.success.otpSent") });
  }

  async function verifyOtp() {
    try {
      await form.validateFields(["otp"]);
    } catch {
      return;
    }
    setLoading(true);
    setAlert(null);
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mobile: form.getFieldValue("mobile"),
        otp: form.getFieldValue("otp"),
      }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setAlert({ type: "error", text: result.error ?? t("login.error.verifyOtp") });
      return;
    }
    if (!result.firstLoginComplete) {
      router.push("/register");
      return;
    }
    if (result.role === "ADMIN") {
      router.push("/admin");
      return;
    }
    if (result.role === "REPORT") {
      router.push("/report/meeting-calendar");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: "76vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 460 }}>
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #12294a 0%, #1a3c6e 100%)",
            borderRadius: "6px 6px 0 0",
            padding: "28px 28px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              border: "2px solid rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              fontSize: 26,
            }}
          >
            ⚖️
          </div>
          <Title level={3} style={{ color: "#fff", margin: 0, letterSpacing: "0.03em" }}>
            {t("login.title")}
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, display: "block", marginTop: 4 }}>
            {t("login.subtitle")}
          </Text>
        </div>

        {/* Form Card */}
        <Card
          style={{
            borderRadius: "0 0 6px 6px",
            borderTop: 0,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          <Steps
            current={otpSent ? 1 : 0}
            size="small"
            style={{ marginBottom: 24 }}
            items={[
              { title: t("login.step.mobile") },
              { title: t("login.step.otp") },
              { title: t("login.step.access") },
            ]}
          />

          {alert && (
            <Alert
              type={alert.type}
              title={alert.text}
              showIcon
              closable
              style={{ marginBottom: 16 }}
              onClose={() => setAlert(null)}
            />
          )}

          {sentOtp && (
            <Alert
              type="info"
              title={
                <span>
                  {t("login.devOtp")}:{" "}
                  <strong
                    style={{
                      fontSize: 20,
                      fontFamily: "monospace",
                      letterSpacing: 6,
                      color: "#1a3c6e",
                    }}
                  >
                    {sentOtp}
                  </strong>
                </span>
              }
              style={{ marginBottom: 16 }}
            />
          )}

          <Form form={form} layout="vertical" requiredMark>
            <Form.Item label={t("login.mobileLabel")}>
              <Space.Compact style={{ width: "100%" }} block>
                <div
                  style={{
                    minWidth: 60,
                    border: "1px solid #d9d9d9",
                    borderRight: 0,
                    borderRadius: "8px 0 0 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#fafafa",
                    padding: "0 12px",
                  }}
                >
                  <Text style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>+91</Text>
                </div>
                <Form.Item
                  name="mobile"
                  noStyle
                  rules={[
                    { required: true, message: t("login.validation.mobileRequired") },
                    { pattern: /^\d{10}$/, message: t("login.validation.mobileInvalid") },
                  ]}
                >
                  <Input
                    placeholder={t("login.mobilePlaceholder")}
                    maxLength={10}
                    size="large"
                    disabled={otpSent}
                  />
                </Form.Item>
              </Space.Compact>
            </Form.Item>

            {otpSent && (
              <Form.Item
                name="otp"
                label={t("login.otpLabel")}
                rules={[
                  { required: true, message: t("login.validation.otpRequired") },
                  { pattern: /^\d{6}$/, message: t("login.validation.otpInvalid") },
                ]}
              >
                <Input
                  placeholder={t("login.otpPlaceholder")}
                  maxLength={6}
                  size="large"
                  style={{ letterSpacing: 8, textAlign: "center", fontSize: 20, fontFamily: "monospace" }}
                />
              </Form.Item>
            )}

            <Form.Item style={{ marginBottom: 8 }}>
              <Button
                type="primary"
                size="large"
                block
                loading={loading}
                onClick={otpSent ? verifyOtp : sendOtp}
                style={{
                  background: "#1a3c6e",
                  borderColor: "#1a3c6e",
                  height: 46,
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: "0.02em",
                }}
              >
                {otpSent ? t("login.verifyButton") : t("login.sendButton")}
              </Button>
            </Form.Item>

            {otpSent && (
              <div style={{ textAlign: "center" }}>
                <Button
                  type="link"
                  size="small"
                  style={{ color: "#1a3c6e" }}
                  onClick={() => {
                    setOtpSent(false);
                    setAlert(null);
                    setSentOtp("");
                    form.resetFields(["otp"]);
                  }}
                >
                  {t("login.changeMobile")}
                </Button>
              </div>
            )}
          </Form>

          {/* <Divider style={{ margin: "16px 0 12px" }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t("login.testingLabel")}:{" "}
            <Text code style={{ fontSize: 12 }}>
              {t("login.testingAdmin")}: 9999999999
            </Text>
          </Text> */}
        </Card>
      </div>
    </div>
  );
}

