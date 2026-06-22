/* eslint-disable react-hooks/incompatible-library */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Empty,
  Form,
  Image,
  Input,
  Row,
  Select,
  Skeleton,
} from "antd";
import dayjs from "dayjs";
import { useLanguage } from "@/components/provider/language_provider";
import {
  assignOfficerByTokenAction,
  getOfficerAssignmentByTokenAction,
  type OfficerCompletedAssignmentSummary,
  submitOfficerResponseAction,
  type OfficerAssignmentDetail,
  type SubmitOfficerResponseInput,
} from "@/actions/officer";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  IN_PROGRESS: "#2563eb",
  WORK_IN_PROGRESS: "#06b6d4",
  QUERY_RAISED: "#ea580c",
  RESOLVED: "#16a34a",
  REJECTED: "#dc2626",
  ESCALATED: "#7c3aed",
  AUTO_CLOSED: "#6b7280",
};

const RESPONSE_COLORS: Record<string, string> = {
  RESOLVED: "#16a34a",
  QUERY: "#ea580c",
  REJECTED: "#dc2626",
  WORK_IN_PROGESS: "#0891b2",
};

const completedAssignmentColumnHelper =
  createColumnHelper<OfficerCompletedAssignmentSummary>();

type FormValues = {
  type: SubmitOfficerResponseInput["type"];
  message: string;
  plannedCompletionDate?: dayjs.Dayjs;
  proofUrl?: string;
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN");
}

export default function OfficerTokenPage() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const { t } = useLanguage();
  const [form] = Form.useForm<FormValues>();

  const [assignment, setAssignment] = useState<OfficerAssignmentDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [officerId, setOfficerId] = useState<string>("");
  const [assignedOfficerToken, setAssignedOfficerToken] = useState("");
  const [alert, setAlert] = useState<{
    type: "error" | "success" | "info" | "warning";
    text: string;
  } | null>(null);
  const [completedAssignmentsSorting, setCompletedAssignmentsSorting] =
    useState<SortingState>([]);

  const responseType = Form.useWatch("type", form);

  async function loadAssignment() {

    if (!token) {
      setLoading(false);
      setAlert({ type: "error", text: t("officer.error.invalidToken") });
      return;
    }

    setLoading(true);
    setAlert(null);

    const result = await getOfficerAssignmentByTokenAction(token);


    if (!result.ok) {
      setAssignment(null);
      setAlert({
        type: "error",
        text: result.error ?? t("officer.error.invalidToken"),
      });
      setLoading(false);
      return;
    }

    setAssignment(result.assignment);
    setLoading(false);
  }

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const fetchAssignment = async () => {
      setLoading(true);
      setAlert(null);

      const result = await getOfficerAssignmentByTokenAction(token);

      if (!isMounted) return;

      if (!result.ok) {
        setAssignment(null);
        setAlert({
          type: "error",
          text: result.error ?? t("officer.error.invalidToken"),
        });
        setLoading(false);
        return;
      }

      setAssignment(result.assignment);
      setLoading(false);
    };

    void fetchAssignment();

    return () => {
      isMounted = false;
    };
  }, [token, t]);

  const sortedResponses = useMemo(() => {
    if (!assignment) {
      return [];
    }

    return [...assignment.responses].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    );
  }, [assignment]);

  const completedAssignmentsColumns = useMemo(
    () => [
      completedAssignmentColumnHelper.accessor("complaintId", {
        header: t("officer.completedTableComplaint"),
        cell: (info) => `#${info.getValue()}`,
        sortingFn: "basic",
      }),
      completedAssignmentColumnHelper.accessor("category", {
        header: t("officer.completedTableCategory"),
        sortingFn: "alphanumeric",
      }),
      completedAssignmentColumnHelper.accessor("subcategory", {
        header: t("officer.completedTableSubcategory"),
        cell: (info) => info.getValue() || "-",
      }),
      completedAssignmentColumnHelper.accessor("area", {
        header: t("officer.completedTableArea"),
        cell: (info) => info.getValue() || "-",
      }),
      completedAssignmentColumnHelper.accessor("status", {
        header: t("officer.completedTableStatus"),
        cell: (info) => formatLabel(info.getValue()),
      }),
      completedAssignmentColumnHelper.accessor("completedAt", {
        header: t("officer.completedTableCompletedAt"),
        cell: (info) => formatDateTime(info.getValue()),
        sortingFn: "datetime",
      }),
      completedAssignmentColumnHelper.display({
        id: "action",
        header: t("officer.completedTableAction"),
        cell: (info) => (
          <Link href={`/officer/${token}/${info.row.original.complaintId}`}>
            <Button size="small" type="link" style={{ paddingInline: 0 }}>
              {t("admin.table.view")}
            </Button>
          </Link>
        ),
      }),
    ],
    [t, token],
  );

  const completedAssignmentsTable = useReactTable({
    data: assignment?.completedAssignments ?? [],
    columns: completedAssignmentsColumns,
    state: { sorting: completedAssignmentsSorting },
    onSortingChange: setCompletedAssignmentsSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  async function onFinish(values: FormValues) {
    if (!assignment) {
      return;
    }

    setSubmitting(true);
    setAlert(null);

    const result = await submitOfficerResponseAction({
      token,
      type: values.type,
      message: values.message,
      proofUrl: values.proofUrl,
      plannedCompletionDate: values.plannedCompletionDate
        ?.startOf("day")
        .toISOString(),
    });

    setSubmitting(false);

    if (!result.ok) {
      setAlert({
        type: "error",
        text: result.error ?? t("officer.error.respond"),
      });
      return;
    }

    setAlert({ type: "success", text: t("officer.success.respond") });
    form.resetFields(["type", "message", "plannedCompletionDate", "proofUrl"]);

    await loadAssignment();
  }

  async function assignOfficer() {
    if (!assignment || !officerId) {
      return;
    }

    setAssigning(true);
    setAlert(null);

    const result = await assignOfficerByTokenAction({
      token,
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

    setOfficerId("");
    setAssignedOfficerToken(result.token);
    setAlert({
      type: "success",
      text: `${t("adminDetail.success.assign")} ${t("adminDetail.assignmentToken")}: ${result.token}`,
    });

    window.location.href = `/officer/${result.token}`;
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 560, margin: "80px auto" }}>
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div style={{ maxWidth: 560, margin: "80px auto" }}>
        <Alert
          type="error"
          showIcon
          title={alert?.text ?? t("officer.error.invalidToken")}
        />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: 12, color: "#6b7280" }}>
        {t("officer.banner")} &rsaquo; {assignment.officer.name}
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
                  #{assignment.complaintId} - {assignment.complaint.category}
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
                    color: STATUS_COLORS[assignment.complaint.status] ?? "#111827",
                    border: `1px solid ${STATUS_COLORS[assignment.complaint.status] ?? "#d1d5db"}`,
                  }}
                >
                  {formatLabel(assignment.complaint.status)}
                </span>
              </div>
            }
            extra={
              <a
                href={`https://www.google.com/maps?layer=c&cbll=${assignment.complaint.lat},${assignment.complaint.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="small">{t("officer.openMap")}</Button>
              </a>
            }
          >
            <div className="flex gap-4">
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">{t("adminDetail.complainantName")}</h1>
                <p className="text-xs font-semibold text-gray-500">
                  {assignment.complaint.user.name?.trim() || t("adminDetail.notProvided")}
                </p>
              </div>
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">{t("adminDetail.mobile")}</h1>
                <p className="text-xs font-semibold text-gray-500">
                  {assignment.complaint.user.mobile}
                </p>
              </div>
            </div>

            <div className="h-4" />

            <div className="bg-gray-100 rounded-md p-3 flex-1">
              <h1 className="text-sm font-normal">{t("adminDetail.address")}</h1>
              <p className="text-xs font-semibold text-gray-500">
                {assignment.complaint.user.address?.trim() || t("adminDetail.notProvided")}
              </p>
            </div>

            <div className="h-4" />

            <div className="flex gap-4">
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">{t("officer.department")}</h1>
                <p className="text-xs font-semibold text-gray-500">
                  {assignment.officer.department.name}
                </p>
              </div>
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">{t("officer.category")}</h1>
                <p className="text-xs font-semibold text-gray-500">
                  {assignment.complaint.category}
                </p>
              </div>
            </div>

            <div className="h-4" />

            <div className="flex gap-4">
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">Subcategory</h1>
                <p className="text-xs font-semibold text-gray-500">
                  {assignment.complaint.subcategory || "N/A"}
                </p>
              </div>
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">{t("officer.targetDate")}</h1>
                <p className="text-xs font-semibold text-gray-500">
                  {assignment.complaint.plannedCompletionDate
                    ? new Date(
                        assignment.complaint.plannedCompletionDate,
                      ).toLocaleDateString("en-IN")
                    : "-"}
                </p>
              </div>
            </div>

            <div className="h-4" />

            <div className="flex gap-4">
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">{t("officer.coordinates")}</h1>
                <p className="text-xs font-semibold text-gray-500">
                  {assignment.complaint.lat}, {assignment.complaint.lng}
                </p>
              </div>
              <div className="bg-gray-100 rounded-md p-3 flex-1">
                <h1 className="text-sm font-normal">Area</h1>
                <p className="text-xs font-semibold text-gray-500">
                  {assignment.complaint.area || "-"}
                </p>
              </div>
            </div>

            <div className="h-4" />

            <div className="bg-gray-100 rounded-md p-3 flex-1">
              <h1 className="text-sm font-normal">{t("officer.description")}</h1>
              <p
                className="text-xs font-semibold text-gray-500"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {assignment.complaint.description}
              </p>
            </div>

            {assignment.complaint.media.length > 0 && (
              <>
                <Divider>{t("officer.problemEvidence")}</Divider>
                <Image.PreviewGroup>
                  <Row gutter={[12, 12]}>
                    {assignment.complaint.media.map((item) => (
                      <Col key={item.id} xs={24} sm={12} md={8}>
                        <Card
                          size="small"
                          style={{ borderRadius: 6, borderLeft: "3px solid #1a3c6e" }}
                          styles={{ body: { padding: 10 } }}
                        >
                          {item.type === "IMAGE" ? (
                            <Image
                              src={item.fileUrl}
                              alt={item.fileUrl.split("/").pop() || "Complaint media"}
                              width="100%"
                              style={{ borderRadius: 4, objectFit: "cover", aspectRatio: "4 / 3" }}
                            />
                          ) : (
                            <a href={item.fileUrl} target="_blank" rel="noreferrer">
                              <Button
                                block
                                style={{ borderColor: "#1a3c6e", color: "#1a3c6e" }}
                              >
                                Open File
                              </Button>
                            </a>
                          )}
                          <div style={{ marginTop: 8, fontSize: 11, color: "#6b7280" }}>
                            {item.fileUrl.split("/").pop()}
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Image.PreviewGroup>
              </>
            )}

            {sortedResponses.length > 0 && (
              <>
                <Divider>Previous Responses</Divider>
                {sortedResponses.map((response) => (
                  <Card
                    key={response.id}
                    size="small"
                    style={{ marginBottom: 10 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <strong>{assignment.officer.name}</strong>
                      <span
                        style={{
                          color: RESPONSE_COLORS[response.type] ?? "#111",
                        }}
                      >
                        {formatLabel(response.type)}
                      </span>
                    </div>
                    <div
                      style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}
                    >
                      {new Date(response.createdAt).toLocaleString()}
                    </div>
                    <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                      {response.message}
                    </div>
                    {response.proofUrl && (
                      <div style={{ marginTop: 8 }}>
                        <a
                          href={response.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t("adminDetail.viewProof")}
                        </a>
                      </div>
                    )}
                  </Card>
                ))}
              </>
            )}

            <Divider>{t("officer.completedTitle")}</Divider>

            {assignment.completedAssignments.length === 0 ? (
              <Empty description={t("officer.completedEmpty")} />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 760,
                  }}
                >
                  <thead>
                    {completedAssignmentsTable.getHeaderGroups().map((headerGroup) => (
                      <tr
                        key={headerGroup.id}
                        style={{ borderBottom: "1px solid #e5e7eb" }}
                      >
                        {headerGroup.headers.map((header) => {
                          const sortingState = header.column.getIsSorted();
                          const sortingLabel =
                            sortingState === "asc"
                              ? " ▲"
                              : sortingState === "desc"
                                ? " ▼"
                                : "";

                          return (
                            <th
                              key={header.id}
                              style={{
                                textAlign: "left",
                                fontSize: 13,
                                color: "#4b5563",
                                fontWeight: 700,
                                padding: "12px 10px",
                                whiteSpace: "nowrap",
                                cursor: header.column.getCanSort() ? "pointer" : "default",
                              }}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                              {sortingLabel}
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {completedAssignmentsTable.getRowModel().rows.map((row) => (
                      <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            style={{
                              padding: "12px 10px",
                              fontSize: 13,
                              color: "#111827",
                              verticalAlign: "top",
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={t("adminDetail.assignOfficer")} style={{ marginBottom: 16 }}>
            <Form layout="vertical" requiredMark={false}>
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
                <div style={{ color: "#1a3c6e", fontWeight: 700, marginTop: 2 }}>
                  {assignment.officer.name}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                  {assignment.officer.department.name}
                </div>
              </div>

              <Form.Item
                label={t("adminDetail.changeOfficer")}
                style={{ marginBottom: 12 }}
              >
                <Select
                  placeholder={t("adminDetail.selectOfficerReassignPlaceholder")}
                  value={officerId || undefined}
                  onChange={(val) => setOfficerId(val)}
                  size="large"
                  style={{ width: "100%" }}
                  options={assignment.availableOfficers.map((officer) => ({
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
                <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
                  {t("adminDetail.assignmentToken")}: {assignedOfficerToken}
                </div>
              )}
            </Form>
          </Card>

          <Card title={t("officer.submitResponse")}>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{ type: "RESOLVED" }}
            >
              <Form.Item
                name="type"
                label={t("officer.responseType")}
                rules={[
                  {
                    required: true,
                    message: t("officer.validation.responseType"),
                  },
                ]}
              >
                <Select
                  options={[
                    {
                      value: "RESOLVED",
                      label: `✅ ${t("officer.type.resolved")}`,
                    },
                    { value: "QUERY", label: `❓ ${t("officer.type.query")}` },
                    {
                      value: "REJECTED",
                      label: `❌ ${t("officer.type.rejected")}`,
                    },
                    {
                      value: "WORK_IN_PROGESS",
                      label: `🛠️ ${t("officer.type.workInProgess")}`,
                    },
                  ]}
                />
              </Form.Item>

              {responseType === "WORK_IN_PROGESS" && (
                <Form.Item
                  name="plannedCompletionDate"
                  label={t("officer.targetDate")}
                  rules={[
                    {
                      required: true,
                      message: t("officer.validation.targetDate"),
                    },
                  ]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    placeholder={t("officer.targetDatePlaceholder")}
                  />
                </Form.Item>
              )}

              <Form.Item
                name="message"
                label={t("officer.responseDetails")}
                rules={[
                  { required: true, message: t("officer.validation.details") },
                  { min: 10, message: t("officer.validation.detailsMin") },
                ]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder={t("officer.responsePlaceholder")}
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item name="proofUrl" label={t("officer.proofOptional")}>
                <Input placeholder="https://..." />
              </Form.Item>

              <Button
                type="primary"
                block
                htmlType="submit"
                loading={submitting}
              >
                {t("officer.submitButton")}
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
