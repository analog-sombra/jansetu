/* eslint-disable react-hooks/incompatible-library */
"use client";

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
  Input,
  Row,
  Select,
  Skeleton,
} from "antd";
import dayjs from "dayjs";
import { useLanguage } from "@/components/provider/language_provider";
import {
  getOfficerAssignmentByTokenAction,
  type OfficerCompletedAssignmentSummary,
  submitOfficerResponseAction,
  type OfficerAssignmentDetail,
  type SubmitOfficerResponseInput,
} from "@/actions/officer";

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
    ],
    [t],
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
            title={`#${assignment.complaintId} - ${assignment.complaint.category}`}
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
            <div style={{ marginBottom: 8 }}>
              <strong>{t("officer.department")}:</strong>{" "}
              {assignment.officer.department.name}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>{t("officer.category")}:</strong>{" "}
              {assignment.complaint.category}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Subcategory:</strong>{" "}
              {assignment.complaint.subcategory || "N/A"}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>{t("officer.coordinates")}:</strong>{" "}
              {assignment.complaint.lat}, {assignment.complaint.lng}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>{t("officer.targetDate")}:</strong>{" "}
              {assignment.complaint.plannedCompletionDate
                ? new Date(
                    assignment.complaint.plannedCompletionDate,
                  ).toLocaleDateString("en-IN")
                : "-"}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>{t("officer.description")}:</strong>
              <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>
                {assignment.complaint.description}
              </div>
            </div>

            {assignment.complaint.media.length > 0 && (
              <>
                <Divider>{t("officer.problemEvidence")}</Divider>
                {assignment.complaint.media.map((item) => (
                  <div key={item.id} style={{ marginBottom: 8 }}>
                    <a href={item.fileUrl} target="_blank" rel="noreferrer">
                      {item.type} - {item.fileUrl.split("/").pop()}
                    </a>
                  </div>
                ))}
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
