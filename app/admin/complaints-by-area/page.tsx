"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Skeleton,
  Space,
  Table,
  Tag,
  Alert,
  Collapse,
  Statistic,
  Progress,
  Tabs,
  Modal,
} from "antd";
import { ArrowLeftOutlined, EnvironmentOutlined, FilterOutlined, FilePdfOutlined, DownloadOutlined } from "@ant-design/icons";
import {
  getComplaintsByAreaAction,
  type ComplaintsByAreaGroup,
  getComplaintsBySubcategoryAction,
  type ComplaintsBySubcategoryGroup,
} from "@/actions/admin";
import dayjs from "dayjs";

const statusColors: Record<string, string> = {
  PENDING: "#faad14",
  IN_PROGRESS: "#2563eb",
  RESOLVED: "#16a34a",
  REJECTED: "#dc2626",
  CLOSED: "#0f766e",
  WORK_IN_PROGRESS: "#06b6d4",
  QUERY_RAISED: "#ea580c",
  ESCALATED: "#7c3aed",
  AUTO_CLOSED: "#6b7280",
  WORKS: "#10b981",
};

export default function ComplaintsByAreaPage() {
  const router = useRouter();
  const [groupingType, setGroupingType] = useState<"area" | "subcategory">("area");
  const [complaintsByArea, setComplaintsByArea] = useState<ComplaintsByAreaGroup[]>([]);
  const [complaintsBySubcategory, setComplaintsBySubcategory] = useState<ComplaintsBySubcategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [letterContent, setLetterContent] = useState("");
  const letterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadComplaints = async () => {
      setLoading(true);
      setError(null);
      try {
        const [areaResult, subcategoryResult] = await Promise.all([
          getComplaintsByAreaAction(),
          getComplaintsBySubcategoryAction(),
        ]);

        if (areaResult.ok) {
          // Filter to only show IN_PROGRESS complaints
          const filteredArea = areaResult.data
            .map((group) => ({
              ...group,
              complaints: group.complaints.filter((c) => c.status === "IN_PROGRESS"),
            }))
            .filter((group) => group.complaints.length > 0);
          setComplaintsByArea(filteredArea);
        } else {
          setError(areaResult.error);
        }

        if (subcategoryResult.ok) {
          // Filter to only show IN_PROGRESS complaints
          const filteredSubcategory = subcategoryResult.data
            .map((group) => ({
              ...group,
              complaints: group.complaints.filter((c) => c.status === "IN_PROGRESS"),
            }))
            .filter((group) => group.complaints.length > 0);
          setComplaintsBySubcategory(filteredSubcategory);
        } else if (!areaResult.ok) {
          setError(subcategoryResult.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load complaints");
      } finally {
        setLoading(false);
      }
    };

    loadComplaints();
  }, []);

  const complaintColumns = [
    {
      title: "Complaint ID",
      dataIndex: "id",
      key: "id",
      width: "10%",
      render: (id: number) => `#${id}`,
    },
    ...(groupingType === "subcategory"
      ? [
          {
            title: "Area",
            dataIndex: "area",
            key: "area",
            width: "15%",
            render: (area: string | null) => area || "Unspecified",
          },
        ]
      : [
          {
            title: "Category",
            dataIndex: "category",
            key: "category",
            width: "15%",
          },
          {
            title: "Subcategory",
            dataIndex: "subcategory",
            key: "subcategory",
            width: "15%",
            render: (text: string | null) => text || "-",
          },
        ]),
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "12%",
      render: (status: string) => (
        <Tag color={statusColors[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: "10%",
      render: (priority: number) => (
        <Tag
          color={
            priority >= 75
              ? "red"
              : priority >= 50
                ? "orange"
                : "green"
          }
        >
          {priority}
        </Tag>
      ),
    },
    {
      title: "Citizen",
      key: "citizen",
      width: "20%",
      render: (_: unknown, record: ComplaintsByAreaGroup["complaints"][0] | ComplaintsBySubcategoryGroup["complaints"][0]) => (
        <div>
          <div className="font-medium">{record.user.name || "N/A"}</div>
          <div className="text-xs text-gray-500">{record.user.mobile}</div>
        </div>
      ),
    },
    {
      title: "Filed Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: "18%",
      render: (date: Date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
  ];

  function generateGroupDraftNotice(
    groupName: string,
    groupType: "area" | "subcategory",
    complaints: Array<Record<string, unknown>>
  ): string {
    const date = new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const complaintsList = complaints
      .map(
        (complaint: Record<string, unknown>) =>
          `${complaint.id}. ${complaint.category || "General"} / ${complaint.subcategory || "General"} - ${complaint.area || "Unspecified"} (${(complaint.user as Record<string, unknown>)?.name}, ${(complaint.user as Record<string, unknown>)?.mobile})`
      )
      .join("\n");

    const totalComplaints = complaints.length;
    const affectedCitizens = complaints.reduce((sum, c) => sum + ((c.affectedCitizensCount as number) || 0), 0);

    return `
Shri Manjinder Singh Sirsa
Minister of Food & Supplies, Industry, Forest & Environment, Government of Delhi- NCT

Date: ${date}

NOTICE FOR ESCALATION AND URGENT ACTION REQUIRED

${groupType === "area" ? `Area/Locality: ${groupName}` : `Subcategory: ${groupName}`}
Total Complaints: ${totalComplaints}
Total Affected Citizens: ${affectedCitizens}
Status: IN_PROGRESS

TO THE CONCERNED AUTHORITY,

This is to bring to your urgent notice that the above-mentioned group of ${totalComplaints} complaints ${
      groupType === "area" ? `in the area "${groupName}"` : `in the subcategory "${groupName}"`
    } are currently marked as IN_PROGRESS. These complaints require immediate attention and resolution.

COMPLAINTS INCLUDED IN THIS NOTICE:

${complaintsList}

SUMMARY:
- Total Complaints: ${totalComplaints}
- Total Affected Citizens: ${affectedCitizens}
- Current Status: All IN_PROGRESS
- Categories Covered: Multiple

It is earnestly requested that immediate and concrete action be initiated to resolve these matters at the earliest. The complaints have been escalated to your authority as no satisfactory action has been taken till date.

You are directed to:
1. Prioritize these complaints for immediate resolution
2. Take all necessary steps to address the grievances
3. Ensure completion within the next 7 working days
4. Submit a status report on the resolution taken for each complaint

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

  function openDraftNoticeModal(
    groupName: string,
    groupType: "area" | "subcategory",
    complaints: Array<Record<string, unknown>>
  ) {
    const letter = generateGroupDraftNotice(groupName, groupType, complaints);
    setSelectedGroupName(groupName);
    setLetterContent(letter);
    setNoticeModalVisible(true);
  }

  function downloadLetter() {
    if (!letterContent) return;

    const element = document.createElement("a");
    const file = new Blob([letterContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `complaint_notice_${selectedGroupName}_${new Date().getTime()}.txt`;
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
          <title>Draft Notice - ${selectedGroupName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
            pre { white-space: pre-wrap; word-wrap: break-word; }
          </style>
        </head>
        <body>
          <pre>${letterContent.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  if (loading) {
    return (
      <div className="p-6">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          className="mb-4"
        >
          Back
        </Button>
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        className="mb-4"
      >
        Back
      </Button>

      {error && (
        <Alert
          type="error"
          message="Error"
          description={error}
          closable
          className="mb-4"
        />
      )}

      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <EnvironmentOutlined style={{ fontSize: 20, color: "#1a3c6e" }} />
            <span style={{ color: "#1a3c6e", fontWeight: 700 }}>
              Complaints Analysis
            </span>
          </div>
        }
        className="mb-4"
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: "#666", marginBottom: 0 }}>
            {groupingType === "area"
              ? `Total Areas: ${complaintsByArea.length}`
              : `Total Subcategories: ${complaintsBySubcategory.length}`}{" "}
            | Total Complaints:{" "}
            <strong>
              {groupingType === "area"
                ? complaintsByArea.reduce((sum, g) => sum + g.totalComplaints, 0)
                : complaintsBySubcategory.reduce((sum, g) => sum + g.totalComplaints, 0)}
            </strong>
          </p>
        </div>
      </Card>

      <Tabs
        activeKey={groupingType}
        onChange={(key) => setGroupingType(key as "area" | "subcategory")}
        items={[
          {
            key: "area",
            label: (
              <span>
                <EnvironmentOutlined /> Grouped by Area
              </span>
            ),
            children:
              complaintsByArea.length === 0 ? (
                <Empty description="No complaints found" />
              ) : (
                <Space direction="vertical" style={{ width: "100%" }} size="large">
                  {complaintsByArea.map((group, index) => (
                    <Card
                      key={index}
                      style={{
                        borderRadius: 6,
                        borderLeft: "4px solid #1a3c6e",
                      }}
                    >
                      <Collapse
                        defaultActiveKey={["0"]}
                        items={[
                          {
                            key: String(index),
                            label: (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 16,
                                  width: "100%",
                                }}
                              >
                                <div style={{ fontWeight: 700, color: "#1a3c6e", minWidth: 200 }}>
                                  {group.area}
                                </div>
                                <Row gutter={16} style={{ flex: 1 }}>
                                  <Col>
                                    <Statistic
                                      title="Total Complaints"
                                      value={group.totalComplaints}
                                      valueStyle={{ color: "#1a3c6e", fontSize: 16 }}
                                    />
                                  </Col>
                                  <Col>
                                    <Statistic
                                      title="Resolved"
                                      value={group.resolvedCount}
                                      valueStyle={{ color: "#16a34a", fontSize: 16 }}
                                    />
                                  </Col>
                                  <Col>
                                    <Statistic
                                      title="Pending"
                                      value={group.pendingCount}
                                      valueStyle={{ color: "#faad14", fontSize: 16 }}
                                    />
                                  </Col>
                                  <Col>
                                    <Statistic
                                      title="In Progress"
                                      value={group.inProgressCount}
                                      valueStyle={{ color: "#2563eb", fontSize: 16 }}
                                    />
                                  </Col>
                                  <Col>
                                    <Statistic
                                      title="Avg Priority"
                                      value={group.averagePriority}
                                      valueStyle={{ color: "#e07b00", fontSize: 16 }}
                                    />
                                  </Col>
                                  <Col>
                                    <Statistic
                                      title="Affected Citizens"
                                      value={group.affectedCitizens}
                                      valueStyle={{ color: "#7c3aed", fontSize: 16 }}
                                    />
                                  </Col>
                                </Row>
                              </div>
                            ),
                            children: (
                              <div>
                                <div style={{ marginBottom: 16 }}>
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<FilePdfOutlined />}
                                    onClick={() => openDraftNoticeModal(group.area, "area", group.complaints)}
                                    style={{
                                      background: "#dc2626",
                                      borderColor: "#dc2626",
                                      fontWeight: 700,
                                      marginBottom: 16,
                                    }}
                                  >
                                    DRAFT NOTICE
                                  </Button>
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                                    <div>
                                      <span style={{ color: "#666", fontSize: 12 }}>
                                        Resolution Rate
                                      </span>
                                      <Progress
                                        type="circle"
                                        percent={
                                          group.totalComplaints === 0
                                            ? 0
                                            : Math.round(
                                                (group.resolvedCount / group.totalComplaints) * 100,
                                              )
                                        }
                                        width={60}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <Table
                                  columns={complaintColumns}
                                  dataSource={group.complaints.map((c) => ({
                                    ...c,
                                    key: c.id,
                                  }))}
                                  rowKey="id"
                                  pagination={{ pageSize: 10 }}
                                  size="small"
                                  scroll={{ x: 1000 }}
                                />
                              </div>
                            ),
                          },
                        ]}
                      />
                    </Card>
                  ))}
                </Space>
              ),
          },
          {
            key: "subcategory",
            label: (
              <span>
                <FilterOutlined /> Grouped by Subcategory
              </span>
            ),
            children:
              complaintsBySubcategory.length === 0 ? (
                <Empty description="No complaints found" />
              ) : (
                <Space direction="vertical" style={{ width: "100%" }} size="large">
                  {complaintsBySubcategory.map((group, index) => (
                    <Card
                      key={index}
                      style={{
                        borderRadius: 6,
                        borderLeft: "4px solid #7c3aed",
                      }}
                    >
                      <Collapse
                        defaultActiveKey={["0"]}
                        items={[
                          {
                            key: String(index),
                            label: (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 16,
                                  width: "100%",
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 700, color: "#7c3aed", minWidth: 200 }}>
                                    {group.subcategory}
                                  </div>
                                  <div style={{ fontSize: 12, color: "#666" }}>
                                    Category: {group.category}
                                  </div>
                                </div>
                                <Row gutter={16} style={{ flex: 1 }}>
                                  <Col>
                                    <Statistic
                                      title="Total Complaints"
                                      value={group.totalComplaints}
                                      valueStyle={{ color: "#7c3aed", fontSize: 16 }}
                                    />
                                  </Col>
                                  <Col>
                                    <Statistic
                                      title="Resolved"
                                      value={group.resolvedCount}
                                      valueStyle={{ color: "#16a34a", fontSize: 16 }}
                                    />
                                  </Col>
                                  <Col>
                                    <Statistic
                                      title="Pending"
                                      value={group.pendingCount}
                                      valueStyle={{ color: "#faad14", fontSize: 16 }}
                                    />
                                  </Col>
                                  <Col>
                                    <Statistic
                                      title="In Progress"
                                      value={group.inProgressCount}
                                      valueStyle={{ color: "#2563eb", fontSize: 16 }}
                                    />
                                  </Col>
                                  <Col>
                                    <Statistic
                                      title="Avg Priority"
                                      value={group.averagePriority}
                                      valueStyle={{ color: "#e07b00", fontSize: 16 }}
                                    />
                                  </Col>
                                  <Col>
                                    <Statistic
                                      title="Affected Citizens"
                                      value={group.affectedCitizens}
                                      valueStyle={{ color: "#7c3aed", fontSize: 16 }}
                                    />
                                  </Col>
                                </Row>
                              </div>
                            ),
                            children: (
                              <div>
                                <div style={{ marginBottom: 16 }}>
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<FilePdfOutlined />}
                                    onClick={() => openDraftNoticeModal(group.subcategory, "subcategory", group.complaints)}
                                    style={{
                                      background: "#dc2626",
                                      borderColor: "#dc2626",
                                      fontWeight: 700,
                                      marginBottom: 16,
                                    }}
                                  >
                                    DRAFT NOTICE
                                  </Button>
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                                    <div>
                                      <span style={{ color: "#666", fontSize: 12 }}>
                                        Resolution Rate
                                      </span>
                                      <Progress
                                        type="circle"
                                        percent={
                                          group.totalComplaints === 0
                                            ? 0
                                            : Math.round(
                                                (group.resolvedCount / group.totalComplaints) * 100,
                                              )
                                        }
                                        width={60}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <Table
                                  columns={complaintColumns}
                                  dataSource={group.complaints.map((c) => ({
                                    ...c,
                                    key: c.id,
                                  }))}
                                  rowKey="id"
                                  pagination={{ pageSize: 10 }}
                                  size="small"
                                  scroll={{ x: 1000 }}
                                />
                              </div>
                            ),
                          },
                        ]}
                      />
                    </Card>
                  ))}
                </Space>
              ),
          },
        ]}
      />

      {/* Draft Notice Modal */}
      <Modal
        title={
          <span style={{ color: "#dc2626", fontWeight: 700 }}>
            📋 Draft Notice - {selectedGroupName}
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
        <div
          ref={letterRef}
          style={{
            padding: 24,
            maxHeight: "calc(70vh - 100px)",
            overflow: "auto",
            backgroundColor: "#f9fafb",
            borderRadius: 4,
          }}
        >
          <pre style={{ fontFamily: "Arial, sans-serif", fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
            {letterContent}
          </pre>
        </div>
      </Modal>
    </div>
  );
}
