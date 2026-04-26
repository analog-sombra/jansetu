"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Button,
  Calendar,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

import {
  deriveMeetingStatus,
  getMeetingStatusColor,
  getMeetingTypeLabel,
  MEETING_TYPE_OPTIONS,
  MeetingRecord,
  MeetingStatus,
  MeetingType,
} from "@/app/admin/meeting-data";

const { Title, Text } = Typography;

type CalendarMode = "month" | "year";

// ── Dummy data ────────────────────────────────────────────────────────────────

const TODAY = dayjs();

function iso(d: Dayjs) {
  return d.toISOString();
}

const ADMIN_USER = {
  id: "admin-1",
  name: "Admin User",
  mobile: "9000000000",
  role: "ADMIN" as const,
};

const DUMMY_MEETINGS: MeetingRecord[] = [
  // ── CONSTITUENCY_VISIT ─────────────────────────────────────────
  {
    id: 1,
    createdByUserId: "admin-1",
    assignedToUserId: "admin-1",
    type: "CONSTITUENCY_VISIT",
    purpose: "Inspection of road repair work in Ward 5",
    meetingDateTime: iso(TODAY.add(2, "day").hour(10).minute(0)),
    meetingPlace: "Ward 5, Near Bus Stand",
    approvalStatus: "NOT_REQUIRED",
    approvedAt: null,
    rejectedAt: null,
    completedAt: null,
    approvalRemarks: null,
    preferredDateTime: null,
    priority: "HIGH",
    citizenName: null,
    citizenMobile: null,
    citizenArea: "Ward 5",
    citizenDetails: null,
    contactName: null,
    contactMobile: null,
    contactDesignation: null,
    contactDepartment: null,
    createdAt: iso(TODAY.subtract(3, "day")),
    updatedAt: iso(TODAY.subtract(1, "day")),
    createdByUser: ADMIN_USER,
    assignedToUser: ADMIN_USER,
  },
  {
    id: 2,
    createdByUserId: "admin-1",
    assignedToUserId: "admin-1",
    type: "CONSTITUENCY_VISIT",
    purpose: "Community awareness camp – drinking water scheme",
    meetingDateTime: iso(TODAY.add(5, "day").hour(9).minute(30)),
    meetingPlace: "Panchayat Ghar, Village Bhinder",
    approvalStatus: "NOT_REQUIRED",
    approvedAt: null,
    rejectedAt: null,
    completedAt: null,
    approvalRemarks: null,
    preferredDateTime: null,
    priority: "MEDIUM",
    citizenName: null,
    citizenMobile: null,
    citizenArea: "Bhinder Village",
    citizenDetails: null,
    contactName: null,
    contactMobile: null,
    contactDesignation: null,
    contactDepartment: null,
    createdAt: iso(TODAY.subtract(5, "day")),
    updatedAt: iso(TODAY.subtract(2, "day")),
    createdByUser: ADMIN_USER,
    assignedToUser: ADMIN_USER,
  },
  {
    id: 3,
    createdByUserId: "admin-1",
    assignedToUserId: "admin-1",
    type: "CONSTITUENCY_VISIT",
    purpose: "Review of street-light installation progress",
    meetingDateTime: null,
    meetingPlace: "Sector 12, Main Market",
    approvalStatus: "NOT_REQUIRED",
    approvedAt: null,
    rejectedAt: null,
    completedAt: iso(TODAY.subtract(1, "day")),
    approvalRemarks: null,
    preferredDateTime: iso(TODAY.subtract(4, "day").hour(11).minute(0)),
    priority: "LOW",
    citizenName: null,
    citizenMobile: null,
    citizenArea: "Sector 12",
    citizenDetails: null,
    contactName: null,
    contactMobile: null,
    contactDesignation: null,
    contactDepartment: null,
    createdAt: iso(TODAY.subtract(10, "day")),
    updatedAt: iso(TODAY.subtract(1, "day")),
    createdByUser: ADMIN_USER,
    assignedToUser: ADMIN_USER,
  },

  // ── DEPARTMENT_VISIT ───────────────────────────────────────────
  {
    id: 4,
    createdByUserId: "admin-1",
    assignedToUserId: "admin-1",
    type: "DEPARTMENT_VISIT",
    purpose: "Coordination meeting with PWD on pending works",
    meetingDateTime: iso(TODAY.add(3, "day").hour(14).minute(0)),
    meetingPlace: "PWD Office, Civil Lines",
    approvalStatus: "NOT_REQUIRED",
    approvedAt: null,
    rejectedAt: null,
    completedAt: null,
    approvalRemarks: null,
    preferredDateTime: null,
    priority: "HIGH",
    citizenName: null,
    citizenMobile: null,
    citizenArea: null,
    citizenDetails: null,
    contactName: "Sh. Harpreet Singh",
    contactMobile: "9812300001",
    contactDesignation: "Executive Engineer",
    contactDepartment: "PWD",
    createdAt: iso(TODAY.subtract(4, "day")),
    updatedAt: iso(TODAY.subtract(1, "day")),
    createdByUser: ADMIN_USER,
    assignedToUser: ADMIN_USER,
  },
  {
    id: 5,
    createdByUserId: "admin-1",
    assignedToUserId: "admin-1",
    type: "DEPARTMENT_VISIT",
    purpose: "Health department review – rural dispensaries",
    meetingDateTime: iso(TODAY.add(7, "day").hour(11).minute(0)),
    meetingPlace: "District Health Office",
    approvalStatus: "NOT_REQUIRED",
    approvedAt: null,
    rejectedAt: null,
    completedAt: null,
    approvalRemarks: null,
    preferredDateTime: null,
    priority: "MEDIUM",
    citizenName: null,
    citizenMobile: null,
    citizenArea: null,
    citizenDetails: null,
    contactName: "Dr. Simrandeep Kaur",
    contactMobile: "9812300002",
    contactDesignation: "CMO",
    contactDepartment: "Health",
    createdAt: iso(TODAY.subtract(6, "day")),
    updatedAt: iso(TODAY.subtract(2, "day")),
    createdByUser: ADMIN_USER,
    assignedToUser: ADMIN_USER,
  },
  {
    id: 6,
    createdByUserId: "admin-1",
    assignedToUserId: "admin-1",
    type: "DEPARTMENT_VISIT",
    purpose: "Education dept – mid-day meal scheme review",
    meetingDateTime: null,
    meetingPlace: "District Education Office",
    approvalStatus: "NOT_REQUIRED",
    approvedAt: null,
    rejectedAt: null,
    completedAt: iso(TODAY.subtract(2, "day")),
    approvalRemarks: null,
    preferredDateTime: iso(TODAY.subtract(5, "day").hour(10).minute(30)),
    priority: "LOW",
    citizenName: null,
    citizenMobile: null,
    citizenArea: null,
    citizenDetails: null,
    contactName: "Sh. Balwinder Kumar",
    contactMobile: "9812300003",
    contactDesignation: "DEO",
    contactDepartment: "Education",
    createdAt: iso(TODAY.subtract(12, "day")),
    updatedAt: iso(TODAY.subtract(2, "day")),
    createdByUser: ADMIN_USER,
    assignedToUser: ADMIN_USER,
  },

  // ── CITIZEN_MEET (needs approval) ──────────────────────────────
  {
    id: 7,
    createdByUserId: "citizen-1",
    assignedToUserId: "admin-1",
    type: "CITIZEN_MEET",
    purpose: "Request to discuss pending water connection",
    meetingDateTime: null,
    meetingPlace: null,
    approvalStatus: "PENDING",
    approvedAt: null,
    rejectedAt: null,
    completedAt: null,
    approvalRemarks: null,
    preferredDateTime: iso(TODAY.add(4, "day").hour(10).minute(0)),
    priority: "MEDIUM",
    citizenName: "Gurpreet Sidhu",
    citizenMobile: "9876543210",
    citizenArea: "Sector 22",
    citizenDetails:
      "Waiting for municipal water connection for 3 months. Need urgent assistance.",
    contactName: null,
    contactMobile: null,
    contactDesignation: null,
    contactDepartment: null,
    createdAt: iso(TODAY.subtract(1, "day")),
    updatedAt: iso(TODAY.subtract(1, "day")),
    createdByUser: {
      id: "citizen-1",
      name: "Gurpreet Sidhu",
      mobile: "9876543210",
      role: "CITIZEN",
    },
    assignedToUser: ADMIN_USER,
  },
  {
    id: 8,
    createdByUserId: "citizen-2",
    assignedToUserId: "admin-1",
    type: "CITIZEN_MEET",
    purpose: "Pension application follow-up",
    meetingDateTime: null,
    meetingPlace: null,
    approvalStatus: "PENDING",
    approvedAt: null,
    rejectedAt: null,
    completedAt: null,
    approvalRemarks: null,
    preferredDateTime: iso(TODAY.add(6, "day").hour(12).minute(0)),
    priority: "HIGH",
    citizenName: "Rajwinder Kaur",
    citizenMobile: "9876543211",
    citizenArea: "Old City",
    citizenDetails:
      "Applied for old-age pension 6 months ago. No update received yet.",
    contactName: null,
    contactMobile: null,
    contactDesignation: null,
    contactDepartment: null,
    createdAt: iso(TODAY.subtract(2, "day")),
    updatedAt: iso(TODAY.subtract(2, "day")),
    createdByUser: {
      id: "citizen-2",
      name: "Rajwinder Kaur",
      mobile: "9876543211",
      role: "CITIZEN",
    },
    assignedToUser: ADMIN_USER,
  },
  {
    id: 9,
    createdByUserId: "citizen-3",
    assignedToUserId: "admin-1",
    type: "CITIZEN_MEET",
    purpose: "Complaint regarding illegal construction near property",
    meetingDateTime: iso(TODAY.add(2, "day").hour(15).minute(0)),
    meetingPlace: "MLA Office",
    approvalStatus: "APPROVED",
    approvedAt: iso(TODAY.subtract(1, "day")),
    rejectedAt: null,
    completedAt: null,
    approvalRemarks: "Meeting approved. Please bring property documents.",
    preferredDateTime: iso(TODAY.add(2, "day").hour(15).minute(0)),
    priority: "URGENT",
    citizenName: "Maninder Pal",
    citizenMobile: "9876543212",
    citizenArea: "Gandhi Nagar",
    citizenDetails:
      "Neighbour has illegally extended boundary wall into my plot.",
    contactName: null,
    contactMobile: null,
    contactDesignation: null,
    contactDepartment: null,
    createdAt: iso(TODAY.subtract(3, "day")),
    updatedAt: iso(TODAY.subtract(1, "day")),
    createdByUser: {
      id: "citizen-3",
      name: "Maninder Pal",
      mobile: "9876543212",
      role: "CITIZEN",
    },
    assignedToUser: ADMIN_USER,
  },
  {
    id: 10,
    createdByUserId: "citizen-4",
    assignedToUserId: "admin-1",
    type: "CITIZEN_MEET",
    purpose: "Request for scholarship certificate",
    meetingDateTime: null,
    meetingPlace: "MLA Office",
    approvalStatus: "REJECTED",
    approvedAt: null,
    rejectedAt: iso(TODAY.subtract(1, "day")),
    completedAt: null,
    approvalRemarks:
      "Please contact the Education department directly for scholarship matters.",
    preferredDateTime: iso(TODAY.add(1, "day").hour(11).minute(0)),
    priority: "LOW",
    citizenName: "Amanjot Brar",
    citizenMobile: "9876543213",
    citizenArea: "Model Town",
    citizenDetails: "Need scholarship certificate for college admission.",
    contactName: null,
    contactMobile: null,
    contactDesignation: null,
    contactDepartment: null,
    createdAt: iso(TODAY.subtract(4, "day")),
    updatedAt: iso(TODAY.subtract(1, "day")),
    createdByUser: {
      id: "citizen-4",
      name: "Amanjot Brar",
      mobile: "9876543213",
      role: "CITIZEN",
    },
    assignedToUser: ADMIN_USER,
  },
  {
    id: 11,
    createdByUserId: "citizen-5",
    assignedToUserId: "admin-1",
    type: "CITIZEN_MEET",
    purpose: "Request for land record correction",
    meetingDateTime: null,
    meetingPlace: "MLA Office",
    approvalStatus: "NOT_REQUIRED",
    approvedAt: null,
    rejectedAt: null,
    completedAt: iso(TODAY.subtract(3, "day")),
    approvalRemarks: null,
    preferredDateTime: iso(TODAY.subtract(5, "day").hour(10).minute(0)),
    priority: "HIGH",
    citizenName: "Sukhwinder Dhaliwal",
    citizenMobile: "9876543214",
    citizenArea: "Rural Area",
    citizenDetails: "Land records show wrong owner name due to clerical error.",
    contactName: null,
    contactMobile: null,
    contactDesignation: null,
    contactDepartment: null,
    createdAt: iso(TODAY.subtract(8, "day")),
    updatedAt: iso(TODAY.subtract(3, "day")),
    createdByUser: {
      id: "citizen-5",
      name: "Sukhwinder Dhaliwal",
      mobile: "9876543214",
      role: "CITIZEN",
    },
    assignedToUser: ADMIN_USER,
  },

  // ── PERSONAL_MEET ──────────────────────────────────────────────
  {
    id: 12,
    createdByUserId: "admin-1",
    assignedToUserId: "admin-1",
    type: "PERSONAL_MEET",
    purpose: "Party coordination meeting",
    meetingDateTime: iso(TODAY.add(5, "day").hour(16).minute(0)),
    meetingPlace: "Party Office, Civil Lines",
    approvalStatus: "NOT_REQUIRED",
    approvedAt: null,
    rejectedAt: null,
    completedAt: null,
    approvalRemarks: null,
    preferredDateTime: null,
    priority: "MEDIUM",
    citizenName: null,
    citizenMobile: null,
    citizenArea: null,
    citizenDetails: null,
    contactName: "Sh. Arvind Sharma",
    contactMobile: "9812300010",
    contactDesignation: "District President",
    contactDepartment: null,
    createdAt: iso(TODAY.subtract(2, "day")),
    updatedAt: iso(TODAY.subtract(1, "day")),
    createdByUser: ADMIN_USER,
    assignedToUser: ADMIN_USER,
  },
  {
    id: 13,
    createdByUserId: "admin-1",
    assignedToUserId: "admin-1",
    type: "PERSONAL_MEET",
    purpose: "Press conference – infrastructure projects",
    meetingDateTime: iso(TODAY.add(3, "day").hour(11).minute(0)),
    meetingPlace: "Press Club, Main Road",
    approvalStatus: "NOT_REQUIRED",
    approvedAt: null,
    rejectedAt: null,
    completedAt: null,
    approvalRemarks: null,
    preferredDateTime: null,
    priority: "HIGH",
    citizenName: null,
    citizenMobile: null,
    citizenArea: null,
    citizenDetails: null,
    contactName: "Ms. Priya Mehta",
    contactMobile: "9812300011",
    contactDesignation: "Press Coordinator",
    contactDepartment: null,
    createdAt: iso(TODAY.subtract(1, "day")),
    updatedAt: iso(TODAY.subtract(1, "day")),
    createdByUser: ADMIN_USER,
    assignedToUser: ADMIN_USER,
  },
  {
    id: 14,
    createdByUserId: "admin-1",
    assignedToUserId: "admin-1",
    type: "PERSONAL_MEET",
    purpose: "Annual constituency review with senior officials",
    meetingDateTime: null,
    meetingPlace: "Collectorate",
    approvalStatus: "NOT_REQUIRED",
    approvedAt: null,
    rejectedAt: null,
    completedAt: iso(TODAY.subtract(5, "day")),
    approvalRemarks: null,
    preferredDateTime: iso(TODAY.subtract(7, "day").hour(10).minute(0)),
    priority: "URGENT",
    citizenName: null,
    citizenMobile: null,
    citizenArea: null,
    citizenDetails: null,
    contactName: "Sh. DC Office",
    contactMobile: "9812300012",
    contactDesignation: "Deputy Commissioner",
    contactDepartment: null,
    createdAt: iso(TODAY.subtract(14, "day")),
    updatedAt: iso(TODAY.subtract(5, "day")),
    createdByUser: ADMIN_USER,
    assignedToUser: ADMIN_USER,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function formatTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function dateKeyFromIso(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MeetingSectionDemoPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | undefined>();
  const [typeFilter, setTypeFilter] = useState<MeetingType | undefined>();
  const [search, setSearch] = useState("");
  const [calendarValue, setCalendarValue] = useState<Dayjs>(dayjs());
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");

  const filteredMeetings = useMemo(() => {
    return DUMMY_MEETINGS.filter((meeting) => {
      const status = deriveMeetingStatus(meeting);
      if (statusFilter && status !== statusFilter) return false;
      if (typeFilter && meeting.type !== typeFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const haystack = [
          meeting.id,
          meeting.assignedToUser.name,
          meeting.purpose,
          meeting.meetingPlace,
          meeting.citizenName,
          meeting.citizenArea,
          meeting.contactName,
          meeting.contactDepartment,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [search, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const pendingApproval = DUMMY_MEETINGS.filter(
      (m) => deriveMeetingStatus(m) === "PENDING_APPROVAL",
    ).length;
    const approved = DUMMY_MEETINGS.filter(
      (m) => deriveMeetingStatus(m) === "APPROVED",
    ).length;
    const scheduled = DUMMY_MEETINGS.filter(
      (m) => deriveMeetingStatus(m) === "SCHEDULED",
    ).length;
    const completed = DUMMY_MEETINGS.filter(
      (m) => deriveMeetingStatus(m) === "COMPLETED",
    ).length;
    return {
      all: DUMMY_MEETINGS.length,
      pendingApproval,
      approved,
      scheduled,
      completed,
      constituency: DUMMY_MEETINGS.filter(
        (m) => m.type === "CONSTITUENCY_VISIT",
      ).length,
      department: DUMMY_MEETINGS.filter((m) => m.type === "DEPARTMENT_VISIT")
        .length,
      citizen: DUMMY_MEETINGS.filter((m) => m.type === "CITIZEN_MEET").length,
      personal: DUMMY_MEETINGS.filter((m) => m.type === "PERSONAL_MEET")
        .length,
    };
  }, []);

  const meetingDates = useMemo(() => {
    return new Set(
      DUMMY_MEETINGS.filter((m) => deriveMeetingStatus(m) === "SCHEDULED")
        .map((m) => m.meetingDateTime ?? m.preferredDateTime)
        .filter(Boolean)
        .map((v) => dateKeyFromIso(v as string)),
    );
  }, []);

  const selectedDateMeetings = useMemo(() => {
    const key = calendarValue.format("YYYY-MM-DD");
    return DUMMY_MEETINGS.filter((m) => {
      const v = m.meetingDateTime ?? m.preferredDateTime;
      return dateKeyFromIso(v) === key;
    }).filter((m) => deriveMeetingStatus(m) === "SCHEDULED");
  }, [calendarValue]);

  const columns: TableColumnsType<MeetingRecord> = [
    {
      title: "Type",
      key: "type",
      render: (_, row) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {getMeetingTypeLabel(row.type)}
        </Text>
      ),
    },
    {
      title: "Purpose",
      key: "purpose",
      render: (_, row) => (
        <Text style={{ fontSize: 13 }}>{row.purpose}</Text>
      ),
    },
    {
      title: "Date & Time",
      key: "dateTime",
      render: (_, row) =>
        formatDateTime(row.meetingDateTime ?? row.preferredDateTime),
    },
    {
      title: "Place / Area",
      key: "place",
      render: (_, row) =>
        row.meetingPlace ?? row.citizenArea ?? row.contactDepartment ?? "-",
    },
    {
      title: "Status",
      key: "status",
      render: (_, row) => {
        const status = deriveMeetingStatus(row);
        return (
          <Tag color={getMeetingStatusColor(status)}>
            {status.replace(/_/g, " ")}
          </Tag>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, row) => (
        <Space>
          <Button
            size="small"
            onClick={() =>
              router.push(`/admin/meeting-section/${row.id}`)
            }
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  const selectedDateColumns: TableColumnsType<MeetingRecord> = [
    {
      title: "Type",
      key: "type",
      render: (_, row) => (
        <Text type="secondary" style={{ fontSize: 11, whiteSpace: "nowrap" }}>
          {getMeetingTypeLabel(row.type)}
        </Text>
      ),
    },
    {
      title: "Person",
      key: "person",
      render: (_, row) => (
        <Text style={{ fontSize: 11, whiteSpace: "nowrap" }}>
          {row.citizenName ?? row.contactName ?? row.assignedToUser.name ?? "-"}
        </Text>
      ),
    },
    {
      title: "Time",
      key: "time",
      render: (_, row) => (
        <Text style={{ fontSize: 11, whiteSpace: "nowrap" }}>
          {formatTime(row.meetingDateTime ?? row.preferredDateTime)}
        </Text>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
            Meeting Section
          </Title>
          <Text type="secondary">
            Demo view — all data is static for preview purposes
          </Text>
        </div>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {(
          [
            ["All Meetings", stats.all, "#1a3c6e"],
            ["Constituency Visit", stats.constituency, "#7c3aed"],
            ["Department Visit", stats.department, "#0f766e"],
            ["Citizen Meet", stats.citizen, "#d97706"],
            ["Personal Meet", stats.personal, "#9333ea"],
            ["Pending Approval", stats.pendingApproval, "#f59e0b"],
            [
              "Approved / Scheduled",
              stats.approved + stats.scheduled,
              "#2563eb",
            ],
            ["Completed", stats.completed, "#16a34a"],
          ] as [string, number, string][]
        ).map(([title, value, color]) => (
          <Col xs={12} sm={8} lg={6} xl={6} key={title}>
            <Card size="small" style={{ borderTop: `3px solid ${color}` }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {title}
              </Text>
              <Title level={3} style={{ margin: "6px 0 0", color }}>
                {value}
              </Title>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Calendar + selected-day meetings */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: 8, height: "100%" }}>
            <Calendar
              fullscreen={false}
              value={calendarValue}
              mode={calendarMode}
              onSelect={(value) => {
                setCalendarValue(value);
                if (calendarMode === "year") setCalendarMode("month");
              }}
              onPanelChange={(value, mode) => {
                setCalendarValue(value);
                setCalendarMode(mode as CalendarMode);
              }}
              headerRender={({ value, onChange }) => {
                const shiftUnit =
                  calendarMode === "month" ? "month" : "year";
                const headerLabel =
                  calendarMode === "month"
                    ? value.format("MMMM YYYY")
                    : value.format("YYYY");
                return (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <Button
                      aria-label="Previous"
                      type="text"
                      icon={<LeftOutlined />}
                      onClick={() => onChange(value.subtract(1, shiftUnit))}
                    />
                    <Button
                      type="text"
                      onClick={() =>
                        setCalendarMode((m) =>
                          m === "month" ? "year" : "month",
                        )
                      }
                      style={{ fontWeight: 600, color: "#1a3c6e" }}
                    >
                      {headerLabel}
                    </Button>
                    <Button
                      aria-label="Next"
                      type="text"
                      icon={<RightOutlined />}
                      onClick={() => onChange(value.add(1, shiftUnit))}
                    />
                  </div>
                );
              }}
              fullCellRender={(current, info) => {
                if (info.type !== "date") return info.originNode;
                const hasMeeting = meetingDates.has(
                  current.format("YYYY-MM-DD"),
                );
                const isSelected = current.isSame(calendarValue, "date");
                return (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      margin: "0 auto",
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: isSelected ? 700 : 400,
                      background: hasMeeting ? "#dbeafe" : "transparent",
                      border: isSelected
                        ? "2px solid #1a3c6e"
                        : "1px solid transparent",
                      color: hasMeeting ? "#1a3c6e" : undefined,
                    }}
                  >
                    {current.date()}
                  </div>
                );
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: 8, height: "100%" }}>
            <Title level={5} style={{ marginTop: 0, color: "#1a3c6e" }}>
              Scheduled on {calendarValue.format("DD-MM-YYYY")}
            </Title>
            {selectedDateMeetings.length === 0 ? (
              <Empty description="No scheduled meetings on this date" />
            ) : (
              <Table
                rowKey="id"
                columns={selectedDateColumns}
                dataSource={selectedDateMeetings}
                pagination={{ pageSize: 5 }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Filters + table */}
      <Card style={{ borderRadius: 8 }}>
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by purpose, person, place…"
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              allowClear
              value={typeFilter}
              onChange={(v) => setTypeFilter(v)}
              style={{ width: "100%" }}
              placeholder="Filter by type"
              options={MEETING_TYPE_OPTIONS}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              allowClear
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              style={{ width: "100%" }}
              placeholder="Filter by status"
              options={[
                { label: "Scheduled", value: "SCHEDULED" },
                { label: "Pending Approval", value: "PENDING_APPROVAL" },
                { label: "Approved", value: "APPROVED" },
                { label: "Completed", value: "COMPLETED" },
                { label: "Rejected", value: "REJECTED" },
              ]}
            />
          </Col>
        </Row>

        {filteredMeetings.length === 0 ? (
          <Empty description="No meetings match the current filters" />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredMeetings}
            pagination={{ pageSize: 8 }}
          />
        )}
      </Card>
    </div>
  );
}
