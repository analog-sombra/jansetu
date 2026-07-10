/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  message,
  Modal,
  Rate,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import type { TableColumnsType } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import {
  CopyOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import { useLanguage } from "@/components/provider/language_provider";
import {
  ComplaintDashboardItem,
  ComplaintDashboardProfile,
  confirmResolutionAction,
  createComplaintDisputeAction,
  createComplaintReviewAction,
} from "@/actions/user/complaint";

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "orange",
  IN_PROGRESS: "blue",
  WORK_IN_PROGRESS: "cyan",
  QUERY_RAISED: "volcano",
  RESOLVED: "green",
  CLOSED: "geekblue",
  REJECTED: "red",
  ESCALATED: "purple",
  AUTO_CLOSED: "default",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

function getLocalizedCategory(
  category: string,
  t: (key: string) => string,
): string {
  const categoryKeyByValue: Record<string, string> = {
    Road: "category.road",
    Water: "category.water",
    Electricity: "category.electricity",
    Sanitation: "category.sanitation",
    Health: "category.health",
    "Public Safety": "category.publicSafety",
    Other: "category.other",
  };

  const translationKey = categoryKeyByValue[category];
  return translationKey ? t(translationKey) : category;
}

type ComplaintDashboardClientProps = {
  initialComplaints: ComplaintDashboardItem[];
  initialProfile: ComplaintDashboardProfile | null;
  initialError?: string;
};

export default function ComplaintDashboardClient({
  initialComplaints,
  initialProfile,
  initialError,
}: ComplaintDashboardClientProps) {
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState<ComplaintDashboardItem[]>(
    initialComplaints,
  );
  const [error, setError] = useState(initialError ?? "");
  const [profile] = useState<ComplaintDashboardProfile | null>(initialProfile);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharingComplaint, setSharingComplaint] =
    useState<ComplaintDashboardItem | null>(null);
  const [resolvingComplaintId, setResolvingComplaintId] = useState<number | null>(
    null,
  );
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputingComplaint, setDisputingComplaint] =
    useState<ComplaintDashboardItem | null>(null);
  const [disputeRemark, setDisputeRemark] = useState("");
  const [disputeFileList, setDisputeFileList] = useState<UploadFile[]>([]);
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingComplaint, setReviewingComplaint] =
    useState<ComplaintDashboardItem | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewFileList, setReviewFileList] = useState<UploadFile[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("");

  useEffect(() => {
    setLastUpdatedLabel(DATE_TIME_FORMATTER.format(new Date()));
  }, []);

  function formatDisplayDate(value: string) {
    return DATE_FORMATTER.format(new Date(value));
  }

  async function generateCertificateCanvas(
    complaint: ComplaintDashboardItem,
  ): Promise<HTMLCanvasElement> {
    const width = 1408;
    const height = 768;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not initialize certificate canvas.");
    }

    const template = await new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(img);
      img.src = "/image/cert.jpg";
    });

    if (template.naturalWidth > 0 && template.naturalHeight > 0) {
      ctx.drawImage(template, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#f5f1e8";
      ctx.fillRect(0, 0, width, height);
    }

    const receiverName = profile?.name?.trim() || "Citizen";
    const location = complaint.area?.trim() || "Constituency Area";
    const issueType = complaint.category.replaceAll("_", " ").toLowerCase();
    const issueDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const certificateId = `JS-${complaint.id}-${new Date().getFullYear()}`;

    const centerX = width / 2;
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

    ctx.font = "400 19px Georgia, serif";
    ctx.fillText("This is to certify that", centerX, 302);

    ctx.font = "bold 52px Georgia, serif";
    ctx.fillStyle = "#1a3c6e";
    ctx.fillText(receiverName, centerX, 366);

    ctx.font = "400 19px Georgia, serif";
    ctx.fillStyle = "#333";
    const restText =
      `has acted as a responsible citizen by bringing attention to and successfully getting a ${issueType} issue resolved` +
      ` in ${location} through the Seva me Sirsa grievance portal.` +
      ` We sincerely appreciate the awareness and civic responsibility demonstrated towards community development.`;
    wrapText(restText, centerX, 412, 960, 26);

    ctx.font = "700 20px Arial, sans-serif";
    ctx.fillStyle = "#111";
    ctx.fillText(`Date of Issue: ${issueDate}`, centerX, 502);

    ctx.font = "700 20px Arial, sans-serif";
    ctx.fillText(`Certificate ID: ${certificateId}`, centerX, 530);

    ctx.textAlign = "left";
    ctx.fillStyle = "#111";
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

  async function downloadCertificate(complaint: ComplaintDashboardItem) {
    try {
      const canvas = await generateCertificateCanvas(complaint);
      canvas.toBlob((blob) => {
        if (!blob) {
          return;
        }

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `SevaMeSirsa-Certificate-${complaint.id}.png`;
        anchor.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch {
      void message.error("Could not generate certificate. Please try again.");
    }
  }

  function openShareModal(complaint: ComplaintDashboardItem) {
    setSharingComplaint(complaint);
    setShareModalOpen(true);
  }

  function buildShareText(complaint: ComplaintDashboardItem) {
    return `My grievance #${complaint.id} (${complaint.category.replaceAll("_", " ")}) filed on Seva me Sirsa has been successfully RESOLVED!\n#SevaMeSirsa #GrievanceRedressal #YourVoiceOurCommitment`;
  }

  async function confirmResolution(complaintId: number, confirmed: boolean) {
    setResolvingComplaintId(complaintId);
    const result = await confirmResolutionAction(complaintId, confirmed);
    setResolvingComplaintId(null);

    if (!result.ok) {
      setError(result.error ?? "Unable to update complaint status.");
      void message.error(result.error ?? "Unable to update complaint status.");
      return;
    }

    setComplaints((current) =>
      current.map((item) =>
        item.id === complaintId
          ? { ...item, status: result.status ?? item.status }
          : item,
      ),
    );

    void message.success(
      confirmed
        ? result.status === "CLOSED"
          ? "Complaint marked as completed."
          : "Complaint marked as resolved."
        : "Complaint has been disputed and escalated.",
    );
  }

  function openDisputeModal(complaint: ComplaintDashboardItem) {
    setDisputingComplaint(complaint);
    setDisputeRemark("");
    setDisputeFileList([]);
    setDisputeModalOpen(true);
  }

  async function submitDispute() {
    if (!disputingComplaint) {
      return;
    }

    const photo = disputeFileList[0]?.originFileObj;

    if (!(photo instanceof File)) {
      void message.error("Please upload a dispute photo.");
      return;
    }

    if (disputeRemark.trim().length < 10) {
      void message.error("Please enter at least 10 characters in remark.");
      return;
    }

    const formData = new FormData();
    formData.append("complaintId", String(disputingComplaint.id));
    formData.append("remark", disputeRemark.trim());
    formData.append("photo", photo);

    setSubmittingDispute(true);
    const result = await createComplaintDisputeAction(formData);
    setSubmittingDispute(false);

    if (!result.ok) {
      setError(result.error ?? "Unable to create dispute.");
      void message.error(result.error ?? "Unable to create dispute.");
      return;
    }

    setComplaints((current) =>
      current.map((item) =>
        item.id === disputingComplaint.id
          ? { ...item, status: result.status ?? item.status }
          : item,
      ),
    );

    setDisputeModalOpen(false);
    setDisputingComplaint(null);
    setDisputeRemark("");
    setDisputeFileList([]);
    void message.success("Dispute submitted successfully.");
  }

  function openReviewModal(complaint: ComplaintDashboardItem) {
    setReviewingComplaint(complaint);
    setReviewText("");
    setReviewRating(5);
    setReviewFileList([]);
    setReviewModalOpen(true);
  }

  async function submitReview() {
    if (!reviewingComplaint) {
      return;
    }

    const photo = reviewFileList[0]?.originFileObj;

    if (!(photo instanceof File)) {
      void message.error("Please upload a review photo.");
      return;
    }

    if (reviewText.trim().length < 10) {
      void message.error("Please write at least 10 characters in review.");
      return;
    }

    if (!Number.isInteger(reviewRating) || reviewRating < 1 || reviewRating > 5) {
      void message.error("Please select a rating between 1 and 5 stars.");
      return;
    }

    const formData = new FormData();
    formData.append("complaintId", String(reviewingComplaint.id));
    formData.append("review", reviewText.trim());
    formData.append("rating", String(reviewRating));
    formData.append("photo", photo);

    setSubmittingReview(true);
    const result = await createComplaintReviewAction(formData);
    setSubmittingReview(false);

    if (!result.ok) {
      setError(result.error ?? "Unable to submit review.");
      void message.error(result.error ?? "Unable to submit review.");
      return;
    }

    setComplaints((current) =>
      current.map((item) =>
        item.id === reviewingComplaint.id
          ? { ...item, status: result.status ?? item.status }
          : item,
      ),
    );

    setReviewModalOpen(false);
    setReviewingComplaint(null);
    setReviewText("");
    setReviewRating(5);
    setReviewFileList([]);
    void message.success("Review submitted and complaint marked as completed.");
  }

  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter(
    (complaint) => complaint.status === "RESOLVED",
  ).length;
  const pendingComplaints = complaints.filter((complaint) =>
    ["PENDING", "IN_PROGRESS", "WORK_IN_PROGRESS", "QUERY_RAISED"].includes(
      complaint.status,
    ),
  ).length;

  const columns: TableColumnsType<ComplaintDashboardItem> = [
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
      sorter: (left, right) => left.id - right.id,
    },
    {
      title: t("dashboard.table.category"),
      dataIndex: "category",
      key: "category",
      width: 150,
      render: (category: string) => (
        <Text strong>{getLocalizedCategory(category, t)}</Text>
      ),
      filters: [...new Set(complaints.map((complaint) => complaint.category))].map(
        (category) => ({
          text: getLocalizedCategory(category, t),
          value: category,
        }),
      ),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: t("dashboard.table.description"),
      dataIndex: "description",
      key: "description",
      width: 220,
      ellipsis: true,
      render: (description: string) => (
        <Tooltip title={description}>
          <Text type="secondary">{description}</Text>
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
      filters: Object.keys(STATUS_COLORS).map((status) => ({
        text: status.replaceAll("_", " "),
        value: status,
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
            {formatDisplayDate(date)}
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            -
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
          {formatDisplayDate(date)}
        </Text>
      ),
      sorter: (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    },
    {
      title: t("dashboard.table.action"),
      key: "action",
      width: 260,
      render: (_, record) => {
        if (record.status === "QUERY_RAISED") {
          return (
            <Space size="small">
              <Link href={`/user/complaint/${record.id}`}>
                <Button size="small" style={{ borderColor: "#1a3c6e", color: "#1a3c6e" }}>
                  View
                </Button>
              </Link>
              <Button
                size="small"
                type="primary"
                loading={resolvingComplaintId === record.id}
                disabled={resolvingComplaintId === record.id}
                onClick={() => {
                  void confirmResolution(record.id, true);
                }}
                style={{ background: "#2e7d32", borderColor: "#2e7d32" }}
              >
                {t("dashboard.confirm")}
              </Button>
              <Button
                size="small"
                danger
                loading={resolvingComplaintId === record.id}
                disabled={resolvingComplaintId === record.id}
                onClick={() => {
                  openDisputeModal(record);
                }}
              >
                {t("dashboard.dispute")}
              </Button>
            </Space>
          );
        }

        if (record.status === "RESOLVED") {
          return (
            <Space size="small">
              <Link href={`/user/complaint/${record.id}`}>
                <Button size="small" style={{ borderColor: "#1a3c6e", color: "#1a3c6e" }}>
                  View
                </Button>
              </Link>
              <Button
                size="small"
                type="primary"
                loading={resolvingComplaintId === record.id}
                disabled={resolvingComplaintId === record.id}
                onClick={() => {
                  openReviewModal(record);
                }}
                style={{ background: "#2e7d32", borderColor: "#2e7d32" }}
              >
                Complete
              </Button>
              <Button
                size="small"
                danger
                onClick={() => {
                  openDisputeModal(record);
                }}
              >
                {t("dashboard.dispute")}
              </Button>
            </Space>
          );
        }

        if (record.status === "CLOSED") {
          return (
            <Space size="small">
              <Link href={`/user/complaint/${record.id}`}>
                <Button size="small" style={{ borderColor: "#1a3c6e", color: "#1a3c6e" }}>
                  View
                </Button>
              </Link>
              <Button
                size="small"
                danger
                onClick={() => {
                  openDisputeModal(record);
                }}
              >
                Reopen / Dispute
              </Button>
            </Space>
          );
        }

        return (
          <Space size="small">
            <Link href={`/user/complaint/${record.id}`}>
              <Button size="small" style={{ borderColor: "#1a3c6e", color: "#1a3c6e" }}>
                View
              </Button>
            </Link>
          </Space>
        );
      },
    },
    {
      title: "",
      key: "certificate",
      width: 90,
      render: (_, record) =>
        record.status === "CLOSED" ? (
          <Space size="small">
            <Tooltip title="Download Certificate">
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => {
                  void downloadCertificate(record);
                }}
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

        <Link href="/user/addcomplaint" style={{ flexShrink: 0 }}>
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
        <Alert type="error" title={error} showIcon style={{ marginBottom: 20 }} />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderLeft: "4px solid #1a3c6e", borderRadius: 6 }}>
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
          <Card size="small" style={{ borderLeft: "4px solid #2e7d32", borderRadius: 6 }}>
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
          <Card size="small" style={{ borderLeft: "4px solid #e07b00", borderRadius: 6 }}>
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

      <Card
        title={
          <span style={{ color: "#1a3c6e", fontWeight: 700, fontSize: 14 }}>
            {t("dashboard.registerTitle")}
          </span>
        }
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t("dashboard.lastUpdated")}: {lastUpdatedLabel || "-"}
          </Text>
        }
        style={{ borderRadius: 6 }}
      >
        <Table
          columns={columns}
          dataSource={complaints}
          rowKey="id"
          loading={false}
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
                          {t("dashboard.assignedTo")}: <strong>{assignment.officer.name}</strong> -{" "}
                          {assignment.officer.department.name}
                        </Text>
                        {assignment.responses.map((response) => (
                          <div key={response.id} style={{ marginTop: 6 }}>
                            <Tag color="blue" style={{ fontSize: 11 }}>
                              {response.type}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {" "}
                              {response.message}
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
                  {t("dashboard.empty")} {" "}
                  <Link href="/user/addcomplaint" style={{ color: "#1a3c6e" }}>
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
          <Space orientation="vertical" style={{ width: "100%" }} size="middle">
            <Alert
              type="success"
              showIcon
              title={`Complaint #${sharingComplaint.id} resolved!`}
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
                X Twitter
              </Button>
              <Button
                icon={<CopyOutlined />}
                onClick={() => {
                  void navigator.clipboard.writeText(buildShareText(sharingComplaint));
                  void message.success("Copied to clipboard!");
                }}
              >
                Copy Text
              </Button>
              <Button
                icon={<DownloadOutlined />}
                type="primary"
                style={{ background: "#1a3c6e", borderColor: "#1a3c6e" }}
                onClick={() => {
                  void downloadCertificate(sharingComplaint);
                }}
              >
                Download Certificate
              </Button>
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Tip: Download the certificate image and attach it when sharing on social media.
            </Text>
          </Space>
        )}
      </Modal>

      <Modal
        title={
          disputingComplaint
            ? `Create Dispute for Complaint #${disputingComplaint.id}`
            : "Create Dispute"
        }
        open={disputeModalOpen}
        onCancel={() => {
          if (submittingDispute) return;
          setDisputeModalOpen(false);
          setDisputingComplaint(null);
          setDisputeRemark("");
          setDisputeFileList([]);
        }}
        onOk={() => {
          void submitDispute();
        }}
        okText="Submit Dispute"
        confirmLoading={submittingDispute}
      >
        <Space orientation="vertical" style={{ width: "100%" }} size="middle">
          <Alert
            type="warning"
            showIcon
            title="Upload proof and explain why you are disputing this resolution."
          />

          <div>
            <Text strong>Remark</Text>
            <Input.TextArea
              rows={4}
              value={disputeRemark}
              onChange={(event) => setDisputeRemark(event.target.value)}
              placeholder="Enter dispute remark"
              maxLength={500}
              style={{ marginTop: 6 }}
            />
          </div>

          <div>
            <Text strong>Photo</Text>
            <Upload
              style={{ marginTop: 6 }}
              accept="image/*"
              listType="picture"
              maxCount={1}
              fileList={disputeFileList}
              beforeUpload={() => false}
              onChange={({ fileList }) => setDisputeFileList(fileList)}
            >
              <Button>Upload Photo</Button>
            </Upload>
          </div>
        </Space>
      </Modal>

      <Modal
        title={
          reviewingComplaint
            ? `Complete Complaint #${reviewingComplaint.id} with Review`
            : "Complete with Review"
        }
        open={reviewModalOpen}
        onCancel={() => {
          if (submittingReview) return;
          setReviewModalOpen(false);
          setReviewingComplaint(null);
          setReviewText("");
          setReviewRating(5);
          setReviewFileList([]);
        }}
        onOk={() => {
          void submitReview();
        }}
        okText="Submit Review"
        confirmLoading={submittingReview}
      >
        <Space orientation="vertical" style={{ width: "100%" }} size="middle">
          <Alert
            type="success"
            showIcon
            title="Rate and review this resolved complaint before marking it completed."
          />

          <div>
            <Text strong>Rating</Text>
            <div style={{ marginTop: 8 }}>
              <Rate value={reviewRating} onChange={setReviewRating} allowClear={false} />
            </div>
          </div>

          <div>
            <Text strong>Review</Text>
            <Input.TextArea
              rows={4}
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              placeholder="Write your review"
              maxLength={500}
              style={{ marginTop: 6 }}
            />
          </div>

          <div>
            <Text strong>Photo</Text>
            <Upload
              style={{ marginTop: 6 }}
              accept="image/*"
              listType="picture"
              maxCount={1}
              fileList={reviewFileList}
              beforeUpload={() => false}
              onChange={({ fileList }) => setReviewFileList(fileList)}
            >
              <Button>Upload Photo</Button>
            </Upload>
          </div>
        </Space>
      </Modal>
    </div>
  );
}
