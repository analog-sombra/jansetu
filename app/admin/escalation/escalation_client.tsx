"use client";

import Link from "next/link";
import {
  Alert,
  Button,
  Card,
  Col,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  AdminEscalationRecord,
} from "@/actions/admin";
import { useLanguage } from "@/components/provider/language_provider";

const CATEGORY_KEY_BY_NORMALIZED: Record<string, string> = {
  road: "road",
  roads: "road",
  water: "water",
  electricity: "electricity",
  power: "electricity",
  sanitation: "sanitation",
  health: "health",
  publicsafety: "publicSafety",
  safety: "publicSafety",
  other: "other",
};

const SUBCATEGORY_KEY_BY_NORMALIZED: Record<string, string> = {
  pothole: "pothole",
  roaddamage: "roadDamage",
  missingsignage: "missingSignage",
  streetlightnotworking: "streetlightNotWorking",
  roaddebris: "roadDebris",
  accidentsite: "accidentSite",
  nowatersupply: "noWaterSupply",
  lowpressure: "lowPressure",
  waterleakage: "waterLeakage",
  waterqualityissue: "waterQualityIssue",
  pipelinedamage: "pipelineDamage",
  watercontamination: "waterContamination",
  powercut: "powerCut",
  powerfluctuation: "powerFluctuation",
  brokenpole: "brokenPole",
  damagedwire: "damagedWire",
  illegalconnection: "illegalConnection",
  meterissue: "meterIssue",
  garbagenotcollected: "garbageNotCollected",
  opendefecation: "openDefecation",
  dirtypublicarea: "dirtyPublicArea",
  drainclogged: "drainClogged",
  sweepingnotdone: "sweepingNotDone",
  publictoiletissue: "publicToiletIssue",
  diseaseoutbreak: "diseaseOutbreak",
  lackofvaccination: "lackOfVaccination",
  hospitalissue: "hospitalIssue",
  ambulanceservice: "ambulanceService",
  healthcenterissue: "healthCenterIssue",
  medicalstaffissue: "medicalStaffIssue",
  crimereport: "crimeReport",
  unsafearea: "unsafeArea",
  trafficviolation: "trafficViolation",
  policeresponseissue: "policeResponseIssue",
  securityconcern: "securityConcern",
  firerisk: "fireRisk",
  other: "other",
  generalcomplaint: "generalComplaint",
};

function normalizeLabel(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function getLocalizedCategory(category: string, t: (key: string) => string) {
  const key = CATEGORY_KEY_BY_NORMALIZED[normalizeLabel(category)];
  return key ? t(`category.${key}`) : category;
}

function getLocalizedSubcategory(
  subcategory: string,
  t: (key: string) => string,
) {
  const key = SUBCATEGORY_KEY_BY_NORMALIZED[normalizeLabel(subcategory)];
  return key ? t(`subcategory.${key}`) : subcategory;
}

const { Title, Text } = Typography;

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function makeWhatsAppLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  const normalizedPhone =
    digits.length === 10
      ? `91${digits}`
      : digits.startsWith("91")
        ? digits
        : digits;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

const STATUS_COLORS: Record<AdminEscalationRecord["status"], string> = {
  ASSIGNED: "orange",
  IN_PROGRESS: "blue",
  QUERY: "volcano",
  ESCALATED: "red",
};

const TRIGGER_COLORS: Record<AdminEscalationRecord["trigger"], string> = {
  REMINDER_48H: "gold",
  AUTO_ESCALATED_7D: "magenta",
};

type EscalationClientProps = {
  initialEscalations: AdminEscalationRecord[];
  initialError?: string;
};

export default function EscalationClient({
  initialEscalations,
  initialError,
}: EscalationClientProps) {
  const { t } = useLanguage();

  function sendReminder(row: AdminEscalationRecord) {
    const message = [
      "Jansetu Officer Reminder",
      "",
      `Complaint ID: ${row.complaintId}`,
      `Category: ${row.category}`,
      `Subcategory: ${row.subcategory || "General"}`,
      `Area: ${row.area}`,
      `Status: ${formatLabel(row.status)}`,
      `Escalation Trigger: ${formatLabel(row.trigger)}`,
      `Open Since: ${Math.floor(row.ageHours / 24)} days`,
      "Please update progress at the earliest.",
      `View Complaint: ${window.location.origin}/admin/complaint/${row.complaintId}`,
    ].join("\n");

    const whatsappLink = makeWhatsAppLink(row.officerMobile, message);

    if (!whatsappLink) {
      return;
    }

    window.open(whatsappLink, "_blank", "noopener,noreferrer");
  }

  const escalatedCount = initialEscalations.filter(
    (row) => row.trigger === "AUTO_ESCALATED_7D",
  ).length;
  const reminderCount = initialEscalations.filter(
    (row) => row.trigger === "REMINDER_48H",
  ).length;
  const oldestHours = initialEscalations.reduce(
    (acc, row) => Math.max(acc, row.ageHours),
    0,
  );
  const oldestDays = Math.floor(oldestHours / 24);

  const columns: TableColumnsType<AdminEscalationRecord> = [
    {
      title: "Complaint",
      dataIndex: "complaintId",
      key: "complaintId",
      render: (id: number) => <Text strong>#{id}</Text>,
      sorter: (a, b) => a.complaintId - b.complaintId,
    },
    {
      title: t("admin.table.category"),
      key: "category",
      render: (_, row) => (
        <div>
          <Text strong>{getLocalizedCategory(row.category, t)}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.subcategory
                ? getLocalizedSubcategory(row.subcategory, t)
                : "General"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: t("admin.table.area"),
      dataIndex: "area",
      key: "area",
    },
    {
      title: t("admin.table.officer"),
      key: "officer",
      render: (_, row) => (
        <div>
          <Text>{row.officer}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.department}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Open for (Days)",
      dataIndex: "ageHours",
      key: "ageHours",
      render: (value: number) => `${Math.floor(value / 24)} days`,
      sorter: (a, b) => a.ageHours - b.ageHours,
    },
    {
      title: "Trigger",
      dataIndex: "trigger",
      key: "trigger",
      render: (trigger: AdminEscalationRecord["trigger"]) => (
        <Tag color={TRIGGER_COLORS[trigger]}>
          {trigger.replaceAll("_", " ")}
        </Tag>
      ),
    },
    {
      title: t("admin.table.status"),
      dataIndex: "status",
      key: "status",
      render: (status: AdminEscalationRecord["status"]) => (
        <Tag color={STATUS_COLORS[status]}>{status.replaceAll("_", " ")}</Tag>
      ),
    },
    {
      title: t("admin.table.action"),
      key: "action",
      render: (_, row) => {
        const hasMobile = row.officerMobile.trim().length > 0;

        return (
          <Space size="small" wrap>
            <Link href={`/admin/complaint/${row.complaintId}`}>
              <Button size="small" className="escalation-view-btn">
                {t("admin.table.view")}
              </Button>
            </Link>
            <Tooltip
              title={
                hasMobile
                  ? "Send reminder on WhatsApp"
                  : "Officer mobile number not available"
              }
            >
              <Button
                type="primary"
                size="small"
                onClick={() => sendReminder(row)}
                disabled={!hasMobile}
                style={
                  hasMobile
                    ? {
                        background: "#d97706",
                        borderColor: "#d97706",
                        fontWeight: 700,
                        boxShadow: "0 2px 0 rgba(0,0,0,0.08)",
                      }
                    : undefined
                }
              >
                SEND REMINDER
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
          {t("admin.escalation.title")}
        </Title>
        <Text type="secondary">{t("admin.escalation.subtitle")}</Text>
      </div>

      {initialError && (
        <Alert
          type="error"
          showIcon
          message={initialError}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic title="Escalated Cases" value={escalatedCount} />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic title="48h Reminder Cases" value={reminderCount} />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic title="Oldest Open Age" value={oldestDays} suffix="days" />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span style={{ color: "#1a3c6e", fontWeight: 700 }}>
            Escalation Queue
          </span>
        }
        extra={
          <Link href="/admin/priority-cases">
            <Button type="primary" size="small" style={{ background: "#1a3c6e" }}>
              View Priority Cases
            </Button>
          </Link>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={initialEscalations}
          size="small"
          scroll={{ x: "max-content" }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `${total} records`,
          }}
        />
      </Card>

      <style jsx>{`
        :global(.escalation-view-btn) {
          border-color: #cbd5e1;
          color: #1a3c6e;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        :global(.escalation-view-btn:hover) {
          border-color: #1a3c6e;
          color: #1a3c6e;
          background: #eef5ff;
          transform: translateY(-1px);
        }

        :global(.escalation-view-btn:active) {
          border-color: #15325c;
          color: #15325c;
          background: #dbeafe;
          transform: translateY(0);
        }

        :global(.escalation-view-btn:focus-visible) {
          outline: 2px solid #93c5fd;
          outline-offset: 1px;
        }
      `}</style>
    </div>
  );
}
