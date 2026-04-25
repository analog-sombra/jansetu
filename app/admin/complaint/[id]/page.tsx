"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  Form,
  Select,
  Input,
  Button,
  Typography,
  Tag,
  Alert,
  Row,
  Col,
  Space,
  Divider,
  Skeleton,
} from "antd";
import { useLanguage } from "@/components/language-provider";
import {
  getLocalizedCategory,
  getLocalizedSubcategory,
} from "@/lib/complaint-i18n";

const { Text } = Typography;

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

const RESPONSE_COLORS: Record<string, string> = {
  RESOLVED: "green",
  QUERY: "volcano",
  REJECTED: "red",
};

type Officer = {
  id: number;
  name: string;
  department: { name: string };
};

type OfficerResponse = {
  id: number;
  type: string;
  message: string;
  proofUrl: string | null;
  createdAt: string;
};

type Assignment = {
  id: number;
  officer: Officer;
  responses: OfficerResponse[];
};

type Complaint = {
  id: number;
  user: {
    name: string | null;
    address: string | null;
    mobile: string;
  };
  category: string;
  subcategory: string | null;
  description: string;
  status: string;
  plannedCompletionDate: string | null;
  lat: number;
  lng: number;
  area: string | null;
  media: Array<{ id: number; fileUrl: string; type: string }>;
  assignments: Assignment[];
};

export default function AdminComplaintDetailPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [officerId, setOfficerId] = useState<string>("");
  const [queryMessage, setQueryMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{
    type: "error" | "success" | "warning" | "info";
    text: string;
  } | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [assignedOfficerLink, setAssignedOfficerLink] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      const complaintResponse = await fetch(`/api/complaints/${params.id}`);
      const complaintResult = await complaintResponse.json();
      if (!complaintResponse.ok) {
        setAlert({
          type: "error",
          text: complaintResult.error ?? t("adminDetail.error.load"),
        });
        setLoading(false);
        return;
      }
      setComplaint(complaintResult.complaint);

      const officerQuery = new URLSearchParams({
        category: complaintResult.complaint.category,
      });
      const officersResponse = await fetch(
        `/api/admin/officers?${officerQuery.toString()}`,
      );
      const officersResult = await officersResponse.json();
      if (officersResponse.ok) setOfficers(officersResult.officers);
      setLoading(false);
    }
    void loadData();
  }, [params.id]);

  async function assignOfficer() {
    if (!officerId) return;
    setAssigning(true);
    const response = await fetch("/api/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        complaintId: Number(params.id),
        officerId: Number(officerId),
      }),
    });
    const result = await response.json();
    setAssigning(false);
    if (response.ok) {
      setAssignedOfficerLink(result.tokenLink ?? "");
      setAlert({
        type: "success",
        text: `Officer assigned successfully. Secure access link: ${result.tokenLink}`,
      });
    } else {
      setAssignedOfficerLink("");
      setAlert({
        type: "error",
        text: result.error ?? t("adminDetail.error.assign"),
      });
    }
  }

  function sendOfficerLinkOnWhatsApp() {
    if (!assignedOfficerLink || !complaint) return;

    const phone = "9773356997";
    const selectedOfficer = officers.find(
      (item) => String(item.id) === officerId,
    );
    const evidenceLines = complaint.media.length
      ? complaint.media
          .map((item, index) => `${index + 1}. ${item.type}: ${item.fileUrl}`)
          .join("\n")
      : "No evidence uploaded";

    const message = [
      "Complaint Assignment Details",
      "",
      `Complaint ID: ${complaint.id}`,
      `Status: ${complaint.status.replaceAll("_", " ")}`,
      `Category: ${getLocalizedCategory(complaint.category, t)}`,
      `Subcategory: ${complaint.subcategory ? getLocalizedSubcategory(complaint.subcategory, t) : "N/A"}`,
      `Complainant Name: ${complaint.user.name?.trim() || "Not provided"}`,
      `Complainant Mobile: ${complaint.user.mobile}`,
      `Address: ${complaint.user.address?.trim() || "Not provided"}`,
      `Area: ${complaint.area ?? "Not specified"}`,
      `Target Date: ${complaint.plannedCompletionDate ? new Date(complaint.plannedCompletionDate).toLocaleDateString("en-IN") : "Not set"}`,
      "Description:",
      complaint.description,
      "",
      "Officer Link:",
      assignedOfficerLink,
    ].join("\n");

    const whatsappUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  async function raiseQuery() {
    if (!queryMessage.trim()) return;
    setQuerying(true);
    const response = await fetch(`/api/complaints/${params.id}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: queryMessage }),
    });
    const result = await response.json();
    setQuerying(false);
    if (response.ok) {
      setAlert({ type: "success", text: t("adminDetail.success.query") });
      setQueryMessage("");
    } else {
      setAlert({
        type: "error",
        text: result.error ?? t("adminDetail.error.query"),
      });
    }
  }

  if (loading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  if (!complaint) {
    return (
      <Alert
        type="error"
        title={alert?.text ?? "Complaint not found"}
        showIcon
      />
    );
  }

  const officerResponses = complaint.assignments
    .flatMap((assignment) =>
      assignment.responses.map((response) => ({
        ...response,
        officer: assignment.officer,
      })),
    )
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    );

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t("adminDetail.breadcrumb")} &rsaquo;{" "}
          <Text strong style={{ color: "#1a3c6e" }}>
            #{complaint.id} — {getLocalizedCategory(complaint.category, t)}
          </Text>
        </Text>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          title={alert.text}
          showIcon
          closable
          onClose={() => setAlert(null)}
          style={{ marginBottom: 20 }}
        />
      )}

      <Row gutter={[20, 20]}>
        {/* Left: Complaint Details */}
        <Col xs={24} lg={16}>
          <Card
            style={{ borderRadius: 6 }}
            title={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ color: "#1a3c6e", fontWeight: 700 }}>
                  Complaint #{complaint.id} —{" "}
                  {getLocalizedCategory(complaint.category, t)}
                </span>
                <Tag
                  color={STATUS_COLORS[complaint.status] ?? "default"}
                  style={{ fontWeight: 600 }}
                >
                  {complaint.status.replaceAll("_", " ")}
                </Tag>
              </div>
            }
            extra={
              <a
                href={`/api/admin/pdf/${complaint.id}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button
                  size="small"
                  style={{ borderColor: "#1a3c6e", color: "#1a3c6e" }}
                >
                  {t("adminDetail.downloadPdf")}
                </Button>
              </a>
            }
          >
            <div className="flex gap-4">
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">Complainant Name</h1>
                <p className="text-xs font-semibold text-gray-500">
                  {complaint.user.name?.trim() || "Not provided"}
                </p>
              </div>
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">Mobile</h1>
                <p className="text-xs font-semibold text-gray-500">
                  {complaint.user.mobile}
                </p>
              </div>
            </div>

            <div className="h-4"></div>
            <div className="bg-gray-100 rounded-md p-3 flex-1">
              <h1 className="text-sm font-normal">Address</h1>
              <p className="text-xs font-semibold text-gray-500">
                {complaint.user.address?.trim() || "Not provided"}
              </p>
            </div>

            <div className="h-4"></div>
            <div className="bg-gray-100 rounded-md p-3 flex-1">
              <h1 className="text-sm font-normal">
                {t("adminDetail.targetDate")}
              </h1>
              <p className="text-xs font-semibold text-gray-500">
                {complaint.plannedCompletionDate
                  ? new Date(
                      complaint.plannedCompletionDate,
                    ).toLocaleDateString("en-IN")
                  : "Not set"}
              </p>
            </div>

            <div className="h-4"></div>
            <div className="flex gap-4">
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">
                  {t("adminDetail.category")}
                </h1>
                <p className="text-xs font-semibold text-gray-500">
                  {getLocalizedCategory(complaint.category, t)}
                </p>
              </div>
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">
                  {t("adminDetail.subCategory")}
                </h1>
                <p className="text-xs font-semibold text-gray-500">
                  {complaint.subcategory
                    ? getLocalizedSubcategory(complaint.subcategory, t)
                    : "N/A"}
                </p>
              </div>
            </div>
            <div className="h-4"></div>

            <div className="flex gap-4">
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">{t("adminDetail.area")}</h1>
                <p className="text-xs font-semibold text-gray-500">
                  {complaint.area ?? "Not specified"}
                </p>
              </div>
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">
                  {t("adminDetail.latitude")} & {t("adminDetail.longitude")}
                </h1>
                <p className="text-xs font-semibold text-gray-500">
                  {complaint.lat}, {complaint.lng}
                </p>
                <a
                  href={`https://www.google.com/maps?layer=c&cbll=${complaint.lat},${complaint.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-block", marginTop: 8 }}
                >
                  <Button
                    size="small"
                    style={{
                      borderColor: "#1a3c6e",
                      color: "#1a3c6e",
                      fontSize: 11,
                    }}
                  >
                    📍 Open in Google Maps
                  </Button>
                </a>
              </div>
            </div>

            <div className="h-4"></div>
            <div className="bg-gray-100 rounded-md p-3 flex-1">
              <h1 className="text-sm font-normal">
                {t("adminDetail.description")}
              </h1>
              <p className="text-xs font-semibold text-gray-500">
                {complaint.description}
              </p>
            </div>

            {officerResponses.length > 0 && (
              <>
                <Divider
                  plain
                  style={{ fontSize: 13, color: "#888", margin: "16px 0 12px" }}
                >
                  {t("adminDetail.officerResponse")}
                </Divider>
                <Space
                  orientation="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  {officerResponses.map((response) => (
                    <Card
                      key={response.id}
                      size="small"
                      style={{
                        borderRadius: 6,
                        borderLeft: "3px solid #1a3c6e",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                          marginBottom: 8,
                        }}
                      >
                        <div>
                          <Text strong style={{ color: "#1a3c6e" }}>
                            {response.officer.name}
                          </Text>
                          <Text
                            type="secondary"
                            style={{ display: "block", fontSize: 12 }}
                          >
                            {response.officer.department.name}
                          </Text>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <Tag
                            color={RESPONSE_COLORS[response.type] ?? "default"}
                          >
                            {response.type.replaceAll("_", " ")}
                          </Tag>
                          <Text
                            type="secondary"
                            style={{ display: "block", fontSize: 12 }}
                          >
                            {new Date(response.createdAt).toLocaleString()}
                          </Text>
                        </div>
                      </div>
                      <Text
                        style={{
                          display: "block",
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {response.message}
                      </Text>
                      {response.proofUrl && (
                        <div style={{ marginTop: 12 }}>
                          <a
                            href={response.proofUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button
                              size="small"
                              style={{
                                borderColor: "#1a3c6e",
                                color: "#1a3c6e",
                              }}
                            >
                              {t("adminDetail.viewProof")}
                            </Button>
                          </a>
                        </div>
                      )}
                    </Card>
                  ))}
                </Space>
              </>
            )}

            {/* <Descriptions
              column={{ xs: 1, sm: 1 }}
              size="small"
              bordered
              styles={{ label: { fontWeight: 600, background: "#f7f9fc", width: 140 } }}
            >
              <Descriptions.Item label={t("adminDetail.category")}>
                {getLocalizedCategory(complaint.category, t)}
              </Descriptions.Item>
              <Descriptions.Item label={t("adminDetail.subCategory")}>
                {complaint.subcategory
                  ? getLocalizedSubcategory(complaint.subcategory, t)
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label={t("adminDetail.area")} span={2}>
                {complaint.area ?? "Not specified"}
              </Descriptions.Item>
              <Descriptions.Item label={t("adminDetail.latitude")}>{complaint.lat}</Descriptions.Item>
              <Descriptions.Item label={t("adminDetail.longitude")}>{complaint.lng}</Descriptions.Item>
              <Descriptions.Item label={t("adminDetail.description")} span={2}>
                <Text style={{ lineHeight: 1.7 }}>{complaint.description}</Text>
              </Descriptions.Item>
            </Descriptions> */}

            {complaint.media.length > 0 && (
              <>
                <Divider
                  plain
                  style={{ fontSize: 13, color: "#888", margin: "16px 0 12px" }}
                >
                  {t("adminDetail.evidence")}
                </Divider>
                <Row gutter={[8, 8]}>
                  {complaint.media.map((item) => (
                    <Col key={item.id} xs={24} sm={12}>
                      <a href={item.fileUrl} target="_blank" rel="noreferrer">
                        <Card
                          size="small"
                          hoverable
                          style={{
                            borderRadius: 4,
                            borderLeft: "3px solid #1a3c6e",
                          }}
                          styles={{
                            body: {
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            },
                          }}
                        >
                          <Tag style={{ fontSize: 10 }}>{item.type}</Tag>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {item.fileUrl.split("/").pop()}
                          </Text>
                        </Card>
                      </a>
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </Card>
        </Col>

        {/* Right: Actions */}
        <Col xs={24} lg={8}>
          <Space orientation="vertical" style={{ width: "100%" }} size="middle">
            {/* Assign Officer Card */}
            <Card
              title={
                <Text strong style={{ color: "#1a3c6e" }}>
                  {t("adminDetail.assignOfficer")}
                </Text>
              }
              style={{ borderRadius: 6, borderTop: "3px solid #1a3c6e" }}
              size="small"
            >
              <Form layout="vertical" requiredMark={false}>
                <Form.Item
                  label={t("adminDetail.selectOfficer")}
                  style={{ marginBottom: 12 }}
                >
                  <Select
                    placeholder={t("adminDetail.selectOfficerPlaceholder")}
                    value={officerId || undefined}
                    onChange={(val) => setOfficerId(val)}
                    size="large"
                    style={{ width: "100%" }}
                    options={officers.map((o) => ({
                      value: String(o.id),
                      label: `${o.name} — ${o.department.name}`,
                    }))}
                    notFoundContent={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        No officers mapped to this category
                        {t("adminDetail.noOfficers")}
                      </Text>
                    }
                  />
                </Form.Item>
                {officers.length === 0 && (
                  <Alert
                    type="warning"
                    title={t("adminDetail.noOfficersWarning")}
                    showIcon
                    style={{ marginBottom: 12 }}
                  />
                )}
                <Button
                  type="primary"
                  block
                  disabled={!officerId}
                  loading={assigning}
                  onClick={assignOfficer}
                  style={{
                    background: "#1a3c6e",
                    borderColor: "#1a3c6e",
                    fontWeight: 700,
                  }}
                >
                  {t("adminDetail.assignOfficer")}
                </Button>

                {assignedOfficerLink && (
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Officer link: {assignedOfficerLink}
                    </Text>
                    <Button
                      block
                      onClick={sendOfficerLinkOnWhatsApp}
                      style={{
                        marginTop: 8,
                        background: "#25d366",
                        borderColor: "#25d366",
                        color: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      Send Link on WhatsApp
                    </Button>
                  </div>
                )}
              </Form>
            </Card>

            {/* Raise Query Card */}
            <Card
              title={
                <Text strong style={{ color: "#e07b00" }}>
                  {t("adminDetail.raiseQuery")}
                </Text>
              }
              style={{ borderRadius: 6, borderTop: "3px solid #e07b00" }}
              size="small"
            >
              <Form layout="vertical" requiredMark={false}>
                <Form.Item
                  label={t("adminDetail.queryMessage")}
                  style={{ marginBottom: 12 }}
                >
                  <Input.TextArea
                    rows={3}
                    value={queryMessage}
                    onChange={(e) => setQueryMessage(e.target.value)}
                    placeholder={t("adminDetail.queryPlaceholder")}
                    showCount
                    maxLength={500}
                  />
                </Form.Item>
                <Button
                  block
                  loading={querying}
                  disabled={!queryMessage.trim()}
                  onClick={raiseQuery}
                  style={{
                    background: "#e07b00",
                    borderColor: "#e07b00",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  {t("adminDetail.sendQuery")}
                </Button>
              </Form>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
}
