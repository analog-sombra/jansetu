"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd"
import type { TableColumnsType } from "antd";
import {
  AdminEscalationRecord,
  updateEscalationPrioritiesAction,
} from "@/actions/admin";
import { useLanguage } from "@/components/provider/language_provider";

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
  const router = useRouter();
  const { t } = useLanguage();
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [actionAlert, setActionAlert] = useState<{
    type: "error" | "success" | "warning" | "info";
    text: string;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [triggerFilter, setTriggerFilter] = useState<string | undefined>(undefined);
  const [areaFilter, setAreaFilter] = useState("");
  const [appliedFilter, setAppliedFilter] = useState<{
    status?: string;
    category?: string;
    trigger?: string;
    area?: string;
  }>({});

  const statusOptions = useMemo(
    () => Array.from(new Set(initialEscalations.map((item) => item.status))),
    [initialEscalations],
  );

  const categoryOptions = useMemo(
    () => Array.from(new Set(initialEscalations.map((item) => item.category))),
    [initialEscalations],
  );

  const triggerOptions = useMemo(
    () => Array.from(new Set(initialEscalations.map((item) => item.trigger))),
    [initialEscalations],
  );

  function applyFilters() {
    setAppliedFilter({
      status: statusFilter,
      category: categoryFilter,
      trigger: triggerFilter,
      area: areaFilter.trim() || undefined,
    });
  }

  const filteredEscalations = useMemo(() => {
    return initialEscalations.filter((item) => {
      if (appliedFilter.status && item.status !== appliedFilter.status) {
        return false;
      }
      if (appliedFilter.category && item.category !== appliedFilter.category) {
        return false;
      }
      if (appliedFilter.trigger && item.trigger !== appliedFilter.trigger) {
        return false;
      }
      if (
        appliedFilter.area &&
        !(item.area ?? "").toLowerCase().includes(appliedFilter.area.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [appliedFilter, initialEscalations]);

  async function handleUpdatePriority() {
    setUpdatingPriority(true);
    setActionAlert(null);

    try {
      const result = await updateEscalationPrioritiesAction();

      if (!result.ok) {
        setActionAlert({
          type: "error",
          text: result.error ?? "Unable to update priorities.",
        });
        return;
      }

      setActionAlert({
        type: "success",
        text: `Priority updated for ${result.updatedComplaints} complaints. Skipped ${result.skippedComplaints} already updated today. Total +${result.totalPriorityAdded}.`,
      });
      router.refresh();
    } finally {
      setUpdatingPriority(false);
    }
  }

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

  const escalatedCount = filteredEscalations.filter(
    (row) => row.trigger === "AUTO_ESCALATED_7D",
  ).length;
  const reminderCount = filteredEscalations.filter(
    (row) => row.trigger === "REMINDER_48H",
  ).length;
  const oldestHours = filteredEscalations.reduce(
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
          <Text strong>{row.category}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.subcategory || "General"}
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
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
            {t("admin.escalation.title")}
          </Title>
          {/* <Text type="secondary">{t("admin.escalation.subtitle")}</Text> */}
        </div>

        <Button
          type="primary"
          loading={updatingPriority}
          onClick={handleUpdatePriority}
          style={{
            background: "#7c3aed",
            borderColor: "#7c3aed",
            fontWeight: 700,
          }}
        >
          Update Priority (+5/day)
        </Button>
      </div>

      {initialError && (
        <Alert
          type="error"
          showIcon
          message={initialError}
          style={{ marginBottom: 16 }}
        />
      )}

      {actionAlert && (
        <Alert
          type={actionAlert.type}
          showIcon
          message={actionAlert.text}
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setActionAlert(null)}
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

      <Card style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text style={{ fontSize: 12, color: "#888", fontWeight: 700 }}>
                Status
              </Text>
              <Select
                value={statusFilter || undefined}
                onChange={(val) => setStatusFilter(val)}
                placeholder="Filter by status"
                allowClear
                options={statusOptions.map((status) => ({
                  label: status.replaceAll("_", " "),
                  value: status,
                }))}
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text style={{ fontSize: 12, color: "#888", fontWeight: 700 }}>
                Category
              </Text>
              <Select
                value={categoryFilter || undefined}
                onChange={(val) => setCategoryFilter(val)}
                placeholder="Filter by category"
                allowClear
                options={categoryOptions.map((category) => ({
                  label: category,
                  value: category,
                }))}
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text style={{ fontSize: 12, color: "#888", fontWeight: 700 }}>
                Trigger
              </Text>
              <Select
                value={triggerFilter || undefined}
                onChange={(val) => setTriggerFilter(val)}
                placeholder="Filter by trigger"
                allowClear
                options={triggerOptions.map((trigger) => ({
                  label: trigger.replaceAll("_", " "),
                  value: trigger,
                }))}
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text style={{ fontSize: 12, color: "#888", fontWeight: 700 }}>
                Area/Locality
              </Text>
              <Input
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                placeholder="Search by area"
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24}>
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                type="primary"
                onClick={applyFilters}
                style={{
                  background: "#1a3c6e",
                  borderColor: "#1a3c6e",
                  fontWeight: 700,
                }}
              >
                Apply Filters
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

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
          dataSource={filteredEscalations}
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
