"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Layout, Button, Typography, Space, Divider, Row, Col } from "antd";
import { useLanguage } from "./language_provider";
import { LanguageToggle } from "../language_toggle";
import { logoutAction } from "@/actions/auth";

const { Header, Content, Footer } = Layout;
const { Text, Title } = Typography;

const CITIZEN_NAV_LINKS = [
  { href: "/user/complaint", labelKey: "nav.myComplaints" },
  { href: "/user/addcomplaint", labelKey: "nav.fileComplaint" },
  { href: "/user/profile", labelKey: "nav.profile" },
];

const CAMP_NAV_LINKS = [
  { href: "/camp/complaints", labelKey: "nav.campComplaints" },
  { href: "/camp/new", labelKey: "nav.campNewComplaint" },
  { href: "/camp/users", labelKey: "nav.campUsers" },
];

const ADMIN_NAV_LINKS = [
  { href: "/admin/dashboard", labelKey: "nav.adminDashboard" },
  { href: "/admin/complaint", labelKey: "nav.adminComplaint" },
  { href: "/admin/department", labelKey: "nav.adminDepartment" },
  { href: "/admin/category", labelKey: "nav.adminCategory" },
  { href: "/admin/queue", labelKey: "nav.adminQueue" },
  { href: "/admin/escalation", labelKey: "nav.adminEscalation" },
  {
    href: "/admin/priority-cases",
    labelKey: "nav.adminPriorityCases",
  },
  { href: "/admin/create-meeting", labelKey: "nav.adminCreateMeeting" },
  { href: "/admin/meeting-section", labelKey: "nav.adminMeetingSection" },
];

const MLA_NAV_LINKS = [
  { href: "/mla/dashboard", labelKey: "nav.adminDashboard" },
  { href: "/mla/complaint", labelKey: "nav.adminComplaint" },
  { href: "/mla/queue", labelKey: "nav.adminQueue" },
  { href: "/mla/escalation", labelKey: "nav.adminEscalation" },
  {
    href: "/mla/priority-cases",
    labelKey: "nav.adminPriorityCases",
  },
  { href: "/mla/create-meeting", labelKey: "nav.adminCreateMeeting" },
  { href: "/mla/meeting-section", labelKey: "nav.adminMeetingSection" },
];

const MLA_PA_NAV_LINKS = [
  { href: "/mla-pa/complaint", labelKey: "nav.mlaPaComplaint" },
  { href: "/mla-pa/cluster-complaints", labelKey: "nav.mlaPaClusters" },
  { href: "/mla-pa/meeting-section", labelKey: "nav.mlaPaMeetingSection" },
  { href: "/mla-pa/create-meeting", labelKey: "nav.mlaPaCreateMeeting" },
];

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    name?: string;
    role?: string;
    email?: string;
  };
}

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/officer") ||
    pathname.startsWith("/adminlogin");
  const isHomePage = pathname === "/";
  const showPrivateNav = !isAuthPage && !isHomePage;

  function getNavLinks() {
    if (pathname.startsWith("/admin")) {
      return ADMIN_NAV_LINKS;
    }

    if (pathname.startsWith("/mla-pa")) {
      return MLA_PA_NAV_LINKS;
    }

    if (pathname.startsWith("/mla")) {
      return MLA_NAV_LINKS;
    }

    if (pathname.startsWith("/camp")) {
      return CAMP_NAV_LINKS;
    }

    return CITIZEN_NAV_LINKS;
  }

  const navLinks = getNavLinks();
  const activeNavHref = [...navLinks]
    .sort((left, right) => right.href.length - left.href.length)
    .find(
      (link) => pathname === link.href || pathname.startsWith(`${link.href}/`),
    )?.href;

  async function logout() {
    try {
      await logoutAction();
    } finally {
      router.replace("/");
      router.refresh();
    }
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
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "10px 16px" }}>
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
                  <Link href="/adminlogin">
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
            <div className="w-6"></div>
            {/* User Info Box - Only show if logged in */}
            {showPrivateNav && user?.name && (
              <Col flex="none" style={{ marginRight: 16 }}>
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    borderRadius: 6,
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {/* <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "#FF9933",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </div> */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <Text
                      style={{
                        color: "#ffffff",
                        fontSize: 12,
                        fontWeight: 600,
                        margin: 0,
                        lineHeight: 1.2,
                      }}
                    >
                      {user.name}
                    </Text>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 10,
                        margin: 0,
                        lineHeight: 1.2,
                        textTransform: "capitalize",
                      }}
                    >
                      {user.role?.toLowerCase().replace(/_/g, " ")}
                    </Text>
                  </div>
                </div>
              </Col>
            )}
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
            style={{
              maxWidth: 1400,
              margin: "0 auto",
              padding: "0 16px",
              display: "flex",
            }}
          >
            {navLinks.map((link) => {
              const isActive = activeNavHref === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{ flexShrink: 0 }}
                >
                  <div
                    style={{
                      padding: "11px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: isActive ? "#FF9933" : "rgba(255,255,255,0.82)",
                      borderBottom: isActive
                        ? "3px solid #FF9933"
                        : "3px solid transparent",
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
            maxWidth: 1400,
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
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
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
              <Link href="/business-info">
                <Text
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  {t("shell.footerAboutBusiness")}
                </Text>
              </Link>
              {[
                "shell.footerPrivacy",
                "shell.footerDisclaimer",
                "shell.footerTerms",
                "shell.footerAccessibility",
              ].map((item) => (
                <Text
                  key={item}
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
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
