"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Calendar,
  Card,
  Col,
  Empty,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

import { useLanguage } from "@/components/language-provider";
import {
  deriveMeetingStatus,
  MEETING_TYPE_OPTIONS,
  MeetingRecord,
  MeetingStatus,
  MeetingType,
  getMeetingTypeLabel,
} from "@/app/admin/meeting-data";

const { Title, Text } = Typography;

type CalendarMode = "month" | "year";

type ApprovalDraft = {
  meetingDateTime: string;
  meetingPlace: string;
  approvalRemarks: string;
};

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

export default function MeetingSectionPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | undefined>();
  const [typeFilter, setTypeFilter] = useState<MeetingType | undefined>();
  const [search, setSearch] = useState("");
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingRecord | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [calendarValue, setCalendarValue] = useState<Dayjs>(dayjs());
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");
  const [draft, setDraft] = useState<ApprovalDraft>({
    meetingDateTime: "",
    meetingPlace: "",
    approvalRemarks: "",
  });

  useEffect(() => {
    void loadMeetings();
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMeetings() {
    setLoading(true);
    const response = await fetch("/api/meetings");
    const result = await response.json();
    setLoading(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }
    if (!response.ok) {
      setError(result.error ?? t("meetingSection.error.load"));
      return;
    }

    setError("");
    setMeetings(result.meetings ?? []);
  }

  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      const status = deriveMeetingStatus(meeting);
      if (statusFilter && status !== statusFilter) {
        return false;
      }
      if (typeFilter && meeting.type !== typeFilter) {
        return false;
      }
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
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [meetings, search, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const pendingApproval = meetings.filter(
      (item) => deriveMeetingStatus(item) === "PENDING_APPROVAL",
    ).length;
    const approved = meetings.filter(
      (item) => deriveMeetingStatus(item) === "APPROVED",
    ).length;
    const scheduled = meetings.filter(
      (item) => deriveMeetingStatus(item) === "SCHEDULED",
    ).length;
    const completed = meetings.filter(
      (item) => deriveMeetingStatus(item) === "COMPLETED",
    ).length;
    const constituency = meetings.filter(
      (item) => item.type === "CONSTITUENCY_VISIT",
    ).length;
    const department = meetings.filter(
      (item) => item.type === "DEPARTMENT_VISIT",
    ).length;
    const citizen = meetings.filter(
      (item) => item.type === "CITIZEN_MEET",
    ).length;
    const personal = meetings.filter(
      (item) => item.type === "PERSONAL_MEET",
    ).length;
    return {
      all: meetings.length,
      pendingApproval,
      approved,
      scheduled,
      completed,
      constituency,
      department,
      citizen,
      personal,
    };
  }, [meetings]);

  const meetingDates = useMemo(() => {
    return new Set(
      meetings
        .filter((item) => deriveMeetingStatus(item) === "SCHEDULED")
        .map((item) => item.meetingDateTime ?? item.preferredDateTime)
        .filter(Boolean)
        .map((value) => dateKeyFromIso(value as string)),
    );
  }, [meetings]);

  const selectedDateMeetings = useMemo(() => {
    const selectedDateKey = calendarValue.format("YYYY-MM-DD");
    return meetings
      .filter((item) => {
        const value = item.meetingDateTime ?? item.preferredDateTime;
        return dateKeyFromIso(value) === selectedDateKey;
      })
      .filter((item) => deriveMeetingStatus(item) === "SCHEDULED");
  }, [calendarValue, meetings]);

  function openApproval(meeting: MeetingRecord) {
    setSelectedMeeting(meeting);
    setDraft({
      meetingDateTime: meeting.preferredDateTime ?? "",
      meetingPlace: meeting.meetingPlace ?? "",
      approvalRemarks: meeting.approvalRemarks ?? "",
    });
  }

  function closeApproval() {
    setSelectedMeeting(null);
    setDraft({ meetingDateTime: "", meetingPlace: "", approvalRemarks: "" });
  }

  function approveMeeting() {
    if (
      !selectedMeeting ||
      !draft.meetingDateTime ||
      !draft.meetingPlace.trim()
    ) {
      return;
    }

    void (async () => {
      setActionLoadingId(selectedMeeting.id);
      const response = await fetch(
        `/api/meetings/${selectedMeeting.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meetingDateTime: new Date(draft.meetingDateTime).toISOString(),
            meetingPlace: draft.meetingPlace.trim(),
            approvalRemarks: draft.approvalRemarks.trim() || undefined,
          }),
        },
      );
      const result = await response.json();
      setActionLoadingId(null);

      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        setError(result.error ?? t("meetingSection.error.approval"));
        return;
      }

      closeApproval();
      await loadMeetings();
    })();
  }

  async function rejectMeeting(meeting: MeetingRecord) {
    const rejectionRemarks = window
      .prompt(
        t("meetingSection.rejection.prompt"),
        t("meetingSection.rejection.default"),
      )
      ?.trim();
    if (!rejectionRemarks) return;

    setActionLoadingId(meeting.id);
    const response = await fetch(`/api/meetings/${meeting.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejectionRemarks }),
    });
    const result = await response.json();
    setActionLoadingId(null);

    if (response.status === 401) {
      router.push("/login");
      return;
    }
    if (!response.ok) {
      setError(result.error ?? t("meetingSection.error.rejection"));
      return;
    }

    await loadMeetings();
  }

  const columns: TableColumnsType<MeetingRecord> = [
    {
      title: t("meetingSection.col.meeting"),
      key: "meeting",
      render: (_, row) => (
        <div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {getMeetingTypeLabel(row.type)}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: t("meetingSection.col.dateTime"),
      key: "meetingDateTime",
      render: (_, row) =>
        formatDateTime(row.meetingDateTime ?? row.preferredDateTime),
    },
    {
      title: t("meetingSection.col.placeArea"),
      key: "place",
      render: (_, row) =>
        row.meetingPlace ?? row.citizenArea ?? row.contactDepartment ?? "-",
    },
    {
      title: t("meetingSection.col.action"),
      key: "action",
      render: (_, row) => {
        const status = deriveMeetingStatus(row);
        const actions = [
          <Button
            key="view"
            size="small"
            onClick={() => router.push(`/admin/meeting-section/${row.id}`)}
          >
            View
          </Button>,
        ];

        if (row.type === "CITIZEN_MEET" && status === "PENDING_APPROVAL") {
          actions.push(
            <Button
              key="approve"
              size="small"
              type="primary"
              loading={actionLoadingId === row.id}
              onClick={() => openApproval(row)}
              style={{ background: "#1a3c6e", borderColor: "#1a3c6e" }}
            >
              {t("meetingSection.action.approve")}
            </Button>,
          );
          actions.push(
            <Button
              key="reject"
              size="small"
              danger
              loading={actionLoadingId === row.id}
              onClick={() => void rejectMeeting(row)}
            >
              {t("meetingSection.action.reject")}
            </Button>,
          );
          return <Space wrap>{actions}</Space>;
        }

        // if (status === "SCHEDULED" || status === "APPROVED") {
        //   actions.push(
        //     <Button
        //       key="complete"
        //       size="small"
        //       loading={actionLoadingId === row.id}
        //       onClick={() => void completeMeeting(row)}
        //     >
        //       {t("meetingSection.action.complete")}
        //     </Button>,
        //   );
        //   return <Space wrap>{actions}</Space>;
        // }

        return <Space wrap>{actions}</Space>;
      },
    },
  ];

  const selectedDateColumns: TableColumnsType<MeetingRecord> = [
    {
      title: t("meetingSection.col.meeting"),
      key: "meeting",
      render: (_, row) => (
        <Text type="secondary" style={{ fontSize: 11, whiteSpace: "nowrap" }}>
          {getMeetingTypeLabel(row.type)}
        </Text>
      ),
    },
    {
      title: t("meetingSection.col.personName"),
      key: "personName",
      render: (_, row) => (
        <Text style={{ fontSize: 11, whiteSpace: "nowrap" }}>
          {row.citizenName ?? row.contactName ?? row.assignedToUser.name ?? "-"}
        </Text>
      ),
    },
    {
      title: t("meetingSection.col.time"),
      key: "selectedDateTime",
      render: (_, row) => (
        <Text style={{ fontSize: 11, whiteSpace: "nowrap" }}>
          {formatTime(row.meetingDateTime ?? row.preferredDateTime)}
        </Text>
      ),
    },
  ];

  return (
    <div>
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
            {t("meetingSection.title")}
          </Title>
          <Text type="secondary">{t("meetingSection.subtitle")}</Text>
        </div>
        {/* <Link href="/admin/create-meeting">
          <Button type="primary" style={{ background: "#1a3c6e", borderColor: "#1a3c6e" }}>
            Create Meeting
          </Button>
        </Link> */}
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 20 }}
          title={error}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[
          ["All Meetings", stats.all, "#1a3c6e"],
          ["Constituency Visit", stats.constituency, "#7c3aed"],
          ["Department Visit", stats.department, "#0f766e"],
          ["Citizen Meet", stats.citizen, "#d97706"],
          ["Personal Meet", stats.personal, "#9333ea"],
          ["Pending Approval", stats.pendingApproval, "#f59e0b"],
          ["Approved / Scheduled", stats.approved + stats.scheduled, "#2563eb"],
          ["Completed", stats.completed, "#16a34a"],
        ].map(([title, value, color]) => (
          <Col xs={12} sm={8} lg={6} xl={6} key={String(title)}>
            <Card size="small" style={{ borderTop: `3px solid ${color}` }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {title}
              </Text>
              <Title
                level={3}
                style={{ margin: "6px 0 0", color: String(color) }}
              >
                {Number(value)}
              </Title>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: 8, height: "100%" }}>
            <Calendar
              fullscreen={false}
              value={calendarValue}
              mode={calendarMode}
              onSelect={(value) => {
                setCalendarValue(value);
                if (calendarMode === "year") {
                  setCalendarMode("month");
                }
              }}
              onPanelChange={(value, mode) => {
                setCalendarValue(value);
                setCalendarMode(mode as CalendarMode);
              }}
              headerRender={({ value, onChange }) => {
                const shiftUnit = calendarMode === "month" ? "month" : "year";
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
                        setCalendarMode((currentMode) =>
                          currentMode === "month" ? "year" : "month",
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
                if (info.type !== "date") {
                  return info.originNode;
                }
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
              {t("meetingSection.calendar.selectedTitle")} (
              {calendarValue.format("DD-MM-YYYY")})
            </Title>
            {selectedDateMeetings.length === 0 ? (
              <Empty description={t("meetingSection.calendar.noMeetings")} />
            ) : (
              <Table
                rowKey="id"
                columns={selectedDateColumns}
                dataSource={selectedDateMeetings}
                size="small"
                scroll={{ x: "max-content" }}
                pagination={{ pageSize: 5 }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 8 }}>
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("meetingSection.search.placeholder")}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              allowClear
              value={typeFilter}
              onChange={(value) => setTypeFilter(value)}
              style={{ width: "100%" }}
              placeholder={t("meetingSection.filter.type")}
              options={MEETING_TYPE_OPTIONS}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              allowClear
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              style={{ width: "100%" }}
              placeholder={t("meetingSection.filter.status")}
              options={[
                {
                  label: t("meetingSection.filter.scheduled"),
                  value: "SCHEDULED",
                },
                {
                  label: t("meetingSection.filter.pendingApproval"),
                  value: "PENDING_APPROVAL",
                },
                {
                  label: t("meetingSection.filter.approved"),
                  value: "APPROVED",
                },
                {
                  label: t("meetingSection.filter.completed"),
                  value: "COMPLETED",
                },
                {
                  label: t("meetingSection.filter.rejected"),
                  value: "REJECTED",
                },
              ]}
            />
          </Col>
        </Row>

        {filteredMeetings.length === 0 ? (
          <Empty description={t("meetingSection.empty")} />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredMeetings}
            loading={loading}
            size="small"
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8 }}
          />
        )}
      </Card>

      <Modal
        title={
          selectedMeeting
            ? `${t("meetingSection.action.approve")} #${selectedMeeting.id}`
            : t("meetingSection.modal.title")
        }
        open={Boolean(selectedMeeting)}
        onCancel={closeApproval}
        onOk={approveMeeting}
        confirmLoading={actionLoadingId === selectedMeeting?.id}
        okText={t("meetingSection.modal.approveCta")}
      >
        {selectedMeeting && (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Alert
              type="info"
              showIcon
              message={`Citizen: ${selectedMeeting.citizenName ?? "-"}`}
              description={
                selectedMeeting.citizenDetails ??
                t("meetingSection.modal.noDetails")
              }
            />
            <div>
              <Text strong>{t("meetingSection.modal.confirmedDateTime")}</Text>
              <Input
                type="datetime-local"
                value={
                  draft.meetingDateTime
                    ? draft.meetingDateTime.slice(0, 16)
                    : ""
                }
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    meetingDateTime: event.target.value,
                  }))
                }
                style={{ marginTop: 6 }}
              />
            </div>
            <div>
              <Text strong>{t("meetingSection.modal.meetingPlace")}</Text>
              <Input
                value={draft.meetingPlace}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    meetingPlace: event.target.value,
                  }))
                }
                placeholder={t("meetingSection.modal.meetingPlaceholder")}
                style={{ marginTop: 6 }}
              />
            </div>
            <div>
              <Text strong>{t("meetingSection.modal.approvalRemarks")}</Text>
              <Input.TextArea
                rows={3}
                value={draft.approvalRemarks}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    approvalRemarks: event.target.value,
                  }))
                }
                placeholder={t("meetingSection.modal.remarkPlaceholder")}
                style={{ marginTop: 6 }}
              />
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
}
