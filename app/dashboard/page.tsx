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
    const W = 900;
    const H = 640;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Parchment-like backdrop
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#fffdf6");
    bg.addColorStop(1, "#f8f1df");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Formal layered border
    ctx.strokeStyle = "#7f6744";
    ctx.lineWidth = 14;
    ctx.strokeRect(12, 12, W - 24, H - 24);
    ctx.strokeStyle = "#c9a227";
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, W - 48, H - 48);
    ctx.strokeStyle = "#1a3c6e";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(34, 34, W - 68, H - 68);

    // Corner ornaments
    ctx.strokeStyle = "#c9a227";
    ctx.lineWidth = 2;
    const corner = 26;
    const points: Array<[number, number, number, number, number, number]> = [
      [46, 46, 46 + corner, 46, 46, 46 + corner],
      [W - 46, 46, W - 46 - corner, 46, W - 46, 46 + corner],
      [46, H - 46, 46 + corner, H - 46, 46, H - 46 - corner],
      [W - 46, H - 46, W - 46 - corner, H - 46, W - 46, H - 46 - corner],
    ];
    points.forEach(([x1, y1, x2, y2, x3, y3]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x3, y3);
      ctx.stroke();
    });

    // Top tricolor ribbon
    const bx = 56;
    const bw = W - 112;
    ctx.fillStyle = "#ff9933";
    ctx.fillRect(bx, 44, bw, 7);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(bx, 51, bw, 7);
    ctx.fillStyle = "#138808";
    ctx.fillRect(bx, 58, bw, 7);

    // Header
    ctx.textAlign = "center";
    ctx.fillStyle = "#1a3c6e";
    ctx.font = "bold 34px Georgia, serif";
    ctx.fillText("JAN SETU", W / 2, 112);
    ctx.fillStyle = "#7f6744";
    ctx.font = "16px Georgia, serif";
    ctx.fillText("PUBLIC GRIEVANCE REDRESSAL AUTHORITY", W / 2, 136);

    // Title block
    ctx.fillStyle = "#c9a227";
    ctx.fillRect(180, 156, W - 360, 2);
    ctx.fillStyle = "#1a3c6e";
    ctx.font = "bold 28px Georgia, serif";
    ctx.fillText("CERTIFICATE OF RESOLUTION", W / 2, 188);
    ctx.fillStyle = "#7f6744";
    ctx.font = "italic 14px Georgia, serif";
    ctx.fillText(
      "In recognition of responsible civic participation",
      W / 2,
      210,
    );

    // Watermark seal behind content
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = "#1a3c6e";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(W / 2, 336, 120, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Citizen photo medallion
    const personImg = await new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(img);
      img.src = "/image/person.png";
    });
    const px = 132;
    const py = 286;
    const pr = 58;
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.clip();
    if (personImg.naturalWidth > 0) {
      ctx.drawImage(personImg, px - pr, py - pr, pr * 2, pr * 2);
    } else {
      ctx.fillStyle = "#d9deea";
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = "#1a3c6e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#c9a227";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, pr + 8, 0, Math.PI * 2);
    ctx.stroke();

    // Citizen identity text
    ctx.fillStyle = "#1a3c6e";
    ctx.font = "bold 14px Arial, sans-serif";
    ctx.fillText(profile?.name ?? "Citizen", px, 368);
    ctx.fillStyle = "#666";
    ctx.font = "12px Arial, sans-serif";
    ctx.fillText(profile?.mobile ?? "", px, 388);

    // Appreciation statement
    const tx = 228;
    ctx.textAlign = "left";
    ctx.fillStyle = "#3d3d3d";
    ctx.font = "14px Georgia, serif";
    ctx.fillText(
      "This certifies that the grievance raised by the citizen below has been formally resolved, demonstrating ",
      tx,
      242,
    );
    ctx.fillText(
      "accountable governance and responsible public participation in local civic improvement.",
      tx,
      264,
    );
    // ctx.fillText("", tx, 286);

    // Details panel
    const panelX = tx;
    // const panelY = 304;
    const panelY = 280;
    const panelW = 610;
    const panelH = 160;
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = "#c9a227";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // const resolvedAssignment = complaint.assignments.find((assignment) =>
    //   assignment.responses.some((response) => response.type.toUpperCase().includes("RESOLV")),
    // );
    // const fallbackAssignment = complaint.assignments[0];
    // const resolverName = resolvedAssignment?.officer.name ?? fallbackAssignment?.officer.name ?? "Jan Setu Team";
    // const resolverDepartment = resolvedAssignment?.officer.department.name ?? fallbackAssignment?.officer.department.name ?? "Public Grievance Cell";

    const rows: Array<[string, string]> = [
      ["Certificate No.", `JS-${complaint.id}-${new Date().getFullYear()}`],
      ["Complaint Ref.", `#${complaint.id}`],
      ["Category", complaint.category.replaceAll("_", " ")],
      ["Filed On", new Date(complaint.createdAt).toLocaleDateString("en-IN")],
      ["Resolved On", new Date().toLocaleDateString("en-IN")],
      // ["Resolved By", `${resolverName} (${resolverDepartment})`],
    ];
    rows.forEach(([label, value], index) => {
      const y = panelY + 28 + index * 30;
      if (index % 2 === 0) {
        ctx.fillStyle = "#f7f3e7";
        ctx.fillRect(panelX + 1, y - 18, panelW - 2, 28);
      }
      ctx.fillStyle = "#1a3c6e";
      ctx.font = "bold 12px Arial, sans-serif";
      ctx.fillText(label, panelX + 12, y);
      ctx.fillStyle = "#2d2d2d";
      ctx.font = "12px Arial, sans-serif";
      ctx.fillText(value, panelX + 170, y);
    });

    // Short issue excerpt
    // const excerpt = complaint.description.length > 70
    //   ? complaint.description.slice(0, 70) + "..."
    //   : complaint.description;
    // ctx.fillStyle = "#666";
    // ctx.font = "italic 12px Arial, sans-serif";
    // ctx.fillText(`Issue: "${excerpt}"`, panelX + 12, panelY + panelH - 12);

    // Official seal
    const sx = 118;
    const sy = 500;
    const sr = 56;
    ctx.strokeStyle = "#1a3c6e";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sx, sy, sr - 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#1a3c6e";
    ctx.font = "bold 10px Arial, sans-serif";
    ctx.fillText("VERIFIED", sx, sy - 14);
    ctx.fillText("AND RESOLVED", sx, sy + 1);
    ctx.fillStyle = "#7f6744";
    ctx.font = "10px Arial, sans-serif";
    ctx.fillText("JAN SETU", sx, sy + 18);
    ctx.fillStyle = "#7f6744";
    ctx.font = "10px Arial, sans-serif";
    ctx.fillText("AUTHORITY", sx, sy + 28);

    // MLA acknowledgment/profile block (replaces signatures)
    const mlaBoxX = W - 62 - 470;
    const mlaBoxY = 466;
    const mlaBoxW = 470;
    const mlaBoxH = 86;
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.fillRect(mlaBoxX, mlaBoxY, mlaBoxW, mlaBoxH);
    ctx.strokeStyle = "#c9a227";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(mlaBoxX, mlaBoxY, mlaBoxW, mlaBoxH);

    // Mini profile photo for acknowledgment
    const mlaPx = mlaBoxX + 44;
    const mlaPy = mlaBoxY + 38;
    const mlaPr = 24;
    ctx.save();
    ctx.beginPath();
    ctx.arc(mlaPx, mlaPy, mlaPr, 0, Math.PI * 2);
    ctx.clip();
    if (personImg.naturalWidth > 0) {
      ctx.drawImage(
        personImg,
        mlaPx - mlaPr,
        mlaPy - mlaPr,
        mlaPr * 2,
        mlaPr * 2,
      );
    } else {
      ctx.fillStyle = "#d9deea";
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = "#1a3c6e";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(mlaPx, mlaPy, mlaPr, 0, Math.PI * 2);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#1a3c6e";
    ctx.font = "bold 12px Arial, sans-serif";
    ctx.fillText(
      "Under the guidance and continuous follow-up of:",
      mlaBoxX + 80,
      mlaBoxY + 22,
    );
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.fillText("Manjider Singh Sirsa", mlaBoxX + 80, mlaBoxY + 40);
    ctx.fillStyle = "#4d4d4d";
    ctx.font = "12px Arial, sans-serif";
    ctx.fillText(
      "Minister for Environment, Forest",
      mlaBoxX + 80,
      mlaBoxY + 56,
    );
    ctx.fillText("MLA Rajouri Garden", mlaBoxX + 80, mlaBoxY + 70);

    ctx.fillStyle = "#6b5f47";
    ctx.font = "italic 10px Arial, sans-serif";
    ctx.fillText(
      "Acknowledged with gratitude for constituency leadership.",
      mlaBoxX + 80,
      mlaBoxY + 82,
    );

    // Footer pledge + Hindi tagline
    ctx.fillStyle = "#7f6744";
    ctx.font = "12px Georgia, serif";
    ctx.fillText(
      "Together we build a responsible and responsive constituency.",
      W / 2 - 150,
      576,
    );
    ctx.fillStyle = "#1a3c6e";
    ctx.font = "bold 15px Nirmala UI, Mangal, Arial, sans-serif";
    ctx.fillText(
      "समस्या आपने बताई, समाधान हमने करके दिखाया।",
      W / 2 - 150,
      592,
    );
    ctx.fillStyle = "#999";
    ctx.font = "11px Arial, sans-serif";
    ctx.fillText(
      `Issued on ${new Date().toLocaleDateString("en-IN")}`,
      W / 2-20,
      604,
    );

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
        <Link href="/complaint/new">
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
          size="middle"
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
