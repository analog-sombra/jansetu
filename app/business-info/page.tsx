"use client";

import Link from "next/link";
import { Button, Card, Col, Row, Typography, Space, Divider } from "antd";
import { useLanguage } from "@/components/provider/language_provider";

const { Title, Paragraph, Text } = Typography;

export default function BusinessInfoPage() {
  const { t } = useLanguage();

  const businessPoints = [
    {
      icon: "🎯",
      title: t("business.mission.title"),
      desc: t("business.mission.desc"),
      color: "#1a3c6e",
    },
    {
      icon: "👁️",
      title: t("business.vision.title"),
      desc: t("business.vision.desc"),
      color: "#e07b00",
    },
    {
      icon: "💼",
      title: t("business.values.title"),
      desc: t("business.values.desc"),
      color: "#2e7d32",
    },
  ];

  const benefits = [
    {
      label: t("business.benefit.citizens.title"),
      desc: t("business.benefit.citizens.desc"),
      color: "#2e7d32",
      icon: "👥",
    },
    {
      label: t("business.benefit.admin.title"),
      desc: t("business.benefit.admin.desc"),
      color: "#1a3c6e",
      icon: "⚙️",
    },
    {
      label: t("business.benefit.govt.title"),
      desc: t("business.benefit.govt.desc"),
      color: "#e07b00",
      icon: "🏛️",
    },
  ];

  const features = [
    t("business.feature.digital"),
    t("business.feature.transparent"),
    t("business.feature.accountable"),
    t("business.feature.timeBound"),
    t("business.feature.efficient"),
    t("business.feature.inclusive"),
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
            {t("business.pageTitle")}
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
            {t("business.pageSubtitle")}
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
            {t("business.pageDescription")}
          </Paragraph>
          <Space size="middle" wrap>
            <Link href="/">
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
                {t("business.backHome")}
              </Button>
            </Link>
          </Space>
        </div>
      </div>

      {/* Mission, Vision, Values */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {businessPoints.map((item) => (
          <Col xs={24} md={8} key={item.title}>
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
                      color: "#1a3c6e",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    {item.title}
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

      <Divider />

      {/* Benefits Section */}
      <div style={{ marginBottom: 28 }}>
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
            {t("business.benefitsTitle")}
          </Title>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {benefits.map((item) => (
          <Col xs={24} md={8} key={item.label}>
            <Card
              size="small"
              style={{
                borderTop: `4px solid ${item.color}`,
                borderRadius: 6,
                height: "100%",
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 24 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
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

      <Divider />

      {/* Key Features */}
      <div style={{ marginBottom: 28 }}>
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
            {t("business.coreFeatures")}
          </Title>
        </div>
      </div>

      <Card
        style={{
          borderLeft: `4px solid #1a3c6e`,
          borderRadius: 6,
          marginBottom: 28,
        }}
      >
        <Row gutter={[16, 16]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} key={index}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#FF9933",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </div>
                <Text style={{ fontSize: 14, lineHeight: 1.6 }}>{feature}</Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Divider />

      {/* Contact Details Section */}
      <div style={{ marginBottom: 28 }}>
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
            {t("business.contactDetailsTitle")}
          </Title>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} md={12}>
          <Card
            style={{
              borderTop: `4px solid #1a3c6e`,
              borderRadius: 6,
              height: "100%",
            }}
          >
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>🏢</span>
              <div>
                <Text
                  strong
                  style={{
                    color: "#1a3c6e",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Organization
                </Text>
                <Text style={{ fontSize: 14 }}>Seva me Sirsa</Text>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>📍</span>
              <div>
                <Text
                  strong
                  style={{
                    color: "#1a3c6e",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Address
                </Text>
                <Text style={{ fontSize: 14 }}>
                  H 27, 2 floor, main market, rajouri garden, New Delhi
                </Text>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 24 }}>📮</span>
              <div>
                <Text
                  strong
                  style={{
                    color: "#1a3c6e",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Pincode
                </Text>
                <Text style={{ fontSize: 14 }}>110027</Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            style={{
              borderTop: `4px solid #e07b00`,
              borderRadius: 6,
              height: "100%",
            }}
          >
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>📞</span>
              <div>
                <Text
                  strong
                  style={{
                    color: "#e07b00",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Contact Number
                </Text>
                <Text style={{ fontSize: 14 }}>7666664535</Text>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 24 }}>✉️</span>
              <div>
                <Text
                  strong
                  style={{
                    color: "#e07b00",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Email
                </Text>
                <Text style={{ fontSize: 14 }}>mudassir.chouhan@gmail.com</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* CTA Section */}
      <div
        style={{
          background: "rgba(26, 60, 110, 0.08)",
          borderRadius: 8,
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        <Title level={3} style={{ color: "#1a3c6e", marginBottom: 12 }}>
          {t("business.ctaTitle")}
        </Title>
        <Paragraph
          style={{
            color: "rgba(0,0,0,0.65)",
            maxWidth: 600,
            margin: "0 auto 24px",
          }}
        >
          {t("business.ctaDescription")}
        </Paragraph>
        <Space size="middle" wrap style={{ justifyContent: "center" }}>
          <Link href="/login">
            <Button
              size="large"
              style={{
                background: "#FF9933",
                borderColor: "#FF9933",
                color: "#fff",
                fontWeight: 700,
                paddingInline: 28,
              }}
            >
              {t("business.ctaButton")}
            </Button>
          </Link>
        </Space>
      </div>
    </div>
  );
}
