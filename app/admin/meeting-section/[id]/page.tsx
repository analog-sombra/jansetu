"use client";

import { ReactNode, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, Button, Card, Col, Descriptions, Progress, Row, Skeleton, Space, Table, Typography } from "antd";
import dayjs from "dayjs";
import { deriveMeetingStatus, getMeetingTypeLabel, MeetingRecord } from "@/app/admin/meeting-data";

const { Title, Text } = Typography;

const DEMO_CONSTITUENCY_SUMMARY = [
  {
    key: "roads",
    category: "Roads",
    pending: 12,
    completed: 38,
    latestWork: "Pothole patching completed on main internal roads",
  },
  {
    key: "water",
    category: "Water",
    pending: 7,
    completed: 29,
    latestWork: "Leakage points repaired and two line connections restored",
  },
  {
    key: "sanitation",
    category: "Sanitation",
    pending: 5,
    completed: 41,
    latestWork: "Garbage lifting frequency increased in dense pockets",
  },
  {
    key: "streetlights",
    category: "Streetlights",
    pending: 9,
    completed: 24,
    latestWork: "Dark spots surveyed and damaged poles replaced",
  },
];

const DEMO_CONSTITUENCY_RESOLVED_ISSUES = [
  {
    key: "rw-001",
    category: "Roads",
    problemType: "Pothole Repair",
    area: "Ward 11",
    locality: "Shiv Colony Main Road",
    resolvedOn: "2026-03-12",
    details: "Three deep potholes filled and top surface relaid for smoother traffic movement.",
  },
  {
    key: "rw-002",
    category: "Roads",
    problemType: "Broken Drain Cover",
    area: "Ward 11",
    locality: "Near Govt School Lane",
    resolvedOn: "2026-03-18",
    details: "Damaged drain slab replaced with reinforced concrete cover.",
  },
  {
    key: "wt-001",
    category: "Water",
    problemType: "Pipeline Leakage",
    area: "Ward 7",
    locality: "Azad Nagar Block B",
    resolvedOn: "2026-02-28",
    details: "Leak point sealed and old connector replaced to restore normal pressure.",
  },
  {
    key: "wt-002",
    category: "Water",
    problemType: "Low Water Pressure",
    area: "Ward 7",
    locality: "Railway Colony",
    resolvedOn: "2026-03-05",
    details: "Valve balancing completed and booster timings adjusted for evening supply.",
  },
  {
    key: "wt-003",
    category: "Water",
    problemType: "Contaminated Supply",
    area: "Ward 9",
    locality: "Mandi Mohalla",
    resolvedOn: "2026-03-21",
    details: "Temporary bypass provided and affected line flushed with chlorination.",
  },
  {
    key: "sn-001",
    category: "Sanitation",
    problemType: "Garbage Overflow",
    area: "Ward 3",
    locality: "Bus Stand Back Lane",
    resolvedOn: "2026-03-10",
    details: "Bulk waste removed and alternate pickup schedule introduced for market days.",
  },
  {
    key: "sn-002",
    category: "Sanitation",
    problemType: "Open Drain Choke",
    area: "Ward 3",
    locality: "Krishna Gali",
    resolvedOn: "2026-03-19",
    details: "Silt removed and drain slope corrected at two low points.",
  },
  {
    key: "sl-001",
    category: "Streetlights",
    problemType: "Streetlight Not Working",
    area: "Ward 14",
    locality: "Community Park Periphery",
    resolvedOn: "2026-03-02",
    details: "Faulty LED driver replaced and timer setting recalibrated.",
  },
  {
    key: "sl-002",
    category: "Streetlights",
    problemType: "Damaged Pole Wiring",
    area: "Ward 14",
    locality: "Old Grain Market Road",
    resolvedOn: "2026-03-15",
    details: "Exposed cable section replaced and weatherproof insulation added.",
  },
  {
    key: "wt-004",
    category: "Water",
    problemType: "Illegal Connection Complaint",
    area: "Ward 9",
    locality: "Subhash Basti",
    resolvedOn: "2026-03-24",
    details: "Unauthorized tap disconnected and meterized legal connection issued.",
  },
  {
    key: "rw-003",
    category: "Roads",
    problemType: "Shoulder Erosion",
    area: "Ward 6",
    locality: "Canal Service Road",
    resolvedOn: "2026-03-27",
    details: "Road shoulder rebuilt with compacted material and edge stones fixed.",
  },
  {
    key: "sn-003",
    category: "Sanitation",
    problemType: "Public Toilet Maintenance",
    area: "Ward 5",
    locality: "Weekly Market Complex",
    resolvedOn: "2026-03-29",
    details: "Water supply restored, deep cleaning done, and maintenance contractor replaced.",
  },
];

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

export default function MeetingDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isConstituencyVisit = meeting?.type === "CONSTITUENCY_VISIT";
  const totalPending = DEMO_CONSTITUENCY_SUMMARY.reduce((sum, item) => sum + item.pending, 0);
  const totalCompleted = DEMO_CONSTITUENCY_SUMMARY.reduce((sum, item) => sum + item.completed, 0);

  const peopleDetails: Array<{ label: string; value: ReactNode }> = [
    {
      label: "Created By",
      value: `${meeting?.createdByUser.name ?? "-"} (${meeting?.createdByUser.mobile ?? "-"})`,
    },
    {
      label: "Assigned To",
      value: `${meeting?.assignedToUser.name ?? "-"} (${meeting?.assignedToUser.mobile ?? "-"})`,
    },
  ];

  const pushIfPresent = (label: string, value: string | null | undefined) => {
    if (!value) {
      return;
    }
    peopleDetails.push({ label, value });
  };

  if (meeting?.type === "CITIZEN_MEET") {
    pushIfPresent("Citizen Name", meeting.citizenName);
    pushIfPresent("Citizen Mobile", meeting.citizenMobile);
    pushIfPresent("Citizen Area", meeting.citizenArea);
    pushIfPresent("Citizen Details", meeting.citizenDetails);
  }

  if (meeting?.type === "DEPARTMENT_VISIT") {
    pushIfPresent("Contact Name", meeting.contactName);
    pushIfPresent("Contact Mobile", meeting.contactMobile);
    pushIfPresent("Designation", meeting.contactDesignation);
    pushIfPresent("Department", meeting.contactDepartment);
  }

  if (meeting?.type === "CONSTITUENCY_VISIT") {
    pushIfPresent("Citizen Area", meeting.citizenArea);
    pushIfPresent("Area Details", meeting.citizenDetails);
  }

  if (meeting?.type === "PERSONAL_MEET") {
    pushIfPresent("Person Name", meeting.citizenName ?? meeting.contactName);
    pushIfPresent("Person Mobile", meeting.citizenMobile ?? meeting.contactMobile);
    pushIfPresent("Details", meeting.citizenDetails ?? meeting.contactDesignation);
  }

  useEffect(() => {
    async function loadMeeting() {
      setLoading(true);
      const response = await fetch(`/api/meetings/${params.id}`);
      const result = await response.json();
      setLoading(false);

      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        setError(result.error ?? "Unable to load meeting details");
        return;
      }

      setError("");
      setMeeting(result.meeting ?? null);
    }

    void loadMeeting();
  }, [params.id, router]);

  if (loading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  if (error) {
    return <Alert type="error" showIcon title={error} />;
  }

  if (!meeting) {
    return <Alert type="warning" showIcon title="Meeting not found" />;
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => router.push("/admin/meeting-section")}>Back</Button>
        <Title level={4} style={{ margin: 0, color: "#1a3c6e" }}>
          Meeting #{meeting.id}
        </Title>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Meeting Information" style={{ borderRadius: 8 }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Type">{getMeetingTypeLabel(meeting.type)}</Descriptions.Item>
              <Descriptions.Item label="Status">{deriveMeetingStatus(meeting).replaceAll("_", " ")}</Descriptions.Item>
              <Descriptions.Item label="Purpose">{meeting.purpose || "-"}</Descriptions.Item>
              <Descriptions.Item label="Date & Time">
                {formatDateTime(meeting.meetingDateTime ?? meeting.preferredDateTime)}
              </Descriptions.Item>
              <Descriptions.Item label="Meeting Place">{meeting.meetingPlace ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Approval Remarks">{meeting.approvalRemarks ?? "-"}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="People Details" style={{ borderRadius: 8 }}>
            <Descriptions column={1} size="small" bordered>
              {peopleDetails.map((item) => (
                <Descriptions.Item key={item.label} label={item.label}>
                  {item.value}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 8, marginTop: 16 }}>
        <Text type="secondary">
          Timeline: Created {formatDateTime(meeting.createdAt)} | Approved {formatDateTime(meeting.approvedAt)} | Rejected {formatDateTime(meeting.rejectedAt)} | Completed {formatDateTime(meeting.completedAt)}
        </Text>
      </Card>

      {isConstituencyVisit && (
        <>
          <Card
            title="Constituency Area Work Summary"
            style={{ borderRadius: 8, marginTop: 16 }}
          >
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} md={8}>
                <Card size="small" style={{ background: "#f8fafc" }}>
                  <Text type="secondary">Total Complaint Types</Text>
                  <Title level={3} style={{ margin: "8px 0 0", color: "#1a3c6e" }}>
                    4
                  </Title>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" style={{ background: "#fff7e6" }}>
                  <Text type="secondary">Pending Complaints</Text>
                  <Title level={3} style={{ margin: "8px 0 0", color: "#d97706" }}>
                    {totalPending}
                  </Title>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" style={{ background: "#f6ffed" }}>
                  <Text type="secondary">Completed Complaints</Text>
                  <Title level={3} style={{ margin: "8px 0 0", color: "#389e0d" }}>
                    {totalCompleted}
                  </Title>
                </Card>
              </Col>
            </Row>

            <Table
              rowKey="key"
              pagination={false}
              dataSource={DEMO_CONSTITUENCY_SUMMARY}
              columns={[
                {
                  title: "Complaint Type",
                  dataIndex: "category",
                  key: "category",
                },
                {
                  title: "Pending",
                  dataIndex: "pending",
                  key: "pending",
                },
                {
                  title: "Completed",
                  dataIndex: "completed",
                  key: "completed",
                },
                {
                  title: "Progress",
                  key: "progress",
                  render: (_, row) => {
                    const total = row.pending + row.completed;
                    return <Progress percent={Math.round((row.completed / total) * 100)} size="small" showInfo={false} />;
                  },
                },
                {
                  title: "Recent Work Done",
                  dataIndex: "latestWork",
                  key: "latestWork",
                },
              ]}
            />
          </Card>

          <Card
            title="Resolved Problem Details by Area"
            style={{ borderRadius: 8, marginTop: 16 }}
          >
            <Table
              size="small"
              rowKey="key"
              dataSource={DEMO_CONSTITUENCY_RESOLVED_ISSUES}
              scroll={{ x: 1000 }}
              pagination={{ pageSize: 5, showSizeChanger: false }}
              rowClassName={() => "constituency-detail-row"}
              columns={[
                {
                  title: "Complaint Type",
                  dataIndex: "category",
                  key: "category",
                  width: 140,
                  render: (value: string) => <span style={{ fontSize: 12 }}>{value}</span>,
                },
                {
                  title: "Problem",
                  dataIndex: "problemType",
                  key: "problemType",
                  width: 170,
                  render: (value: string) => <span style={{ fontSize: 12 }}>{value}</span>,
                },
                {
                  title: "Area",
                  dataIndex: "area",
                  key: "area",
                  width: 120,
                  render: (value: string) => <span style={{ fontSize: 12 }}>{value}</span>,
                },
                {
                  title: "Location",
                  dataIndex: "locality",
                  key: "locality",
                  width: 220,
                  render: (value: string) => <span style={{ fontSize: 12 }}>{value}</span>,
                },
                {
                  title: "Resolved On",
                  dataIndex: "resolvedOn",
                  key: "resolvedOn",
                  width: 120,
                  onCell: () => ({
                    style: {
                      whiteSpace: "nowrap",
                    },
                  }),
                  render: (value: string) => (
                    <span style={{ fontSize: 12, whiteSpace: "nowrap", display: "inline-block" }}>
                      {dayjs(value).format("DD-MM-YYYY")}
                    </span>
                  ),
                },
                {
                  title: "Resolution Info",
                  dataIndex: "details",
                  key: "details",
                  width: 360,
                  render: (value: string) => (
                    <span style={{ fontSize: 12, whiteSpace: "normal", lineHeight: 1.45 }}>
                      {value}
                    </span>
                  ),
                },
              ]}
            />
          </Card>
        </>
      )}
    </div>
  );
}
