"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Image,
  Row,
  Skeleton,
  Space,
  Steps,
  Tag,
  Typography,
} from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import {
  getCampComplaintDetailAction,
  type CampComplaintDetail,
} from "@/actions/camp";

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "orange",
  IN_PROGRESS: "blue",
  WORK_IN_PROGRESS: "cyan",
  QUERY_RAISED: "volcano",
  RESOLVED: "green",
  REJECTED: "red",
  ESCALATED: "purple",
  AUTO_CLOSED: "default",
};

function isComplaintClosed(status: string) {
  return (
    status === "RESOLVED" || status === "REJECTED" || status === "AUTO_CLOSED"
  );
}

export default function CampComplaintDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [complaint, setComplaint] = useState<CampComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const complaintId = Number(params.id);

  const handlePrint = () => {
    if (complaint) {
      router.push(`/camp/complaints/${complaint.id}/print`);
    }
  };

  useEffect(() => {
    async function loadComplaint() {
      if (!Number.isInteger(complaintId) || complaintId <= 0) {
        setError("Invalid complaint selected.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const result = await getCampComplaintDetailAction(complaintId);

      if (!result.ok) {
        setComplaint(null);
        setError(result.error);
        setLoading(false);
        return;
      }

      setComplaint(result.complaint);
      setLoading(false);
    }

    void loadComplaint();
  }, [complaintId]);

  const allResponses = useMemo(() => {
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

  const workflowState = useMemo(() => {
    if (!complaint) {
      return null;
    }

    const closed = isComplaintClosed(complaint.status);
    const hasAssignment = complaint.assignments.length > 0;
    const hasOfficerResponse = allResponses.length > 0;

    let currentStep = 0;
    let helperText = "Complaint has been filed successfully.";

    if (!hasAssignment) {
      currentStep = 1;
      helperText = "Waiting for officer assignment from admin team.";
    } else if (!closed) {
      currentStep = 2;
      helperText = hasOfficerResponse
        ? `Officer has responded. Current status: ${complaint.status.replaceAll("_", " ")}.`
        : `Assigned to officer. Current status: ${complaint.status.replaceAll("_", " ")}.`;
    } else {
      currentStep = 3;
      helperText = `Complaint closed with status: ${complaint.status.replaceAll("_", " ")}.`;
    }

    return {
      currentStep,
      helperText,
      items: [
        {
          title: "Filed",
          description: "Complaint submitted",
          status: "finish" as const,
        },
        {
          title: "Assigned",
          description: hasAssignment
            ? "Officer assigned"
            : "Awaiting assignment",
          status: hasAssignment
            ? ("finish" as const)
            : currentStep === 1
              ? ("process" as const)
              : ("wait" as const),
        },
        {
          title: "Officer Action",
          description: hasAssignment
            ? hasOfficerResponse
              ? "Officer updates received"
              : "Waiting for officer update"
            : "Blocked until assignment",
          status: closed
            ? ("finish" as const)
            : currentStep === 2
              ? ("process" as const)
              : ("wait" as const),
        },
        {
          title: "Completed",
          description: closed
            ? complaint.status.replaceAll("_", " ")
            : "Not completed yet",
          status: closed
            ? complaint.status === "REJECTED"
              ? ("error" as const)
              : ("finish" as const)
            : ("wait" as const),
        },
      ],
    };
  }, [allResponses.length, complaint]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
            Camp Complaint Detail
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            View complaint progress, evidence, and officer updates
          </Text>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            disabled={!complaint}
            style={{ borderColor: "#1a3c6e", color: "#1a3c6e" }}
          >
            Print / Download PDF
          </Button>
          <Link href="/camp/complaints">
            <Button style={{ borderColor: "#1a3c6e", color: "#1a3c6e" }}>
              Back to Complaints
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          title={error}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {loading && (
        <Card style={{ borderRadius: 8 }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      )}

      {!loading && complaint && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
              <Card
                style={{ borderRadius: 8, borderTop: "3px solid #1a3c6e" }}
                title={
                  <Space align="center">
                    <Text strong style={{ color: "#1a3c6e" }}>
                      #{complaint.id}
                    </Text>
                    <Tag color={STATUS_COLORS[complaint.status] ?? "default"}>
                      {complaint.status.replaceAll("_", " ")}
                    </Tag>
                  </Space>
                }
              >
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12}>
                  <Text type="secondary">Citizen</Text>
                  <div>{complaint.citizen.name}</div>
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">Mobile</Text>
                  <div>{complaint.citizen.mobile}</div>
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">Category</Text>
                  <div>{complaint.category}</div>
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">Subcategory</Text>
                  <div>{complaint.subcategory ?? "-"}</div>
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">Filed On</Text>
                  <div>{new Date(complaint.createdAt).toLocaleString()}</div>
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">Target Date</Text>
                  <div>
                    {complaint.plannedCompletionDate
                      ? new Date(
                          complaint.plannedCompletionDate,
                        ).toLocaleDateString()
                      : "-"}
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">Area</Text>
                  <div>{complaint.area || "-"}</div>
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">Affected Citizens Count</Text>
                  <div>
                    {complaint.cluster
                      ? complaint.cluster.totalAffectedCitizensCount
                      : complaint.affectedCitizensCount}
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">Coordinates</Text>
                  <div>
                    {complaint.lat}, {complaint.lng}
                  </div>
                </Col>
              </Row>

              <Divider style={{ margin: "12px 0" }} />

              <Text strong>Description</Text>
              <div
                style={{
                  marginTop: 6,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.7,
                }}
              >
                {complaint.description}
              </div>

              <Divider style={{ margin: "12px 0" }} />

              <Text strong>Complaint Address</Text>
              <div
                style={{
                  marginTop: 6,
                  lineHeight: 1.7,
                }}
              >
                {complaint.complaintAddress?.trim() || "-"}
              </div>

              {complaint.cluster && (
                <>
                  <Divider
                    plain
                    style={{
                      fontSize: 13,
                      color: "#888",
                      margin: "16px 0 12px",
                    }}
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
                    <div
                      style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}
                    >
                      Cluster Complaint Count:{" "}
                      {complaint.cluster.complaintCount}
                    </div>
                    <div
                      style={{ marginTop: 2, fontSize: 12, color: "#6b7280" }}
                    >
                      Cluster Total Affected Citizens (Including This Complaint):{" "}
                      {complaint.cluster.totalAffectedCitizensCount}
                    </div>
                  </Card>
                </>
              )}

              {complaint.media.length > 0 && (
                <>
                  <Divider
                    plain
                    style={{
                      fontSize: 13,
                      color: "#888",
                      margin: "16px 0 12px",
                    }}
                  >
                    Evidence
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
                            styles={{ body: { padding: 10 } }}
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
                                  Open File
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
            {workflowState && (
              <Card
                title={
                  <span style={{ color: "#1a3c6e", fontWeight: 700 }}>
                    Complaint Progress
                  </span>
                }
                style={{
                  borderRadius: 8,
                  borderTop: "3px solid #1a3c6e",
                  marginBottom: 16,
                }}
                size="small"
              >
                <div
                  style={{
                    marginBottom: 12,
                    padding: 10,
                    background: "#f7f9fc",
                    borderLeft: "3px solid #1a3c6e",
                    borderRadius: 4,
                    fontSize: 12,
                    color: "#4b5563",
                    lineHeight: 1.6,
                  }}
                >
                  {workflowState.helperText}
                </div>
                <Steps
                  orientation="vertical"
                  size="small"
                  current={workflowState.currentStep}
                  items={workflowState.items}
                />
              </Card>
            )}

            <Card
              title={
                <span style={{ color: "#1a3c6e", fontWeight: 700 }}>
                  Officer Updates
                </span>
              }
              style={{ borderRadius: 8, borderTop: "3px solid #1a3c6e" }}
            >
              {allResponses.length === 0 ? (
                <Text type="secondary">No officer responses yet.</Text>
              ) : (
                <Space
                  orientation="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  {allResponses.map((response) => (
                    <Card
                      key={response.id}
                      size="small"
                      style={{
                        borderRadius: 6,
                        borderLeft: "3px solid #1a3c6e",
                      }}
                      styles={{ body: { padding: 10 } }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>
                            {response.officer.name}
                          </div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>
                            {response.officer.designation} -{" "}
                            {response.officer.department.name}
                          </div>
                        </div>
                        <Tag color="blue" style={{ marginRight: 0 }}>
                          {response.type}
                        </Tag>
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 12,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {response.message}
                      </div>
                      {response.proofUrl && (
                        <div style={{ marginTop: 8 }}>
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
                              View Proof
                            </Button>
                          </a>
                        </div>
                      )}
                      <div
                        style={{ marginTop: 8, fontSize: 11, color: "#6b7280" }}
                      >
                        {new Date(response.createdAt).toLocaleString()}
                      </div>
                    </Card>
                  ))}
                </Space>
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
