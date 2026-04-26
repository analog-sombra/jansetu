"use client";

import Link from "next/link";
import { Button, Card, Col, Row, Typography, Space } from "antd";
import { useLanguage } from "@/components/language-provider";

const { Title, Paragraph, Text } = Typography;

export default function HomePage() {
  const { t } = useLanguage();

  const services = [
    {
      icon: "🛤️",
      title: t("home.service.road.title"),
      desc: t("home.service.road.desc"),
    },
    {
      icon: "💧",
      title: t("home.service.water.title"),
      desc: t("home.service.water.desc"),
    },
    {
      icon: "⚡",
      title: t("home.service.power.title"),
      desc: t("home.service.power.desc"),
    },
    {
      icon: "🗑️",
      title: t("home.service.sanitation.title"),
      desc: t("home.service.sanitation.desc"),
    },
    {
      icon: "🏥",
      title: t("home.service.health.title"),
      desc: t("home.service.health.desc"),
    },
    {
      icon: "🛡️",
      title: t("home.service.safety.title"),
      desc: t("home.service.safety.desc"),
    },
  ];

  const features = [
    {
      label: t("home.feature.portal.title"),
      desc: t("home.feature.portal.desc"),
      color: "#1a3c6e",
      icon: "🌐",
    },
    {
      label: t("home.feature.secure.title"),
      desc: t("home.feature.secure.desc"),
      color: "#e07b00",
      icon: "🔐",
    },
    {
      label: t("home.feature.tracking.title"),
      desc: t("home.feature.tracking.desc"),
      color: "#2e7d32",
      icon: "📊",
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #12294a 0%, #1a3c6e 60%, #1f4d8a 100%)",
          borderRadius: 8,
          padding: "40px 36px",
          marginBottom: 28,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Tricolor side accent */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 8,
            background:
              "linear-gradient(to bottom, #FF9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)",
          }}
        />
        <div style={{ maxWidth: 680 }}>
          <Title
            level={1}
            style={{
              color: "#ffffff",
              marginBottom: 6,
              fontWeight: 900,
              letterSpacing: "0.05em",
              lineHeight: 1.1,
            }}
          >
            {t("home.title")}
          </Title>
          <Title
            level={4}
            style={{
              color: "rgba(255,255,255,0.82)",
              marginTop: 0,
              fontWeight: 400,
              marginBottom: 14,
              letterSpacing: "0.02em",
            }}
          >
            {t("home.subtitle")}
          </Title>

          <Paragraph
            style={{
              color: "rgba(255,255,255,0.78)",
              maxWidth: 560,
              marginBottom: 28,
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            {t("home.description")}
          </Paragraph>
          <Space size="middle" wrap>
            <Link href="/login">
              <Button
                size="large"
                style={{
                  background: "#FF9933",
                  borderColor: "#FF9933",
                  color: "#fff",
                  fontWeight: 700,
                  height: 46,
                  paddingInline: 28,
                  fontSize: 15,
                }}
              >
                {t("home.loginCta")}
              </Button>
            </Link>
          </Space>
        </div>
      </div>

      {/* Key Features */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {features.map((item) => (
          <Col xs={24} md={8} key={item.label}>
            <Card
              size="small"
              style={{
                borderLeft: `4px solid ${item.color}`,
                borderRadius: 6,
                height: "100%",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <div>
                  <Text
                    strong
                    style={{
                      color: item.color,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    {item.label}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {item.desc}
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Services Section */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 4,
              height: 24,
              background: "#FF9933",
              borderRadius: 2,
            }}
          />
          <Title
            level={4}
            style={{ margin: 0, color: "#1a3c6e", letterSpacing: "0.02em" }}
          >
            {t("home.grievanceCategories")}
          </Title>
        </div>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
        {services.map((service) => (
          <Col xs={24} sm={12} lg={8} key={service.title}>
            <Link href="/login" style={{ display: "block", height: "100%" }}>
              <Card
                hoverable
                size="small"
                style={{ borderRadius: 6, height: "100%" }}
                styles={{
                  body: { display: "flex", gap: 14, alignItems: "flex-start" },
                }}
              >
                <span style={{ fontSize: 26, flexShrink: 0 }}>
                  {service.icon}
                </span>
                <div>
                  <Text
                    strong
                    style={{ display: "block", marginBottom: 4, fontSize: 14 }}
                  >
                    {service.title}
                  </Text>
                  <Text
                    type="secondary"
                    style={{ fontSize: 12, lineHeight: 1.5 }}
                  >
                    {service.desc}
                  </Text>
                </div>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      {/* Officer Info */}
      {/* <Card
        size="small"
        style={{
          background: "#f7f9fc",
          borderLeft: "4px solid #1a3c6e",
          borderRadius: 6,
        }}
      >
        <Row align="middle" gutter={12} wrap={false}>
          <Col flex="none">
            <span style={{ fontSize: 20 }}>🔗</span>
          </Col>
          <Col flex="auto">
            <Text strong>{t("home.officerAccessLabel")}: </Text>
            <Text type="secondary">
              {t("home.officerAccessDesc")}{" "}
            </Text>
            <Text code style={{ fontSize: 12 }}>
              /officer/&lt;secure-token&gt;
            </Text>
          </Col>
        </Row>
      </Card> */}
    </div>
  );
}
