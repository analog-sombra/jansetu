"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Layout, Button, Typography, Space, Divider, Row, Col } from "antd";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";

const { Header, Content, Footer } = Layout;
const { Text, Title } = Typography;

const CITIZEN_NAV_LINKS = [
  { href: "/dashboard", labelKey: "nav.myComplaints" },
  { href: "/complaint/new", labelKey: "nav.fileComplaint" },
];

const ADMIN_NAV_LINKS = [
  { href: "/admin", labelKey: "nav.adminDashboard" },
  { href: "/admin/queue-demo", labelKey: "nav.adminQueueDemo" },
  { href: "/admin/escalation-demo", labelKey: "nav.adminEscalationDemo" },
  { href: "/admin/priority-cases-demo", labelKey: "nav.adminPriorityCasesDemo" },
  { href: "/admin/create-meeting", labelKey: "nav.adminCreateMeeting" },
  { href: "/admin/meeting-section", labelKey: "nav.adminMeetingSection" },
];

const REPORT_NAV_LINKS = [
  { href: "/report/meeting-calendar", labelKey: "nav.reportMeetingCalendar" },
  { href: "/report/demo", labelKey: "nav.mlaReport" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/officer");
  const isHomePage = pathname === "/";
  const showPrivateNav = !isAuthPage && !isHomePage;

  function getNavLinks() {
    if (pathname.startsWith("/admin")) {
      return ADMIN_NAV_LINKS;
    }

    if (pathname.startsWith("/report")) {
      return REPORT_NAV_LINKS;
    }

    return CITIZEN_NAV_LINKS;
  }

  const navLinks = getNavLinks();
  const activeNavHref = [...navLinks]
    .sort((left, right) => right.href.length - left.href.length)
    .find((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))?.href;

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      {/* Tricolor Strip */}
      <div
        style={{
          height: 5,
          background:
            "linear-gradient(to right, #FF9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)",
          flexShrink: 0,
        }}
      />

      {/* Main Header */}
      <Header
        style={{
          background: "#1a3c6e",
          padding: "0",
          height: "auto",
          lineHeight: "normal",
          flexShrink: 0,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 16px" }}>
          <Row align="middle" justify="space-between" wrap={false}>
            <Col flex="auto" style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Government Emblem Area */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid rgba(255,255,255,0.25)",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 22, lineHeight: 1 }}>⚖️</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <Link href="/">
                    <Title
                      level={4}
                      style={{
                        color: "#ffffff",
                        margin: 0,
                        letterSpacing: "0.08em",
                        fontWeight: 800,
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {t("shell.brand")}
                    </Title>
                  </Link>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.8)",
                      fontSize: 10,
                      display: "block",
                      letterSpacing: "0.04em",
                      fontWeight: 600,
                      lineHeight: 1.4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t("shell.subtitle")}
                  </Text>
                </div>
              </div>
            </Col>
            <Col flex="none">
              <Space size="small">
                {isHomePage && (
                  <Link href="/login">
                    <Button
                      size="small"
                      style={{
                        borderColor: "rgba(255,255,255,0.45)",
                        color: "#fff",
                        background: "transparent",
                        fontWeight: 600,
                      }}
                    >
                      {t("home.staffCta")}
                    </Button>
                  </Link>
                )}
                <LanguageToggle />
                {showPrivateNav && (
                  <Button
                    size="small"
                    onClick={logout}
                    style={{
                      borderColor: "rgba(255,255,255,0.4)",
                      color: "#fff",
                      background: "transparent",
                      fontWeight: 600,
                    }}
                  >
                    {t("logout")}
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </div>
      </Header>

      {/* Navigation Bar */}
      {showPrivateNav && (
        <div
          style={{
            background: "#1f4d8a",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          <div
            className="nav-scroll"
            style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", display: "flex" }}
          >
            {navLinks.map((link) => {
              const isActive = activeNavHref === link.href;
              return (
                <Link key={link.href} href={link.href} style={{ flexShrink: 0 }}>
                  <div
                    style={{
                      padding: "11px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: isActive ? "#FF9933" : "rgba(255,255,255,0.82)",
                      borderBottom: isActive ? "3px solid #FF9933" : "3px solid transparent",
                      letterSpacing: "0.03em",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t(link.labelKey)}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Content Area */}
      <Content style={{ flexGrow: 1 }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            width: "100%",
            padding: "20px 16px",
          }}
        >
          {children}
        </div>
      </Content>

      {/* Footer */}
      <Footer
        style={{
          background: "#12294a",
          padding: "20px 16px",
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Text
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 12,
              display: "block",
              fontWeight: 600,
            }}
          >
            {t("shell.footerLine")}
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 11,
              display: "block",
              marginTop: 4,
            }}
          >
            {t("shell.footerOwned")}
          </Text>
          <div style={{ marginTop: 10 }}>
            <Space
              wrap
              separator={
                <Divider
                  orientation="vertical"
                  style={{ borderColor: "rgba(255,255,255,0.2)" }}
                />
              }
            >
              {[
                "shell.footerPrivacy",
                "shell.footerDisclaimer",
                "shell.footerTerms",
                "shell.footerAccessibility",
              ].map((item) => (
                <Text
                  key={item}
                  style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: "pointer" }}
                >
                  {t(item)}
                </Text>
              ))}
            </Space>
          </div>
        </div>
      </Footer>
    </Layout>
  );
}
