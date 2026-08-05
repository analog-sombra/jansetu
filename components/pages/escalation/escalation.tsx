"use client";

import Link from "next/link";
import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import { DownloadOutlined, FilePdfOutlined } from "@ant-design/icons";
import {
  AdminEscalationRecord,
  getAdminEscalationQueueAction,
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
  ESCALATION_7D: "magenta",
};

function generateComplaintLetter(row: AdminEscalationRecord): string {
  const daysOpen = Math.floor(row.ageHours / 24);
  const date = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
Shri Manjinder Singh Sirsa
Minister of Food & Supplies, Industry, Forest & Environment, Government of Delhi- NCT

Date: ${date}

NOTICE FOR ESCALATION AND URGENT ACTION REQUIRED

Complaint Reference No.: ${row.complaintId}
Area/Locality: ${row.area}
Category: ${row.category}
Sub-Category: ${row.subcategory || "General"}
Days Open: ${daysOpen} days
Assigned Officer: ${row.officer} (${row.department})

TO THE CONCERNED AUTHORITY,

This is to bring to your urgent notice that the above-mentioned complaint has been pending for ${daysOpen} consecutive days without resolution within the stipulated timeframe. The complaint has been escalated to your authority as no satisfactory action has been taken till date.

CATEGORY OF COMPLAINT: ${row.category}
SUB-CATEGORY: ${row.subcategory || "General"}
AREA/LOCALITY: ${row.area}

OFFICER RESPONSIBLE: ${row.officer}
DEPARTMENT: ${row.department}

It is earnestly requested that immediate and concrete action be initiated to resolve this matter at the earliest. The delay in resolution of this public grievance is not acceptable and reflects poorly on the service delivery standards of our administration.

You are directed to:
1. Prioritize this complaint for immediate resolution
2. Take all necessary steps to address the grievance
3. Ensure completion within the next 7 working days
4. Submit a status report on the resolution taken

This notice is issued under the authority vested in this office to ensure timely resolution of public grievances and maintain accountability in public service delivery.

Failure to act on this notice may result in further escalation and administrative action.

For any clarification, please contact this office immediately.

Yours faithfully,

_________________________
Shri Manjinder Singh Sirsa
Minister of Food & Supplies, Industry, Forest & Environment
Government of Delhi- NCT
`;
}

const EscalationPage = () => {
  const router = useRouter();
  const { t } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);

  const [escalations, setEscalations] = useState<AdminEscalationRecord[]>([]);

  useEffect(() => {
    const init = async () => {
      const result = await getAdminEscalationQueueAction();
      if (result.ok) {
        setEscalations(result.escalations);
      }
      setIsLoading(false);
    };
    init();
  }, []);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [actionAlert, setActionAlert] = useState<{
    type: "error" | "success" | "warning" | "info";
    text: string;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(
    undefined,
  );
  const [triggerFilter, setTriggerFilter] = useState<string | undefined>(
    undefined,
  );
  const [areaFilter, setAreaFilter] = useState("");
  const [appliedFilter, setAppliedFilter] = useState<{
    status?: string;
    category?: string;
    trigger?: string;
    area?: string;
  }>({});
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [selectedEscalation, setSelectedEscalation] =
    useState<AdminEscalationRecord | null>(null);
  const [letterContent, setLetterContent] = useState("");
  const letterRef = useRef<HTMLDivElement>(null);

  const statusOptions = useMemo(
    () => Array.from(new Set(escalations.map((item) => item.status))),
    [escalations],
  );

  const categoryOptions = useMemo(
    () => Array.from(new Set(escalations.map((item) => item.category))),
    [escalations],
  );

  const triggerOptions = useMemo(
    () => Array.from(new Set(escalations.map((item) => item.trigger))),
    [escalations],
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
    return escalations.filter((item: AdminEscalationRecord) => {
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
        !(item.area ?? "")
          .toLowerCase()
          .includes(appliedFilter.area.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [appliedFilter, escalations]);

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

  function openDraftNoticeModal(row: AdminEscalationRecord) {
    const letter = generateComplaintLetter(row);
    setSelectedEscalation(row);
    setLetterContent(letter);
    setNoticeModalVisible(true);
  }

  function downloadLetter() {
    if (!letterContent) return;

    const element = document.createElement("a");
    const file = new Blob([letterContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `complaint_notice_${selectedEscalation?.complaintId}_${new Date().getTime()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  function printLetter() {
    if (!letterRef.current) return;
    const printWindow = window.open("", "", "height=600,width=800");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Complaint Notice - Complaint #${selectedEscalation?.complaintId}</title>
          <style>
            body {
              font-family: 'Times New Roman', Times, serif;
              line-height: 1.6;
              margin: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              font-weight: bold;
            }
            .content {
              white-space: pre-wrap;
              font-size: 12pt;
            }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <p>Shri Manjinder Singh Sirsa</p>
            <p>Minister of Food & Supplies, Industry, Forest & Environment</p>
            <p>Government of Delhi- NCT</p>
          </div>
          <div class="content">${letterContent.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  const escalatedCount = filteredEscalations.filter(
    (row: AdminEscalationRecord) => row.trigger === "ESCALATION_7D",
  ).length;
  const reminderCount = filteredEscalations.filter(
    (row: AdminEscalationRecord) => row.trigger === "REMINDER_48H",
  ).length;
  const oldestHours = filteredEscalations.reduce(
    (acc: number, row: AdminEscalationRecord) => Math.max(acc, row.ageHours),
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

        if (row.trigger === "ESCALATION_7D") {
          return (
            <Space size="small" wrap>
              <Link href={`/admin/complaint/${row.complaintId}`}>
                <Button size="small" className="escalation-view-btn">
                  {t("admin.table.view")}
                </Button>
              </Link>
              <Button
                type="primary"
                size="small"
                icon={<FilePdfOutlined />}
                onClick={() => openDraftNoticeModal(row)}
                style={{
                  background: "#dc2626",
                  borderColor: "#dc2626",
                  fontWeight: 700,
                  boxShadow: "0 2px 0 rgba(0,0,0,0.08)",
                }}
              >
                DRAFT NOTICE
              </Button>
            </Space>
          );
        }

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

  if (isLoading) {
    return (
      <div className="h-screen w-full grid place-items-center">
        <p>Loading...</p>
      </div>
    );
  }

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
            background: "#191970",
            borderColor: "#191970",
            fontWeight: 700,
          }}
        >
          Priority 🔄️
        </Button>
      </div>

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
            <Statistic
              title="Oldest Open Age"
              value={oldestDays}
              suffix="days"
            />
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
            <Button
              type="primary"
              size="small"
              style={{ background: "#1a3c6e" }}
            >
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

      <Modal
        title={
          <span style={{ color: "#dc2626", fontWeight: 700 }}>
            📋 Draft Notice - Complaint #{selectedEscalation?.complaintId}
          </span>
        }
        open={noticeModalVisible}
        onCancel={() => setNoticeModalVisible(false)}
        width={1200}
        style={{ maxHeight: "70vh", overflow: "hidden", padding: 0 }}
        footer={[
          <Button key="close" onClick={() => setNoticeModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadLetter}
            style={{ background: "#16a34a", borderColor: "#16a34a" }}
          >
            Download
          </Button>,
          <Button
            key="print"
            type="primary"
            onClick={printLetter}
            style={{ background: "#1a3c6e", borderColor: "#1a3c6e" }}
          >
            Print
          </Button>,
        ]}
      >
        <Row style={{ height: "100%", overflow: "hidden" }} gutter={16}>
          {/* Left Side - Notice Details */}
          <Col
            xs={24}
            sm={24}
            md={6}
            style={{
              paddingRight: 16,
              paddingLeft: 16,
              paddingTop: 16,
              overflow: "auto",
              maxHeight: "calc(70vh - 100px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#f9fafb",
                padding: 12,
                borderRadius: 4,
                position: "sticky",
                top: 0,
              }}
            >
              <Text
                strong
                style={{ fontSize: 12, display: "block", marginBottom: 12 }}
              >
                📌 Notice Details:
              </Text>
              <div style={{ fontSize: 11, lineHeight: 1.8 }}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Complaint ID:</Text>
                  <br />
                  <Text copyable style={{ fontSize: 12 }}>
                    {selectedEscalation?.complaintId}
                  </Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Area:</Text>
                  <br />
                  <Text>{selectedEscalation?.area}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Category:</Text>
                  <br />
                  <Text>{selectedEscalation?.category}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Sub-Category:</Text>
                  <br />
                  <Text>{selectedEscalation?.subcategory || "General"}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Officer:</Text>
                  <br />
                  <Text>{selectedEscalation?.officer}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Department:</Text>
                  <br />
                  <Text>{selectedEscalation?.department}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Days Open:</Text>
                  <br />
                  <Text>
                    {Math.floor((selectedEscalation?.ageHours ?? 0) / 24)} days
                  </Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Status:</Text>
                  <br />
                  <Tag
                    color={
                      STATUS_COLORS[selectedEscalation?.status ?? "ASSIGNED"]
                    }
                  >
                    {(selectedEscalation?.status ?? "ASSIGNED").replaceAll(
                      "_",
                      " ",
                    )}
                  </Tag>
                </div>
              </div>
              <div
                style={{
                  marginTop: 16,
                  padding: "8px 12px",
                  backgroundColor: "#fef3c7",
                  borderRadius: 4,
                  borderLeft: "4px solid #f59e0b",
                }}
              >
                <Text type="warning" style={{ fontSize: 11 }}>
                  ✓ This is an auto-drafted notice. Edit the letter content on
                  the right as needed.
                </Text>
              </div>
            </div>
          </Col>

          {/* Right Side - Letter Content */}
          <Col
            xs={24}
            sm={24}
            md={18}
            style={{
              paddingRight: 16,
              paddingTop: 16,
              overflow: "hidden",
              maxHeight: "calc(70vh - 100px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div ref={letterRef} style={{ flex: 1, overflow: "hidden" }}>
              <Input.TextArea
                value={letterContent}
                onChange={(e) => setLetterContent(e.target.value)}
                rows={35}
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: 11,
                  lineHeight: 1.6,
                  padding: 16,
                  border: "1px solid #e5e7eb",
                  borderRadius: 4,
                  resize: "none",
                  height: "100%",
                  overflow: "auto",
                }}
                placeholder="Letter content"
              />
            </div>
          </Col>
        </Row>
      </Modal>

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
};

export default EscalationPage;
