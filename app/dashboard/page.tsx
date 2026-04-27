"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Space,
  Tooltip,
  Modal,
  message,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  CopyOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import { useLanguage } from "@/components/language-provider";
import { getLocalizedCategory } from "@/lib/complaint-i18n";

const { Title, Text } = Typography;

type UserProfile = {
  name: string | null;
  mobile: string;
  address: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "orange",
  IN_PROGRESS: "blue",
  WORK_IN_PROGESS: "cyan",
  QUERY_RAISED: "volcano",
  RESOLVED: "green",
  REJECTED: "red",
  ESCALATED: "purple",
  AUTO_CLOSED: "default",
};

type Response = {
  id: number;
  type: string;
  message: string;
  createdAt: string;
};

type Assignment = {
  id: number;
  officer: { name: string; department: { name: string } };
  responses: Response[];
};

type Complaint = {
  id: number;
  category: string;
  description: string;
  status: string;
  plannedCompletionDate: string | null;
  createdAt: string;
  assignments: Assignment[];
  area: string;
};

export default function CitizenDashboardPage() {
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharingComplaint, setSharingComplaint] = useState<Complaint | null>(
    null,
  );

  /* ── certificate helpers ─────────────────────────────────────────── */
  async function generateCertificateCanvas(
    complaint: Complaint,
  ): Promise<HTMLCanvasElement> {
    const W = 1408;
    const H = 768;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    const template = await new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(img);
      img.src = "/image/cert.jpg";
    });

    if (template.naturalWidth > 0 && template.naturalHeight > 0) {
      ctx.drawImage(template, 0, 0, W, H);
    } else {
      ctx.fillStyle = "#f5f1e8";
      ctx.fillRect(0, 0, W, H);
    }

    const receiverName = profile?.name?.trim() || "Citizen";
    const location = complaint?.area?.trim() || "Constituency Area";
    const issueType = complaint.category.replaceAll("_", " ").toLowerCase();
    const issueDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const certificateId = `JS-${complaint.id}-${new Date().getFullYear()}`;

    const centerX = W / 2;
    const wrapText = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      lineHeight: number,
    ) => {
      const words = text.split(" ");
      let line = "";
      let currentY = y;

      words.forEach((word) => {
        const testLine = line ? `${line} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && line) {
          ctx.fillText(line, x, currentY);
          line = word;
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      });

      if (line) {
        ctx.fillText(line, x, currentY);
      }

      return currentY;
    };

    ctx.textAlign = "center";
    ctx.fillStyle = "#333";

    // Line 1 — intro
    ctx.font = "400 19px Georgia, serif";
    ctx.fillText("This is to certify that", centerX, 302);

    // Line 2 — prominent name
    ctx.font = "bold 52px Georgia, serif";
    ctx.fillStyle = "#1a3c6e";
    ctx.fillText(receiverName, centerX, 366);

    // Line 3 onwards — rest of the body
    ctx.font = "400 19px Georgia, serif";
    ctx.fillStyle = "#333";
    const restText =
      `has acted as a responsible citizen by bringing attention to and successfully getting a ${issueType} issue resolved` +
      ` in ${location} through the Jan Setu grievance portal.` +
      ` We sincerely appreciate the awareness and civic responsibility demonstrated towards community development.`;
    wrapText(restText, centerX, 412, 960, 26);

    ctx.font = "700 20px Arial, sans-serif";
    ctx.fillStyle = "#111";
    ctx.fillText(`Date of Issue: ${issueDate}`, centerX, 502);

    ctx.font = "700 20px Arial, sans-serif";
    ctx.fillText(`Certificate ID: ${certificateId}`, centerX, 530);

    ctx.textAlign = "left";
    ctx.fillStyle = "#111";
    // ctx.font = "700 20px Arial, sans-serif";
    // ctx.fillText("Presented By:", 390, 575);
    ctx.font = "700 30px Georgia, serif";
    ctx.fillText("Manjider Singh Sirsa", 390, 605);
    ctx.font = "500 18px Arial, sans-serif";
    ctx.fillText(
      "Minister of Food & Supplies, Industry, Forest & Environment",
      390,
      632,
    );
    ctx.fillText("MLA of Rajouri Garden", 390, 660);

    return canvas;
  }

  async function downloadCertificate(complaint: Complaint) {
    try {
      const canvas = await generateCertificateCanvas(complaint);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `JanSetu-Certificate-${complaint.id}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch {
      void message.error("Could not generate certificate. Please try again.");
    }
  }

  function openShareModal(complaint: Complaint) {
    setSharingComplaint(complaint);
    setShareModalOpen(true);
  }

  function buildShareText(complaint: Complaint) {
    return `My grievance #${complaint.id} (${complaint.category.replaceAll("_", " ")}) filed on Jan Setu has been successfully RESOLVED! 🎉\n#JanSetu #GrievanceRedressal #YourVoiceOurCommitment`;
  }
  /* ───────────────────────────────────────────────────────────────── */

  useEffect(() => {
    async function loadData() {
      const response = await fetch("/api/my-complaints");
      const result = await response.json();
      setLoading(false);
      if (!response.ok) {
        setError(result.error ?? t("dashboard.error.fetch"));
        return;
      }
      setComplaints(result.complaints);
    }
    void loadData();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const result = await response.json();
        setProfile((result as { user: UserProfile }).user ?? null);
      }
    }
    void loadProfile();
  }, []);

  async function confirmResolution(complaintId: number, confirmed: boolean) {
    const response = await fetch("/api/confirm-resolution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaintId, confirmed }),
    });
    if (response.ok) {
      setComplaints((current) =>
        current.map((item) =>
          item.id === complaintId
            ? { ...item, status: confirmed ? "RESOLVED" : "ESCALATED" }
            : item,
        ),
      );
    }
  }

  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter(
    (c) => c.status === "RESOLVED",
  ).length;
  const pendingComplaints = complaints.filter((c) =>
    ["PENDING", "IN_PROGRESS", "WORK_IN_PROGESS"].includes(c.status),
  ).length;

  const columns: TableColumnsType<Complaint> = [
    {
      title: t("dashboard.table.refNo"),
      dataIndex: "id",
      key: "id",
      width: 80,
      render: (id: number) => (
        <Text strong style={{ color: "#1a3c6e" }}>
          #{id}
        </Text>
      ),
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: t("dashboard.table.category"),
      dataIndex: "category",
      key: "category",
      width: 150,
      render: (cat: string) => (
        <Text strong>{getLocalizedCategory(cat, t)}</Text>
      ),
      filters: [...new Set(complaints.map((c) => c.category))].map((c) => ({
        text: getLocalizedCategory(c, t),
        value: c,
      })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: t("dashboard.table.description"),
      dataIndex: "description",
      key: "description",
      width: 220,
      ellipsis: true,
      render: (desc: string) => (
        <Tooltip title={desc}>
          <Text type="secondary">{desc}</Text>
        </Tooltip>
      ),
    },
    {
      title: t("dashboard.table.status"),
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => (
        <Tag
          color={STATUS_COLORS[status] ?? "default"}
          style={{ fontWeight: 600, fontSize: 11 }}
        >
          {status.replaceAll("_", " ")}
        </Tag>
      ),
      filters: Object.keys(STATUS_COLORS).map((s) => ({
        text: s.replaceAll("_", " "),
        value: s,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: t("dashboard.table.targetDate"),
      dataIndex: "plannedCompletionDate",
      key: "plannedCompletionDate",
      width: 130,
      render: (date: string | null) =>
        date ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {new Date(date).toLocaleDateString("en-IN")}
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            —
          </Text>
        ),
    },
    {
      title: t("dashboard.table.filedOn"),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(date).toLocaleDateString("en-IN")}
        </Text>
      ),
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: t("dashboard.table.action"),
      key: "action",
      width: 180,
      render: (_, record) =>
        record.status === "RESOLVED" ? (
          <Space size="small">
            <Button
              size="small"
              type="primary"
              onClick={() => confirmResolution(record.id, true)}
              style={{ background: "#2e7d32", borderColor: "#2e7d32" }}
            >
              {t("dashboard.confirm")}
            </Button>
            <Button
              size="small"
              danger
              onClick={() => confirmResolution(record.id, false)}
            >
              {t("dashboard.dispute")}
            </Button>
          </Space>
        ) : null,
    },
    {
      title: "",
      key: "certificate",
      width: 90,
      render: (_, record) =>
        record.status === "RESOLVED" ? (
          <Space size="small">
            <Tooltip title="Download Certificate">
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => void downloadCertificate(record)}
                style={{ color: "#1a3c6e", borderColor: "#1a3c6e" }}
              />
            </Tooltip>
            <Tooltip title="Share">
              <Button
                size="small"
                icon={<ShareAltOutlined />}
                onClick={() => openShareModal(record)}
              />
            </Tooltip>
          </Space>
        ) : null,
    },
  ];

  return (
    <div>
      {/* Page Title */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 4,
                height: 22,
                background: "#FF9933",
                borderRadius: 2,
              }}
            />
            <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
              {t("dashboard.title")}
            </Title>
          </div>
          <Text type="secondary" style={{ fontSize: 13, marginLeft: 14 }}>
            {t("dashboard.subtitle")}
          </Text>
        </div>
        <Link href="/complaint/new" style={{ flexShrink: 0 }}>
          <Button
            type="primary"
            size="large"
            style={{
              background: "#1a3c6e",
              borderColor: "#1a3c6e",
              fontWeight: 700,
              height: 42,
            }}
          >
            {t("dashboard.newComplaintButton")}
          </Button>
        </Link>
      </div>

      {error && (
        <Alert
          type="error"
          title={error}
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card
            size="small"
            style={{ borderLeft: "4px solid #1a3c6e", borderRadius: 6 }}
          >
            <Statistic
              title={
                <Text style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>
                  {t("dashboard.stats.total")}
                </Text>
              }
              value={totalComplaints}
              styles={{ content: { color: "#1a3c6e", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            size="small"
            style={{ borderLeft: "4px solid #2e7d32", borderRadius: 6 }}
          >
            <Statistic
              title={
                <Text style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>
                  {t("dashboard.stats.resolved")}
                </Text>
              }
              value={resolvedComplaints}
              styles={{ content: { color: "#2e7d32", fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            size="small"
            style={{ borderLeft: "4px solid #e07b00", borderRadius: 6 }}
          >
            <Statistic
              title={
                <Text style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>
                  {t("dashboard.stats.pending")}
                </Text>
              }
              value={pendingComplaints}
              styles={{ content: { color: "#e07b00", fontWeight: 800 } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Complaints Table */}
      <Card
        title={
          <span style={{ color: "#1a3c6e", fontWeight: 700, fontSize: 14 }}>
            {t("dashboard.registerTitle")}
          </span>
        }
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t("dashboard.lastUpdated")}: {new Date().toLocaleString("en-IN")}
          </Text>
        }
        style={{ borderRadius: 6 }}
      >
        <Table
          columns={columns}
          dataSource={complaints}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1110 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `${total} ${t("dashboard.records")}`,
          }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: "8px 0" }}>
                <Text strong style={{ display: "block", marginBottom: 6 }}>
                  {t("dashboard.fullDescription")}
                </Text>
                <Text type="secondary" style={{ lineHeight: 1.6 }}>
                  {record.description}
                </Text>
                {record.assignments.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <Text strong style={{ display: "block", marginBottom: 6 }}>
                      {t("dashboard.assignmentDetails")}
                    </Text>
                    {record.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        style={{
                          padding: "10px 14px",
                          background: "#f7f9fc",
                          borderLeft: "3px solid #1a3c6e",
                          borderRadius: 4,
                          marginBottom: 8,
                        }}
                      >
                        <Text>
                          {t("dashboard.assignedTo")}:{" "}
                          <strong>{assignment.officer.name}</strong> —{" "}
                          {assignment.officer.department.name}
                        </Text>
                        {assignment.responses.map((resp) => (
                          <div key={resp.id} style={{ marginTop: 6 }}>
                            <Tag color="blue" style={{ fontSize: 11 }}>
                              {resp.type}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {" "}
                              {resp.message}
                            </Text>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),
          }}
          locale={{
            emptyText: (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <Text type="secondary">
                  {t("dashboard.empty")}{" "}
                  <Link href="/complaint/new" style={{ color: "#1a3c6e" }}>
                    {t("dashboard.fileFirst")}
                  </Link>
                </Text>
              </div>
            ),
          }}
        />
      </Card>

      <Modal
        title="Share Your Achievement"
        open={shareModalOpen}
        onCancel={() => {
          setShareModalOpen(false);
          setSharingComplaint(null);
        }}
        footer={null}
        width="min(520px, 95vw)"
        style={{ top: 20 }}
      >
        {sharingComplaint && (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <Alert
              type="success"
              showIcon
              message={`Complaint #${sharingComplaint.id} resolved!`}
              description="Share your experience and encourage others to raise their voice."
            />
            <div
              style={{
                background: "#f5f7fa",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: "#444",
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
              }}
            >
              {buildShareText(sharingComplaint)}
            </div>
            <Space wrap>
              <Button
                icon={<WhatsAppOutlined />}
                style={{
                  background: "#25D366",
                  borderColor: "#25D366",
                  color: "#fff",
                }}
                onClick={() => {
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(buildShareText(sharingComplaint))}`,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
              >
                WhatsApp
              </Button>
              <Button
                style={{
                  background: "#000",
                  borderColor: "#000",
                  color: "#fff",
                }}
                onClick={() => {
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildShareText(sharingComplaint))}`,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
              >
                𝕏 Twitter
              </Button>
              <Button
                icon={<CopyOutlined />}
                onClick={() => {
                  void navigator.clipboard.writeText(
                    buildShareText(sharingComplaint),
                  );
                  void message.success("Copied to clipboard!");
                }}
              >
                Copy Text
              </Button>
              <Button
                icon={<DownloadOutlined />}
                type="primary"
                style={{ background: "#1a3c6e", borderColor: "#1a3c6e" }}
                onClick={() => void downloadCertificate(sharingComplaint)}
              >
                Download Certificate
              </Button>
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Tip: Download the certificate image and attach it when sharing on
              social media.
            </Text>
          </Space>
        )}
      </Modal>
    </div>
  );
}
