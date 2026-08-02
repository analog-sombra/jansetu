"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Row,
  Skeleton,
  Table,
  Tag,
  Typography,
  Empty,
  Modal,
} from "antd";
import { ArrowLeftOutlined, FilePdfOutlined, DownloadOutlined } from "@ant-design/icons";
import { getComplaintsBySubcategoryAction, type SubcategoryGroup, type ComplaintDetail } from "@/actions/mla/getComplaintsBySubcategoryAction";

const { Title, Text } = Typography;

const COMPLAINT_STATUS_COLOR: Record<string, string> = {
  PENDING: "default",
  IN_PROGRESS: "processing",
  RESOLVED: "success",
  REJECTED: "error",
};

const PAGE_COPY = {
  en: {
    back: "Back",
    title: "Complaints by Subcategory",
    loading: "Loading complaints...",
    error: "Error loading complaints",
    empty: "No complaints found",
    subcategory: "Subcategory",
    totalComplaints: "Total Complaints",
    complaintId: "ID",
    category: "Category",
    subcategoryLabel: "Subcategory",
    status: "Status",
    area: "Area",
    citizens: "Affected Citizens",
    date: "Date",
    citizen: "Citizen",
    mobile: "Mobile",
    assignedOfficer: "Assigned Officer",
    noOfficer: "Not Assigned",
    description: "Description",
  },
};

export default function ComplaintsBySubcategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<SubcategoryGroup[]>([]);
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [letterContent, setLetterContent] = useState("");
  const letterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadComplaints() {
      setLoading(true);
      const result = await getComplaintsBySubcategoryAction();
      setLoading(false);

      if (!result.ok) {
        setError(result.error || PAGE_COPY.en.error);
        return;
      }

      // Filter complaints to only show IN_PROGRESS status
      const filteredSubcategories = (result.subcategories || [])
        .map((group) => ({
          ...group,
          complaints: group.complaints.filter((complaint) => complaint.status === "IN_PROGRESS"),
          count: group.complaints.filter((complaint) => complaint.status === "IN_PROGRESS").length,
        }))
        .filter((group) => group.count > 0); // Only show subcategories with IN_PROGRESS complaints

      setSubcategories(filteredSubcategories);
    }

    void loadComplaints();
  }, []);

  const copy = PAGE_COPY.en;

  function generateGroupDraftNotice(groupName: string, complaints: ComplaintDetail[]): string {
    const date = new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const complaintsList = complaints
      .map(
        (complaint) =>
          `${complaint.id}. ${complaint.category} / ${complaint.subcategory} - ${complaint.area} (${complaint.citizenName}, ${complaint.citizenMobile})`
      )
      .join("\n");

    const totalComplaints = complaints.length;
    const affectedCitizens = complaints.reduce((sum, c) => sum + c.affectedCitizensCount, 0);

    return `
Shri Manjinder Singh Sirsa
Minister of Food & Supplies, Industry, Forest & Environment, Government of Delhi- NCT

Date: ${date}

NOTICE FOR ESCALATION AND URGENT ACTION REQUIRED

Subcategory: ${groupName}
Total Complaints: ${totalComplaints}
Total Affected Citizens: ${affectedCitizens}
Status: IN_PROGRESS

TO THE CONCERNED AUTHORITY,

This is to bring to your urgent notice that the above-mentioned group of ${totalComplaints} complaints in the subcategory "${groupName}" are currently marked as IN_PROGRESS. These complaints require immediate attention and resolution.

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

  function openDraftNoticeModal(groupName: string, complaints: ComplaintDetail[]) {
    const letter = generateGroupDraftNotice(groupName, complaints);
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
      <div style={{ padding: 24 }}>
        <Skeleton active />
      </div>
    );
  }

  const tableColumns = [
    {
      title: copy.complaintId,
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a: ComplaintDetail, b: ComplaintDetail) => a.id - b.id,
    },
    {
      title: copy.category,
      dataIndex: "category",
      key: "category",
      width: 120,
    },
    {
      title: copy.status,
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => (
        <Tag color={COMPLAINT_STATUS_COLOR[status] || "default"}>
          {status}
        </Tag>
      ),
    },
    {
      title: copy.area,
      dataIndex: "area",
      key: "area",
      width: 120,
      render: (area: string | null) => area || "N/A",
    },
    {
      title: copy.citizens,
      dataIndex: "affectedCitizensCount",
      key: "affectedCitizensCount",
      width: 100,
      sorter: (a: ComplaintDetail, b: ComplaintDetail) =>
        a.affectedCitizensCount - b.affectedCitizensCount,
    },
    {
      title: copy.citizen,
      dataIndex: "citizenName",
      key: "citizenName",
      width: 140,
    },
    {
      title: copy.mobile,
      dataIndex: "citizenMobile",
      key: "citizenMobile",
      width: 120,
    },
    {
      title: copy.assignedOfficer,
      dataIndex: "assignedOfficers",
      key: "assignedOfficers",
      width: 140,
      render: (officers: string[]) =>
        officers.length > 0 ? officers.join(", ") : copy.noOfficer,
    },
    {
      title: copy.date,
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date: Date) => new Date(date).toLocaleDateString(),
      sorter: (a: ComplaintDetail, b: ComplaintDetail) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

  const expandedColumns = [
    ...tableColumns,
    {
      title: copy.description,
      dataIndex: "description",
      key: "description",
      render: (text: string) => (
        <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 300 }}>
          {text}
        </Text>
      ),
    },
  ];

  const collapseItems = subcategories.map((group) => ({
    key: group.subcategoryName || "uncategorized",
    label: (
      <div>
        <Text strong>{group.subcategoryName || "Uncategorized"}</Text>
        <Tag color="blue" style={{ marginLeft: 12 }}>
          {group.count} {group.count === 1 ? "complaint" : "complaints"}
        </Tag>
      </div>
    ),
    children: (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            size="small"
            icon={<FilePdfOutlined />}
            onClick={() => openDraftNoticeModal(group.subcategoryName || "Uncategorized", group.complaints)}
            style={{
              background: "#dc2626",
              borderColor: "#dc2626",
              fontWeight: 700,
            }}
          >
            DRAFT NOTICE
          </Button>
        </div>
        <Table
          columns={expandedColumns}
          dataSource={group.complaints}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
          scroll={{ x: 1200 }}
        />
      </div>
    ),
  }));

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 0]} align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
          >
            {copy.back}
          </Button>
        </Col>
        <Col>
          <Title level={2} style={{ color: "#1a3c6e", margin: 0 }}>
            {copy.title}
          </Title>
        </Col>
      </Row>

      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginBottom: 20 }}
        />
      )}

      {subcategories.length === 0 ? (
        <Empty description={copy.empty} style={{ marginTop: 48 }} />
      ) : (
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              Total Subcategories: {subcategories.length} | Total Complaints:{" "}
              {subcategories.reduce((sum, group) => sum + group.count, 0)}
            </Text>
          </div>
          <Collapse items={collapseItems} defaultActiveKey={[subcategories[0]?.subcategoryName || "uncategorized"]} />
        </Card>
      )}

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
