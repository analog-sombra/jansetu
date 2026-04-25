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
  Row,
  Table,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

import { useLanguage } from "@/components/language-provider";
import {
  deriveMeetingStatus,
  getMeetingTypeLabel,
  MeetingRecord,
} from "@/app/admin/meeting-data";

const { Title, Text } = Typography;

type CalendarMode = "month" | "year";

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

export default function ReportMeetingCalendarPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarValue, setCalendarValue] = useState<Dayjs>(dayjs());
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");

  useEffect(() => {
    void loadMeetings();
  }, []);

  async function loadMeetings() {
    setLoading(true);
    const response = await fetch("/api/report/meetings");
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

  const scheduledMeetings = useMemo(() => {
    return meetings.filter((item) => deriveMeetingStatus(item) === "SCHEDULED");
  }, [meetings]);

  const meetingDates = useMemo(() => {
    return new Set(
      scheduledMeetings
        .map((item) => item.meetingDateTime ?? item.preferredDateTime)
        .filter(Boolean)
        .map((value) => dateKeyFromIso(value as string)),
    );
  }, [scheduledMeetings]);

  const selectedDateMeetings = useMemo(() => {
    const selectedDateKey = calendarValue.format("YYYY-MM-DD");
    return scheduledMeetings.filter((item) => {
      const value = item.meetingDateTime ?? item.preferredDateTime;
      return dateKeyFromIso(value) === selectedDateKey;
    });
  }, [calendarValue, scheduledMeetings]);

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
      title: t("meetingSection.col.placeArea"),
      key: "placeArea",
      render: (_, row) => (
        <Text style={{ fontSize: 11, whiteSpace: "nowrap" }}>
          {row.meetingPlace ?? row.citizenArea ?? row.contactDepartment ?? "-"}
        </Text>
      ),
    },
    {
      title: t("meetingSection.col.time"),
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
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
            Meeting Calendar
          </Title>
          <Text type="secondary">
            Calendar view for people attending meetings and visits.
          </Text>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          title={error}
        />
      )}

      <Row gutter={[16, 16]}>
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

                const hasMeeting = meetingDates.has(current.format("YYYY-MM-DD"));
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
                loading={loading}
                pagination={{ pageSize: 6, showSizeChanger: false }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
