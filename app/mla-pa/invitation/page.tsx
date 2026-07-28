"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { INVITATIONSUBTYPE } from "@prisma/client";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Input,
  Modal,
  Upload,
  Spin,
} from "antd";
import type { TableColumnsType } from "antd";
import type { UploadFile } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { UploadOutlined } from "@ant-design/icons";

import {
  formatDateTime,
  getInvitationSubtypeLabel,
  deriveMeetingStatus,
} from "../../admin/meeting-data";
import { getAdminMeetingsDashboardAction } from "@/actions/admin/meeting";
import { completeInvitationMeetingAction } from "@/actions/admin/meeting/completeInvitationMeetingAction";
import type { AdminMeetingDashboardRecord } from "@/actions/admin/meeting/types";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const INVITATION_SUBTYPES: INVITATIONSUBTYPE[] = [
  "MARRIAGE",
  "BIRTHDAY",
  "FUNERAL",
  "OTHER",
];

export default function InvitationPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<AdminMeetingDashboardRecord[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [subtypeFilter, setSubtypeFilter] = useState<INVITATIONSUBTYPE>();
  const [statusFilter, setStatusFilter] = useState<"SCHEDULED" | "COMPLETED">();
  const [search, setSearch] = useState("");
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [photoFile, setPhotoFile] = useState<UploadFile | null>(null);
  const [completing, setCompleting] = useState(false);

  const handleViewMeeting = (meetingId: number) => {
    router.push(`/mla-pa/invitation/${meetingId}`);
  };

  const handleCompleteMeeting = (meetingId: number) => {
    setSelectedMeetingId(meetingId);
    setPhotoFile(null);
    setCompleteModalVisible(true);
  };

  const handleUploadComplete = async () => {
    if (!selectedMeetingId) return;

    setCompleting(true);

    try {
      let photoBase64: string | undefined;
      let photoFileName: string | undefined;

      if (photoFile && photoFile.originFileObj) {
        const file = photoFile.originFileObj;
        photoFileName = file.name;

        // Read file as base64
        const reader = new FileReader();
        photoBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // Get only the base64 part
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const result = await completeInvitationMeetingAction(
        selectedMeetingId,
        photoBase64,
        photoFileName,
      );

      setCompleting(false);

      if (!result.ok) {
        setError(result.error || "Failed to complete meeting.");
        setCompleteModalVisible(false);
        return;
      }

      setMessage(result.message || "Meeting completed successfully!");
      setCompleteModalVisible(false);
      setPhotoFile(null);

      // Reload meetings
      const reloadResult = await getAdminMeetingsDashboardAction();
      if (reloadResult.ok) {
        setMeetings(reloadResult.meetings ?? []);
      }
    } catch (err) {
      console.error("Error completing meeting:", err);
      setError("An error occurred while completing the meeting.");
      setCompleting(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const result = await getAdminMeetingsDashboardAction();
      setLoading(false);

      if (!result.ok) {
        setError(result.error ?? "Unable to load meetings.");
        return;
      }

      setError("");
      setMeetings(result.meetings ?? []);
    };

    void loadData();
  }, []);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      // Only show INVITATION type meetings
      if (meeting.type !== "INVITATION") {
        return false;
      }

      // Filter by status
      if (statusFilter) {
        const status = deriveMeetingStatus(meeting);
        if (status !== statusFilter) {
          return false;
        }
      }

      // Filter by invitation subtype
      if (subtypeFilter && meeting.invitationSubtype !== subtypeFilter) {
        return false;
      }

      // Filter by date range
      if (dateRange && dateRange.length === 2) {
        const meetingDate = dayjs(meeting.meetingDateTime);
        const isInRange =
          meetingDate.isAfter(dateRange[0].startOf("day")) &&
          meetingDate.isBefore(dateRange[1].endOf("day"));
        if (!isInRange) {
          return false;
        }
      }

      // Filter by search
      if (!search.trim()) {
        return true;
      }

      const query = search.toLowerCase();
      const haystack = [
        meeting.purpose,
        meeting.meetingPlace,
        meeting.assignedToUser.name,
        meeting.campHeadUser?.name,
        meeting.invitationSubtype,
        meeting.giftToCarry,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [meetings, dateRange, subtypeFilter, statusFilter, search]);

  const columns: TableColumnsType<AdminMeetingDashboardRecord> = [
    {
      title: "Invitation Type",
      key: "invitationType",
      render: (_, row) => (
        <div>
          <Text strong>
            {row.invitationSubtype
              ? getInvitationSubtypeLabel(row.invitationSubtype)
              : "-"}
          </Text>
        </div>
      ),
    },
    {
      title: "Assigned To",
      key: "assignedTo",
      render: (_, row) => row.assignedToUser.name ?? row.assignedToUser.mobile,
    },
    {
      title: "CAMP_HEAD",
      key: "campHead",
      render: (_, row) =>
        row.campHeadUser?.name ?? row.campHeadUser?.mobile ?? "-",
    },
    {
      title: "Date & Time",
      key: "meetingDateTime",
      render: (_, row) => formatDateTime(row.meetingDateTime),
      sorter: (a, b) =>
        new Date(a.meetingDateTime ?? 0).getTime() -
        new Date(b.meetingDateTime ?? 0).getTime(),
    },
    {
      title: "Place",
      key: "place",
      render: (_, row) => row.meetingPlace ?? "-",
    },
    {
      title: "Gift",
      key: "gift",
      render: (_, row) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {row.giftToCarry ? row.giftToCarry.substring(0, 30) + "..." : "-"}
        </Text>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, row) => {
        const status = deriveMeetingStatus(row);
        return (
          <Tag color={status === "COMPLETED" ? "green" : "blue"}>{status}</Tag>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, row) => {
        const isCompleted = !!row.completedAt;
        return (
          <Space wrap>
            <Button 
              size="small" 
              type="primary"
              onClick={() => handleViewMeeting(row.id)}
            >
              View
            </Button>
            {!isCompleted && (
              <Button 
                size="small" 
                type="default"
                onClick={() => handleCompleteMeeting(row.id)}
              >
                Complete
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
            Invitation Meetings
          </Title>
          <Text type="secondary">
            View and manage all invitation-type meetings.
          </Text>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          title={error}
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError("")}
        />
      )}
      {message && (
        <Alert
          type="success"
          showIcon
          title={message}
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setMessage("")}
        />
      )}

      {/* Filters Section */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Date Range Filter</Text>
        </div>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <RangePicker
              style={{ width: "100%" }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
              format="DD-MM-YYYY"
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              allowClear
              style={{ width: "100%" }}
              placeholder="Filter by invitation type"
              value={subtypeFilter}
              onChange={(value) => setSubtypeFilter(value)}
              options={INVITATION_SUBTYPES.map((value) => ({
                value,
                label: getInvitationSubtypeLabel(value),
              }))}
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              allowClear
              style={{ width: "100%" }}
              placeholder="Filter by status"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { value: "SCHEDULED", label: "Scheduled" },
                { value: "COMPLETED", label: "Completed" },
              ]}
            />
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by assignee, CAMP_HEAD, place, purpose, or gift..."
              style={{ width: "100%" }}
            />
          </Col>
          {(dateRange || subtypeFilter || statusFilter || search) && (
            <Col xs={24}>
              <Button
                size="small"
                type="text"
                onClick={() => {
                  setDateRange(null);
                  setSubtypeFilter(undefined);
                  setStatusFilter(undefined);
                  setSearch("");
                }}
              >
                Clear All Filters
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      {/* Meetings Table */}
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredMeetings}
          columns={columns}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty
                description={
                  meetings.length === 0
                    ? "No invitation meetings found"
                    : "No invitation meetings match your filters"
                }
              />
            ),
          }}
        />
      </Card>

      {/* Summary */}
      {filteredMeetings.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <Row gutter={[24, 16]}>
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text type="secondary">Total Invitations</Text>
                <Paragraph
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    margin: "8px 0 0 0",
                  }}
                >
                  {filteredMeetings.length}
                </Paragraph>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text type="secondary">Scheduled</Text>
                <Paragraph
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    margin: "8px 0 0 0",
                    color: "blue",
                  }}
                >
                  {
                    filteredMeetings.filter(
                      (m) => deriveMeetingStatus(m) === "SCHEDULED",
                    ).length
                  }
                </Paragraph>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text type="secondary">Completed</Text>
                <Paragraph
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    margin: "8px 0 0 0",
                    color: "green",
                  }}
                >
                  {
                    filteredMeetings.filter(
                      (m) => deriveMeetingStatus(m) === "COMPLETED",
                    ).length
                  }
                </Paragraph>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text type="secondary">Completion Rate</Text>
                <Paragraph
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    margin: "8px 0 0 0",
                    color: "green",
                  }}
                >
                  {filteredMeetings.length > 0
                    ? Math.round(
                        (filteredMeetings.filter(
                          (m) => deriveMeetingStatus(m) === "COMPLETED",
                        ).length /
                          filteredMeetings.length) *
                          100,
                      )
                    : 0}
                  %
                </Paragraph>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Complete Meeting Modal */}
      <Modal
        title="Complete Meeting"
        open={completeModalVisible}
        onCancel={() => {
          setCompleteModalVisible(false);
          setPhotoFile(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setCompleteModalVisible(false);
              setPhotoFile(null);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={completing}
            onClick={handleUploadComplete}
          >
            Complete & Upload
          </Button>,
        ]}
      >
        <Spin spinning={completing}>
          <div style={{ marginBottom: 16 }}>
            <Text>Upload a photo to mark this meeting as completed:</Text>
          </div>
          <Upload
            maxCount={1}
            accept="image/*"
            listType="picture"
            beforeUpload={() => false}
            onChange={(info) => {
              const file = info.fileList[0];
              setPhotoFile(file || null);
            }}
            fileList={photoFile ? [photoFile] : []}
          >
            <Button icon={<UploadOutlined />}>Select Photo</Button>
          </Upload>
        </Spin>
      </Modal>
    </div>
  );
}

