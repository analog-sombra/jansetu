/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Image,
  Input,
  Row,
  Select,
  Skeleton,
  Space,
  Steps,
} from "antd";
import {
  assignAdminComplaintOfficerAction,
  getAdminComplaintDetailAction,
  raiseAdminComplaintQueryAction,
  updateAdminComplaintPriorityAction,
  type AdminComplaintDetail,
  type AdminOfficerSummary,
} from "@/actions/admin";
import { useLanguage } from "@/components/provider/language_provider";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  IN_PROGRESS: "#2563eb",
  WORK_IN_PROGRESS: "#06b6d4",
  QUERY_RAISED: "#ea580c",
  RESOLVED: "#16a34a",
  CLOSED: "#0f766e",
  REJECTED: "#dc2626",
  ESCALATED: "#7c3aed",
  AUTO_CLOSED: "#6b7280",
};

const RESPONSE_COLORS: Record<string, string> = {
  RESOLVED: "#16a34a",
  QUERY: "#ea580c",
  REJECTED: "#dc2626",
  WORK_IN_PROGESS: "#06b6d4",
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function makeWhatsAppLink(message: string) {
  const phone = "9773356997";
  return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
}

export default function AdminComplaintDetailPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLanguage();

  const [complaint, setComplaint] = useState<AdminComplaintDetail | null>(null);
  const [officers, setOfficers] = useState<AdminOfficerSummary[]>([]);
  const [officerId, setOfficerId] = useState<string>("");
  const [queryMessage, setQueryMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [assignedOfficerToken, setAssignedOfficerToken] = useState("");
  const [alert, setAlert] = useState<{
    type: "error" | "success" | "warning" | "info";
    text: string;
  } | null>(null);

  const complaintId = Number(params.id);

  async function loadData() {
    if (!Number.isInteger(complaintId) || complaintId <= 0) {
      setComplaint(null);
      setOfficers([]);
      setAlert({ type: "error", text: t("adminDetail.error.load") });
      setLoading(false);
      return;
    }

    setLoading(true);
    setAlert(null);

    const result = await getAdminComplaintDetailAction(complaintId);

    if (!result.ok) {
      setComplaint(null);
      setOfficers([]);
      setAssignedOfficerToken("");
      setAlert({
        type: "error",
        text: result.error ?? t("adminDetail.error.load"),
      });
      setLoading(false);
      return;
    }

    const tokens = result.complaint.assignments;

    if (tokens.length > 0) {
      setAssignedOfficerToken(tokens[0].token);
    } else {
      setAssignedOfficerToken("");
    }

    setComplaint(result.complaint);
    setOfficers(result.officers);
    setLoading(false);
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, t]);

  const officerResponses = useMemo(() => {
    if (!complaint) {
      return [];
    }

    return complaint.assignments
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
  }, [complaint]);

  const currentAssignment = useMemo(() => {
    if (!complaint || complaint.assignments.length === 0) {
      return null;
    }

    return complaint.assignments[0];
  }, [complaint]);

  const relevantOfficers = useMemo(() => {
    if (!complaint) {
      return [];
    }

    // Use the category's department from the database
    if (!complaint.categoryDepartment) {
      return [];
    }

    return officers.filter(
      (officer) => officer.department.id === complaint.categoryDepartment?.id,
    );
  }, [complaint, officers]);

  const workflowState = useMemo(() => {
    if (!complaint) {
      return null;
    }

    const statusToStep: Record<string, number> = {
      PENDING: 0,
      IN_PROGRESS: 1,
      WORK_IN_PROGRESS: 2,
      QUERY_RAISED: 3,
      RESOLVED: 4,
      CLOSED: 5,
      AUTO_CLOSED: 5,
      REJECTED: 5,
      ESCALATED: 6,
    };

    const stepTitles = [
      "Filed",
      "Assigned",
      "Work In Progress",
      "Query Raised",
      "Resolved",
      "Closed",
      "Escalated / Reopened",
    ];

    const currentStep = statusToStep[complaint.status] ?? 0;
    const currentStepLabel = stepTitles[currentStep] ?? "Filed";

    let helperText = `${t("adminDetail.status")}: ${formatLabel(complaint.status)}.`;
    if (complaint.status === "PENDING") {
      helperText = "Complaint is filed and waiting for officer assignment.";
    } else if (complaint.status === "IN_PROGRESS") {
      helperText = "Officer has been assigned to this complaint.";
    } else if (complaint.status === "WORK_IN_PROGRESS") {
      helperText = "Officer is working on the complaint and needs more time.";
    } else if (complaint.status === "QUERY_RAISED") {
      helperText = "Officer raised a query and is awaiting clarification.";
    } else if (complaint.status === "RESOLVED") {
      helperText =
        "Officer resolved the complaint. Citizen completion is pending.";
    } else if (complaint.status === "CLOSED") {
      helperText = "Citizen marked this complaint as completed.";
    } else if (complaint.status === "AUTO_CLOSED") {
      helperText = "Admin auto-closed this complaint.";
    } else if (complaint.status === "REJECTED") {
      helperText = "Officer rejected this complaint.";
    } else if (complaint.status === "ESCALATED") {
      helperText =
        "Citizen disputed/reopened this complaint and it is escalated.";
    }

    const items = stepTitles.map((title, index) => {
      if (complaint.status === "REJECTED" && index === 5) {
        return {
          title,
          content: "Rejected",
          status: "error" as const,
        };
      }

      if (complaint.status === "ESCALATED" && index === 6) {
        return {
          title,
          content: "Reopened by citizen dispute",
          status: "process" as const,
        };
      }

      if (index < currentStep) {
        return {
          title,
          content: "Completed",
          status: "finish" as const,
        };
      }

      if (index === currentStep) {
        return {
          title,
          content: formatLabel(complaint.status),
          status: "process" as const,
        };
      }

      return {
        title,
        content: "Pending",
        status: "wait" as const,
      };
    });

    return {
      currentStep,
      currentStepLabel,
      helperText,
      items,
    };
  }, [complaint, t]);

  async function assignOfficer() {
    if (!complaint || !officerId) {
      return;
    }

    setAssigning(true);
    setAlert(null);

    const result = await assignAdminComplaintOfficerAction({
      complaintId: complaint.id,
      officerId: Number(officerId),
    });

    setAssigning(false);

    if (!result.ok) {
      setAssignedOfficerToken("");
      setAlert({
        type: "error",
        text: result.error ?? t("adminDetail.error.assign"),
      });
      return;
    }

    setAssignedOfficerToken(result.token);
    setOfficerId("");
    setAlert({
      type: "success",
      text: `${t("adminDetail.success.assign")} ${t("adminDetail.assignmentToken")}: ${result.token}`,
    });

    await loadData();
  }

  function sendOfficerLinkOnWhatsApp() {
    if (!assignedOfficerToken || !complaint) {
      return;
    }

    const message = [
      t("adminDetail.whatsapp.title"),
      "",
      `${t("adminDetail.whatsapp.complaintId")}: ${complaint.id}`,
      `${t("adminDetail.whatsapp.status")}: ${formatLabel(complaint.status)}`,
      `${t("adminDetail.whatsapp.category")}: ${complaint.category}`,
      `${t("adminDetail.whatsapp.subcategory")}: ${complaint.subcategory || t("adminDetail.na")}`,
      `${t("adminDetail.whatsapp.complainantName")}: ${complaint.user.name?.trim() || t("adminDetail.notProvided")}`,
      `${t("adminDetail.whatsapp.complainantMobile")}: ${complaint.user.mobile}`,
      `${t("adminDetail.whatsapp.address")}: ${complaint.user.address?.trim() || t("adminDetail.notProvided")}`,
      `Locality: ${complaint.locality ?? t("adminDetail.notSpecified")}`,
      `Sublocality: ${complaint.sublocality ?? t("adminDetail.notSpecified")}`,
      `${t("adminDetail.whatsapp.targetDate")}: ${complaint.plannedCompletionDate ? new Date(complaint.plannedCompletionDate).toLocaleDateString("en-IN") : t("adminDetail.notSet")}`,
      "",
      `${t("adminDetail.whatsapp.link")}: ${window.location.origin}/officer/${assignedOfficerToken}`,
    ].join("\n");
    // `${t("adminDetail.assignmentToken")}: ${assignedOfficerToken}`,

    window.open(makeWhatsAppLink(message), "_blank", "noopener,noreferrer");
  }

  async function raiseQuery() {
    if (!complaint || !queryMessage.trim()) {
      return;
    }

    setQuerying(true);
    setAlert(null);

    const result = await raiseAdminComplaintQueryAction({
      complaintId: complaint.id,
      message: queryMessage,
    });

    setQuerying(false);

    if (!result.ok) {
      setAlert({
        type: "error",
        text: result.error ?? t("adminDetail.error.query"),
      });
      return;
    }

    setQueryMessage("");
    setAlert({ type: "success", text: t("adminDetail.success.query") });

    await loadData();
  }

  async function addPriorityBy40() {
    if (!complaint) {
      return;
    }

    setUpdatingPriority(true);
    setAlert(null);

    const result = await updateAdminComplaintPriorityAction(complaint.id);

    setUpdatingPriority(false);

    if (!result.ok) {
      setAlert({
        type: "error",
        text: result.error ?? "Unable to update complaint priority.",
      });
      return;
    }

    setAlert({
      type: "success",
      text: `Priority updated to ${result.priority} for complaint #${result.complaintId}.`,
    });

    await loadData();
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
        title={alert?.text ?? t("adminDetail.error.load")}
        showIcon
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: 12, color: "#6b7280" }}>
        {t("adminDetail.breadcrumb")} &rsaquo;{" "}
        <span style={{ color: "#1a3c6e", fontWeight: 700 }}>
          #{complaint.id} - {complaint.category}
        </span>
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
                  {t("adminDetail.complaint")} #{complaint.id} -{" "}
                  {complaint.category}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: 999,
                    padding: "2px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    background: "#f3f4f6",
                    color: STATUS_COLORS[complaint.status] ?? "#111827",
                    border: `1px solid ${STATUS_COLORS[complaint.status] ?? "#d1d5db"}`,
                  }}
                >
                  {formatLabel(complaint.status)}
                </span>
              </div>
            }
          >
            <div className="flex gap-4">
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">
                  {t("adminDetail.complainantName")}
                </h1>
                <p className="text-xs font-semibold text-gray-500">
                  {complaint.user.name?.trim() || t("adminDetail.notProvided")}
                </p>
              </div>
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">
                  {t("adminDetail.mobile")}
                </h1>
                <p className="text-xs font-semibold text-gray-500">
                  {complaint.user.mobile}
                </p>
              </div>
            </div>

            <div className="h-4" />

            <div className="bg-gray-100 rounded-md p-3 flex-1">
              <h1 className="text-sm font-normal">
                {t("adminDetail.address")}
              </h1>
              <p className="text-xs font-semibold text-gray-500">
                {complaint.user.address?.trim() || t("adminDetail.notProvided")}
              </p>
            </div>

            <div className="h-4" />

            <div className="bg-gray-100 rounded-md p-3 flex-1">
              <h1 className="text-sm font-normal">
                {t("adminDetail.targetDate")}
              </h1>
              <p className="text-xs font-semibold text-gray-500">
                {complaint.plannedCompletionDate
                  ? new Date(
                      complaint.plannedCompletionDate,
                    ).toLocaleDateString("en-IN")
                  : t("adminDetail.notSet")}
              </p>
            </div>

            <div className="h-4" />

            <div className="flex gap-4">
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">
                  {t("adminDetail.category")}
                </h1>
                <p className="text-xs font-semibold text-gray-500">
                  {complaint.category}
                </p>
              </div>
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">
                  {t("adminDetail.subCategory")}
                </h1>
                <p className="text-xs font-semibold text-gray-500">
                  {complaint.subcategory || t("adminDetail.na")}
                </p>
              </div>
            </div>

            <div className="h-4" />

            <div className="flex gap-4">
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">Locality</h1>
                <p className="text-xs font-semibold text-gray-500">
                  {complaint.locality ?? t("adminDetail.notSpecified")}
                </p>
              </div>
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">Sublocality</h1>
                <p className="text-xs font-semibold text-gray-500">
                  {complaint.sublocality ?? t("adminDetail.notSpecified")}
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
                    {t("adminDetail.openInGoogleMaps")}
                  </Button>
                </a>
              </div>
            </div>

            <div className="h-4" />

            <div className="bg-gray-100 rounded-md p-3 flex-1">
              <h1 className="text-sm font-normal">Affected Citizens Count</h1>
              <p className="text-xs font-semibold text-gray-500">
                {complaint.cluster
                  ? complaint.cluster.totalAffectedCitizensCount
                  : complaint.affectedCitizensCount}
              </p>
            </div>

            <div className="h-4" />

            <div className="bg-gray-100 rounded-md p-3 flex-1">
              <h1 className="text-sm font-normal">Priority</h1>
              <p className="text-xs font-semibold text-gray-500">
                {complaint.priority}
              </p>
            </div>

            <div className="h-4" />

            <div className="bg-gray-100 rounded-md p-3 flex-1">
              <h1 className="text-sm font-normal">
                {t("adminDetail.description")}
              </h1>
              <p
                className="text-xs font-semibold text-gray-500"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {complaint.description}
              </p>
            </div>

            <div className="h-4" />

            <div className="bg-gray-100 rounded-md p-3 flex-1">
              <h1 className="text-sm font-normal">Complaint Address</h1>
              <p className="text-xs font-semibold text-gray-500">
                {complaint.address?.trim() || t("adminDetail.notProvided")}
              </p>
            </div>

            {complaint.cluster && (
              <>
                <Divider
                  plain
                  style={{ fontSize: 13, color: "#888", margin: "16px 0 12px" }}
                >
                  Complaint Cluster
                </Divider>
                <Card
                  size="small"
                  style={{ borderRadius: 6, borderLeft: "3px solid #1a3c6e" }}
                >
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Department
                  </div>
                  <div style={{ fontWeight: 700, color: "#1a3c6e" }}>
                    {complaint.cluster.departmentName}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                    Cluster Complaint Count: {complaint.cluster.complaintCount}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 12, color: "#6b7280" }}>
                    Cluster Total Affected Citizens:{" "}
                    {complaint.cluster.totalAffectedCitizensCount}
                  </div>

                  <Divider style={{ margin: "12px 0" }} />
                  <Space
                    orientation="vertical"
                    size="small"
                    style={{ width: "100%" }}
                  >
                    {complaint.cluster.complaints.map((item) => (
                      <Card
                        key={item.id}
                        size="small"
                        style={{
                          borderRadius: 6,
                          borderLeft: item.isCurrentComplaint
                            ? "3px solid #16a34a"
                            : "3px solid #1a3c6e",
                        }}
                        styles={{
                          body: {
                            padding: 10,
                          },
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color: "#1a3c6e",
                                fontWeight: 700,
                                fontSize: 12,
                              }}
                            >
                              Complaint #{item.id}
                              {item.isCurrentComplaint && (
                                <span
                                  style={{
                                    marginLeft: 8,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    borderRadius: 999,
                                    padding: "2px 8px",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    background: "#dcfce7",
                                    color: "#166534",
                                    border: "1px solid #bbf7d0",
                                  }}
                                >
                                  Main Complaint
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#6b7280",
                                marginTop: 2,
                              }}
                            >
                              {item.category}
                              {item.subcategory ? ` / ${item.subcategory}` : ""}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#6b7280",
                                marginTop: 2,
                              }}
                            >
                              Status: {formatLabel(item.status)}
                              {item.locality ? ` | Locality: ${item.locality}` : ""}
                              {item.sublocality ? ` | Sublocality: ${item.sublocality}` : ""}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#6b7280",
                                marginTop: 2,
                              }}
                            >
                              Affected Citizens (Cluster Total):{" "}
                              {complaint.cluster?.totalAffectedCitizensCount ??
                                complaint.affectedCitizensCount}
                            </div>
                          </div>

                          <Link href={`/admin/complaint/${item.id}`}>
                            <Button
                              size="small"
                              style={{
                                borderColor: "#1a3c6e",
                                color: "#1a3c6e",
                              }}
                            >
                              View
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </Space>
                </Card>
              </>
            )}

            {complaint.officerAssignmentHistory.length > 0 && (
              <>
                <Divider
                  plain
                  style={{ fontSize: 13, color: "#888", margin: "16px 0 12px" }}
                >
                  Officer Assignment History
                </Divider>
                <Space
                  orientation="vertical"
                  size="small"
                  style={{ width: "100%" }}
                >
                  {complaint.officerAssignmentHistory.map((entry) => (
                    <Card
                      key={entry.id}
                      size="small"
                      style={{
                        borderRadius: 6,
                        borderLeft: "3px solid #1a3c6e",
                      }}
                      styles={{
                        body: {
                          padding: 10,
                        },
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            color: "#1a3c6e",
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {entry.officer.name}
                        </div>
                        {entry.isCurrent && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              borderRadius: 999,
                              padding: "2px 10px",
                              fontSize: 10,
                              fontWeight: 700,
                              background: "#dcfce7",
                              color: "#166534",
                              border: "1px solid #bbf7d0",
                            }}
                          >
                            Current
                          </span>
                        )}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}
                      >
                        {entry.officer.designation} -{" "}
                        {entry.officer.department.name}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}
                      >
                        Assigned on:{" "}
                        {new Date(entry.createdAt).toLocaleString("en-IN")}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}
                      >
                        Assigned by: {entry.assignedByName?.trim() || "Admin"}
                      </div>
                    </Card>
                  ))}
                </Space>
              </>
            )}

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
                          <div style={{ color: "#1a3c6e", fontWeight: 700 }}>
                            {response.officer.name}
                          </div>
                          <div
                            style={{
                              display: "block",
                              fontSize: 12,
                              color: "#6b7280",
                            }}
                          >
                            {response.officer.department.name}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              borderRadius: 999,
                              padding: "2px 10px",
                              fontSize: 12,
                              fontWeight: 700,
                              background: "#f3f4f6",
                              color:
                                RESPONSE_COLORS[response.type] ?? "#111827",
                              border: `1px solid ${RESPONSE_COLORS[response.type] ?? "#d1d5db"}`,
                            }}
                          >
                            {formatLabel(response.type)}
                          </span>
                          <div
                            style={{
                              display: "block",
                              fontSize: 12,
                              color: "#6b7280",
                            }}
                          >
                            {new Date(response.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "block",
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {response.message}
                      </div>
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

            {complaint.media.length > 0 && (
              <>
                <Divider
                  plain
                  style={{ fontSize: 13, color: "#888", margin: "16px 0 12px" }}
                >
                  {t("adminDetail.evidence")}
                </Divider>
                <Image.PreviewGroup>
                  <Row gutter={[12, 12]}>
                    {complaint.media.map((item) => (
                      <Col key={item.id} xs={24} sm={12} md={8}>
                        <Card
                          size="small"
                          style={{
                            borderRadius: 6,
                            borderLeft: "3px solid #1a3c6e",
                          }}
                          styles={{
                            body: {
                              padding: 10,
                            },
                          }}
                        >
                          {item.type === "IMAGE" ? (
                            <Image
                              src={item.fileUrl}
                              alt={
                                item.fileUrl.split("/").pop() ||
                                "Complaint image"
                              }
                              width="100%"
                              style={{
                                borderRadius: 4,
                                objectFit: "cover",
                                aspectRatio: "4 / 3",
                              }}
                            />
                          ) : (
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Button
                                block
                                style={{
                                  borderColor: "#1a3c6e",
                                  color: "#1a3c6e",
                                }}
                              >
                                {t("adminDetail.viewProof")}
                              </Button>
                            </a>
                          )}
                          <div
                            style={{
                              marginTop: 8,
                              fontSize: 11,
                              color: "#6b7280",
                            }}
                          >
                            {item.fileUrl.split("/").pop()}
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Image.PreviewGroup>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space orientation="vertical" style={{ width: "100%" }} size="middle">
            <Card
              title={
                <span style={{ color: "#7c3aed", fontWeight: 700 }}>
                  Complaint Priority
                </span>
              }
              style={{ borderRadius: 6, borderTop: "3px solid #7c3aed" }}
              size="small"
            >
              <Button
                type="primary"
                block
                loading={updatingPriority}
                onClick={addPriorityBy40}
                style={{
                  background: "#7c3aed",
                  borderColor: "#7c3aed",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                Mark as Prior
              </Button>
              <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                Current priority: {complaint.priority}
              </div>
            </Card>

            <Card
              title={
                <span style={{ color: "#1a3c6e", fontWeight: 700 }}>
                  {t("adminDetail.assignOfficer")}
                </span>
              }
              style={{ borderRadius: 6, borderTop: "3px solid #1a3c6e" }}
              size="small"
            >
              <Form layout="vertical" requiredMark={false}>
                {currentAssignment && (
                  <div
                    style={{
                      marginBottom: 12,
                      padding: 10,
                      background: "#f7f9fc",
                      borderLeft: "3px solid #1a3c6e",
                      borderRadius: 4,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {t("adminDetail.currentAssignedOfficer")}
                    </div>
                    <div
                      style={{
                        color: "#1a3c6e",
                        fontWeight: 700,
                        marginTop: 2,
                      }}
                    >
                      {currentAssignment.officer.name}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}
                    >
                      {currentAssignment.officer.designation} -{" "}
                      {currentAssignment.officer.department.name}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}
                    >
                      {t("adminDetail.status")}:{" "}
                      {formatLabel(currentAssignment.status)}
                    </div>
                  </div>
                )}

                <Form.Item
                  label={
                    currentAssignment
                      ? t("adminDetail.changeOfficer")
                      : t("adminDetail.selectOfficer")
                  }
                  style={{ marginBottom: 12 }}
                >
                  <Select
                    placeholder={
                      currentAssignment
                        ? t("adminDetail.selectOfficerReassignPlaceholder")
                        : t("adminDetail.selectOfficerPlaceholder")
                    }
                    value={officerId || undefined}
                    onChange={(val) => setOfficerId(val)}
                    size="large"
                    style={{ width: "100%" }}
                    options={relevantOfficers.map((officer) => ({
                      value: String(officer.id),
                      label: `${officer.name} (${officer.designation}) - ${officer.department.name}`,
                    }))}
                    notFoundContent={
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        {t("adminDetail.noOfficers")}
                      </div>
                    }
                  />
                </Form.Item>

                {relevantOfficers.length === 0 && (
                  <Alert
                    type="warning"
                    title={t("adminDetail.noRelevantOfficersWarning")}
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
                    color: "#fff",
                  }}
                >
                  {t("adminDetail.assignOfficer")}
                </Button>

                {assignedOfficerToken && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {t("adminDetail.assignmentToken")}: {assignedOfficerToken}
                    </div>
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
                      {t("adminDetail.sendDetailsOnWhatsApp")}
                    </Button>
                  </div>
                )}
              </Form>
            </Card>

            <Card
              title={
                <span style={{ color: "#e07b00", fontWeight: 700 }}>
                  {t("adminDetail.raiseQuery")}
                </span>
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
            {workflowState && (
              <Card
                title={
                  <span style={{ color: "#1a3c6e", fontWeight: 700 }}>
                    {t("adminDetail.workflowTitle")}
                  </span>
                }
                style={{ borderRadius: 6, borderTop: "3px solid #1a3c6e" }}
                size="small"
              >
                <div
                  style={{
                    marginBottom: 12,
                    padding: 10,
                    background: "#f7f9fc",
                    borderLeft: "3px solid #1a3c6e",
                    borderRadius: 4,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {t("adminDetail.workflowCurrentStep")}
                  </div>
                  <div
                    style={{ color: "#1a3c6e", fontWeight: 700, marginTop: 2 }}
                  >
                    {workflowState.currentStepLabel}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      marginTop: 4,
                      lineHeight: 1.6,
                    }}
                  >
                    {workflowState.helperText}
                  </div>
                </div>

                <Steps
                  orientation="vertical"
                  current={workflowState.currentStep}
                  size="small"
                  items={workflowState.items}
                />
              </Card>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
}
