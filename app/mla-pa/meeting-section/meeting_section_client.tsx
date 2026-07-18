"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  INVITATIONSUBTYPE,
  MLAPAMEETINGTYPE,
  ROLE,
} from "@prisma/client";
import {
  Alert,
  Button,
  Calendar,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  DatePicker,
} from "antd";
import type { TableColumnsType } from "antd";
import dayjs, { Dayjs } from "dayjs";

import {
  completeMlaPaMeetingAction,
  deleteMlaPaMeetingAction,
  getMlaPaMeetingsDashboardAction,
  getMlaPaMeetingUsersAction,
  updateMlaPaMeetingAction,
  type MlaPaMeetingUserLite,
} from "@/actions/mla-pa/meeting";
import {
  dateKeyFromIso,
  deriveMlaPaMeetingStatus,
  formatDateTime,
  getInvitationSubtypeLabel,
  getMlaPaMeetingTypeLabel,
  type MlaPaMeetingRecord,
} from "../meeting-data";

const { Title, Text } = Typography;
const DATE_TIME_FORMAT = "DD-MM-YYYY hh:mm A";

type MeetingStatusFilter = "SCHEDULED" | "COMPLETED";

type EditFormValues = {
  mlaUserId: string;
  campHeadUserId: string;
  type: MLAPAMEETINGTYPE;
  invitationSubtype?: INVITATIONSUBTYPE;
  invitationOtherPurpose?: string;
  purpose: string;
  scheduledAt: Dayjs;
  meetingPlace: string;
  giftToCarry?: string;
  selfDraftedLetter?: string;
};

const INVITATION_SUBTYPES: INVITATIONSUBTYPE[] = [
  "MARRIAGE",
  "BIRTHDAY",
  "FUNERAL",
  "OTHER",
];

const ALL_TYPES: MLAPAMEETINGTYPE[] = [
  "INVITATION",
  "CONSTITUENCY_VISIT",
  "CITIZEN_MEET",
  "DEPARTMENT_VISIT",
  "PERSONAL_MEET",
];

export default function MlaPaMeetingSectionClient({
  userRole,
}: {
  userRole: ROLE;
}) {
  const [meetings, setMeetings] = useState<MlaPaMeetingRecord[]>([]);
  const [mlaUsers, setMlaUsers] = useState<MlaPaMeetingUserLite[]>([]);
  const [campHeadUsers, setCampHeadUsers] = useState<MlaPaMeetingUserLite[]>(
    [],
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<MeetingStatusFilter>();
  const [typeFilter, setTypeFilter] = useState<MLAPAMEETINGTYPE>();
  const [search, setSearch] = useState("");
  const [calendarValue, setCalendarValue] = useState<Dayjs>(dayjs());

  const [selectedMeeting, setSelectedMeeting] =
    useState<MlaPaMeetingRecord | null>(null);
  const [editingMeeting, setEditingMeeting] =
    useState<MlaPaMeetingRecord | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [form] = Form.useForm<EditFormValues>();

  const editableByRole = userRole === "MLA_PA";
  const editType = Form.useWatch("type", form);
  const editInvitationSubtype = Form.useWatch("invitationSubtype", form);
  const editIsInvitation = editType === "INVITATION";

  useEffect(() => {
    void loadData();
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true);
    const [meetingResult, usersResult] = await Promise.all([
      getMlaPaMeetingsDashboardAction(),
      getMlaPaMeetingUsersAction(),
    ]);
    setLoading(false);

    if (!meetingResult.ok) {
      setError(meetingResult.error ?? "Unable to load meetings.");
      return;
    }

    if (!usersResult.ok) {
      setError(usersResult.error ?? "Unable to load users.");
      return;
    }

    setError("");
    setMeetings(meetingResult.meetings ?? []);
    setMlaUsers(usersResult.mlaUsers ?? []);
    setCampHeadUsers(usersResult.campHeadUsers ?? []);
  }

  useEffect(() => {
    if (!editIsInvitation) {
      form.setFieldsValue({
        invitationSubtype: undefined,
        invitationOtherPurpose: undefined,
        giftToCarry: undefined,
        selfDraftedLetter: undefined,
      });
    }
  }, [editIsInvitation, form]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      const status = deriveMlaPaMeetingStatus(meeting);
      if (statusFilter && status !== statusFilter) {
        return false;
      }

      if (typeFilter && meeting.type !== typeFilter) {
        return false;
      }

      if (!search.trim()) {
        return true;
      }

      const query = search.toLowerCase();
      const haystack = [
        meeting.purpose,
        meeting.meetingPlace,
        meeting.mlaUser.name,
        meeting.campHeadUser.name,
        meeting.invitationSubtype,
        meeting.invitationOtherPurpose,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [meetings, search, statusFilter, typeFilter]);

  const meetingDateSet = useMemo(() => {
    return new Set(meetings.map((item) => dateKeyFromIso(item.scheduledAt)));
  }, [meetings]);

  const selectedDateMeetings = useMemo(() => {
    const selectedDateKey = calendarValue.format("YYYY-MM-DD");
    return meetings.filter(
      (item) => dateKeyFromIso(item.scheduledAt) === selectedDateKey,
    );
  }, [calendarValue, meetings]);

  function openViewModal(meeting: MlaPaMeetingRecord) {
    setSelectedMeeting(meeting);
    setViewOpen(true);
  }

  function openEditModal(meeting: MlaPaMeetingRecord) {
    if (!editableByRole) {
      setError("Only MLA-PA can edit meetings.");
      return;
    }

    setEditingMeeting(meeting);
    form.setFieldsValue({
      mlaUserId: meeting.mlaUserId,
      campHeadUserId: meeting.campHeadUserId,
      type: meeting.type,
      invitationSubtype: meeting.invitationSubtype ?? undefined,
      invitationOtherPurpose: meeting.invitationOtherPurpose ?? undefined,
      purpose: meeting.purpose,
      scheduledAt: dayjs(meeting.scheduledAt),
      meetingPlace: meeting.meetingPlace,
      giftToCarry: meeting.giftToCarry ?? undefined,
      selfDraftedLetter: meeting.selfDraftedLetter ?? undefined,
    });
    setEditOpen(true);
  }

  async function handleComplete(meeting: MlaPaMeetingRecord) {
    setActionLoadingId(meeting.id);
    const result = await completeMlaPaMeetingAction({ meetingId: meeting.id });
    setActionLoadingId(null);

    if (!result.ok) {
      setError(result.error ?? "Failed to complete meeting.");
      return;
    }

    setError("");
    setMessage("Meeting marked as completed.");
    await loadData();
  }

  async function handleDelete(meeting: MlaPaMeetingRecord) {
    if (!editableByRole) {
      setError("Only MLA-PA can delete meetings.");
      return;
    }

    const confirmed = window.confirm("Delete this meeting?");
    if (!confirmed) {
      return;
    }

    setActionLoadingId(meeting.id);
    const result = await deleteMlaPaMeetingAction({ meetingId: meeting.id });
    setActionLoadingId(null);

    if (!result.ok) {
      setError(result.error ?? "Failed to delete meeting.");
      return;
    }

    setError("");
    setMessage("Meeting deleted successfully.");
    await loadData();
  }

  async function handleEditSubmit(values: EditFormValues) {
    if (!editingMeeting) {
      return;
    }

    setActionLoadingId(editingMeeting.id);
    const result = await updateMlaPaMeetingAction({
      meetingId: editingMeeting.id,
      mlaUserId: values.mlaUserId,
      campHeadUserId: values.campHeadUserId,
      type: values.type,
      invitationSubtype: values.invitationSubtype,
      invitationOtherPurpose: values.invitationOtherPurpose,
      purpose: values.purpose,
      scheduledAt: values.scheduledAt.toISOString(),
      meetingPlace: values.meetingPlace,
      giftToCarry: values.giftToCarry,
      selfDraftedLetter: values.selfDraftedLetter,
    });
    setActionLoadingId(null);

    if (!result.ok) {
      setError(result.error ?? "Failed to update meeting.");
      return;
    }

    setEditOpen(false);
    setEditingMeeting(null);
    setError("");
    setMessage("Meeting updated successfully.");
    await loadData();
  }

  const columns: TableColumnsType<MlaPaMeetingRecord> = [
    {
      title: "Meeting",
      key: "meeting",
      render: (_, row) => (
        <div>
          <Text strong>{getMlaPaMeetingTypeLabel(row.type)}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.invitationSubtype
                ? getInvitationSubtypeLabel(row.invitationSubtype)
                : "-"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "MLA",
      key: "mla",
      render: (_, row) => row.mlaUser.name ?? row.mlaUser.mobile,
    },
    {
      title: "CAMP_HEAD",
      key: "campHead",
      render: (_, row) => row.campHeadUser.name ?? row.campHeadUser.mobile,
    },
    {
      title: "Date & Time",
      key: "scheduledAt",
      render: (_, row) => formatDateTime(row.scheduledAt),
    },
    {
      title: "Status",
      key: "status",
      render: (_, row) => {
        const status = deriveMlaPaMeetingStatus(row);
        return (
          <Tag color={status === "COMPLETED" ? "green" : "blue"}>
            {status}
          </Tag>
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
            <Button size="small" onClick={() => openViewModal(row)}>
              View
            </Button>
            {editableByRole && (
              <Button
                size="small"
                onClick={() => openEditModal(row)}
                disabled={isCompleted}
              >
                Edit
              </Button>
            )}
            {editableByRole && (
              <Button
                size="small"
                danger
                loading={actionLoadingId === row.id}
                onClick={() => void handleDelete(row)}
                disabled={isCompleted}
              >
                Delete
              </Button>
            )}
            {!isCompleted && (
              <Button
                size="small"
                type="primary"
                loading={actionLoadingId === row.id}
                onClick={() => void handleComplete(row)}
                style={{ background: "#1a3c6e", borderColor: "#1a3c6e" }}
              >
                Mark Completed
              </Button>
            )}
          </Space>
        );
      },
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
            MLA Meeting Calendar
          </Title>
          <Text type="secondary">
            Add, edit, view, delete and complete meetings for MLA and CAMP_HEAD.
          </Text>
        </div>
        <Link href="/mla-pa/create-meeting">
          <Button type="primary" style={{ background: "#1a3c6e", borderColor: "#1a3c6e" }}>
            Create Meeting
          </Button>
        </Link>
      </div>

      {error && (
        <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />
      )}
      {message && (
        <Alert
          type="success"
          showIcon
          title={message}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
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
        <Col xs={24} md={8}>
          <Select
            allowClear
            style={{ width: "100%" }}
            placeholder="Filter by type"
            value={typeFilter}
            onChange={(value) => setTypeFilter(value)}
            options={ALL_TYPES.map((value) => ({
              value,
              label: getMlaPaMeetingTypeLabel(value),
            }))}
          />
        </Col>
        <Col xs={24} md={8}>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by purpose, place, MLA or CAMP_HEAD"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Card>
            <Table
              rowKey="id"
              loading={loading}
              dataSource={filteredMeetings}
              columns={columns}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              scroll={{ x: 1080 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card style={{ marginBottom: 16 }}>
            <Calendar
              fullscreen={false}
              value={calendarValue}
              onSelect={(value) => setCalendarValue(value)}
              cellRender={(value) => {
                const hasMeeting = meetingDateSet.has(value.format("YYYY-MM-DD"));
                if (!hasMeeting) {
                  return null;
                }
                return (
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#1a3c6e",
                      margin: "6px auto 0",
                    }}
                  />
                );
              }}
            />
          </Card>

          <Card title={`Meetings on ${calendarValue.format("DD-MM-YYYY")}`}>
            {selectedDateMeetings.length === 0 ? (
              <Empty description="No meetings" />
            ) : (
              <Space direction="vertical" style={{ width: "100%" }}>
                {selectedDateMeetings.map((meeting) => (
                  <Card key={meeting.id} size="small">
                    <Text strong>{getMlaPaMeetingTypeLabel(meeting.type)}</Text>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatDateTime(meeting.scheduledAt)}
                      </Text>
                    </div>
                    <div>
                      <Text style={{ fontSize: 12 }}>{meeting.meetingPlace}</Text>
                    </div>
                  </Card>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="View Meeting"
        open={viewOpen}
        onCancel={() => setViewOpen(false)}
        footer={null}
      >
        {!selectedMeeting ? null : (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Text>
              <strong>Type:</strong> {getMlaPaMeetingTypeLabel(selectedMeeting.type)}
            </Text>
            <Text>
              <strong>Subtype:</strong>{" "}
              {selectedMeeting.invitationSubtype
                ? getInvitationSubtypeLabel(selectedMeeting.invitationSubtype)
                : "-"}
            </Text>
            <Text>
              <strong>MLA:</strong>{" "}
              {selectedMeeting.mlaUser.name ?? selectedMeeting.mlaUser.mobile}
            </Text>
            <Text>
              <strong>CAMP_HEAD:</strong>{" "}
              {selectedMeeting.campHeadUser.name ??
                selectedMeeting.campHeadUser.mobile}
            </Text>
            <Text>
              <strong>Date & Time:</strong> {formatDateTime(selectedMeeting.scheduledAt)}
            </Text>
            <Text>
              <strong>Place:</strong> {selectedMeeting.meetingPlace}
            </Text>
            <Text>
              <strong>Purpose:</strong> {selectedMeeting.purpose}
            </Text>
            <Text>
              <strong>Gift:</strong> {selectedMeeting.giftToCarry ?? "-"}
            </Text>
            <Text>
              <strong>Self Drafted Letter:</strong>{" "}
              {selectedMeeting.selfDraftedLetter ?? "-"}
            </Text>
            <Text>
              <strong>Status:</strong>{" "}
              {deriveMlaPaMeetingStatus(selectedMeeting)}
            </Text>
          </Space>
        )}
      </Modal>

      <Modal
        title="Edit Meeting"
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setEditingMeeting(null);
        }}
        onOk={() => void form.submit()}
        okText="Save"
        confirmLoading={
          !!editingMeeting && actionLoadingId === editingMeeting.id
        }
      >
        <Form<EditFormValues>
          layout="vertical"
          form={form}
          onFinish={(values) => void handleEditSubmit(values)}
        >
          <Row gutter={[12, 8]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="MLA User"
                name="mlaUserId"
                rules={[{ required: true, message: "Select MLA user" }]}
              >
                <Select
                  options={mlaUsers.map((user) => ({
                    value: user.id,
                    label: `${user.name ?? "Unnamed"} (${user.mobile})`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="CAMP_HEAD User"
                name="campHeadUserId"
                rules={[{ required: true, message: "Select CAMP_HEAD user" }]}
              >
                <Select
                  options={campHeadUsers.map((user) => ({
                    value: user.id,
                    label: `${user.name ?? "Unnamed"} (${user.mobile})`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Type"
                name="type"
                rules={[{ required: true, message: "Select type" }]}
              >
                <Select
                  options={ALL_TYPES.map((value) => ({
                    value,
                    label: getMlaPaMeetingTypeLabel(value),
                  }))}
                />
              </Form.Item>
            </Col>

            {editIsInvitation && (
              <>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Invitation Subtype"
                    name="invitationSubtype"
                    rules={[{ required: true, message: "Select subtype" }]}
                  >
                    <Select
                      options={INVITATION_SUBTYPES.map((value) => ({
                        value,
                        label: getInvitationSubtypeLabel(value),
                      }))}
                    />
                  </Form.Item>
                </Col>
                {editInvitationSubtype === "OTHER" && (
                  <Col xs={24}>
                    <Form.Item
                      label="Other Invitation Purpose"
                      name="invitationOtherPurpose"
                      rules={[
                        {
                          required: true,
                          message: "Enter invitation purpose",
                        },
                      ]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                )}
              </>
            )}

            <Col xs={24}>
              <Form.Item
                label="Purpose"
                name="purpose"
                rules={[{ required: true, message: "Enter purpose" }]}
              >
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Date & Time"
                name="scheduledAt"
                rules={[{ required: true, message: "Select date and time" }]}
              >
                <DatePicker
                  showTime={{
                    use12Hours: true,
                    format: "hh:mm A",
                    minuteStep: 5,
                  }}
                  style={{ width: "100%" }}
                  format={DATE_TIME_FORMAT}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Meeting Place"
                name="meetingPlace"
                rules={[{ required: true, message: "Enter place" }]}
              >
                <Input />
              </Form.Item>
            </Col>

            {editIsInvitation && (
              <>
                <Col xs={24}>
                  <Form.Item
                    label="Gift To Carry"
                    name="giftToCarry"
                    rules={[{ required: true, message: "Enter gift details" }]}
                  >
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    label="Self Drafted Letter"
                    name="selfDraftedLetter"
                    rules={[
                      { required: true, message: "Enter drafted letter" },
                    ]}
                  >
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
