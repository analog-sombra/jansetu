"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Row,
  Typography,
  Tag,
  Skeleton,
  Space,
  Image,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

import {
  formatDateTime,
  getInvitationSubtypeLabel,
  deriveMeetingStatus,
} from "../../../admin/meeting-data";
import { getAdminMeetingDetailAction } from "@/actions/admin/meeting";
import type { AdminMeetingDashboardRecord } from "@/actions/admin/meeting/types";

const { Title, Text } = Typography;

export default function InvitationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = parseInt(params.id as string, 10);

  const [meeting, setMeeting] = useState<AdminMeetingDashboardRecord | null>(
    null,
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMeetingDetail = async () => {
      setLoading(true);
      const result = await getAdminMeetingDetailAction(meetingId);
      setLoading(false);

      if (!result.ok) {
        setError(result.error ?? "Unable to load meeting details.");
        return;
      }

      setError("");
      setMeeting(result.meeting);
    };

    void loadMeetingDetail();
  }, [meetingId]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div style={{ padding: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          style={{ marginBottom: 16 }}
        >
          Back
        </Button>
        <Alert
          type="error"
          showIcon
          title={error || "Meeting not found"}
          message="Unable to load meeting details."
        />
      </div>
    );
  }

  const status = deriveMeetingStatus(meeting);

  return (
    <div style={{ padding: 24 }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        style={{ marginBottom: 16 }}
      >
        Back
      </Button>

      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: "#1a3c6e" }}>
          Invitation Meeting Details
        </Title>
      </div>

      {/* Basic Information */}
      <Card title="Basic Information" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div>
              <Text type="secondary">Meeting ID</Text>
              <div>
                <Text strong>{meeting.id}</Text>
              </div>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div>
              <Text type="secondary">Status</Text>
              <div>
                <Tag color={status === "COMPLETED" ? "green" : "blue"}>
                  {status}
                </Tag>
              </div>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div>
              <Text type="secondary">Invitation Type</Text>
              <div>
                <Text strong>
                  {meeting.invitationSubtype
                    ? getInvitationSubtypeLabel(meeting.invitationSubtype)
                    : "-"}
                </Text>
              </div>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div>
              <Text type="secondary">Created At</Text>
              <div>
                <Text strong>{formatDateTime(meeting.createdAt)}</Text>
              </div>
            </div>
          </Col>
          <Col xs={24}>
            <div>
              <Text type="secondary">Purpose</Text>
              <div>
                <Text>{meeting.purpose || "-"}</Text>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Meeting Information */}
      <Card title="Meeting Information" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div>
              <Text type="secondary">Assigned To</Text>
              <div>
                <Text strong>
                  {meeting.assignedToUser.name ?? meeting.assignedToUser.mobile}
                </Text>
              </div>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div>
              <Text type="secondary">Camp Head</Text>
              <div>
                <Text strong>
                  {meeting.campHeadUser?.name ??
                    meeting.campHeadUser?.mobile ??
                    "-"}
                </Text>
              </div>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div>
              <Text type="secondary">Meeting Date & Time</Text>
              <div>
                <Text strong>{formatDateTime(meeting.meetingDateTime)}</Text>
              </div>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div>
              <Text type="secondary">Meeting Place</Text>
              <div>
                <Text strong>{meeting.meetingPlace || "-"}</Text>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Gifts and Letters */}
      <Card title="Gifts & Documentation" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <div>
              <Text type="secondary">Gift to Carry</Text>
              <div>
                <Text>{meeting.giftToCarry || "-"}</Text>
              </div>
            </div>
          </Col>
          <Col xs={24}>
            <div>
              <Text type="secondary">Self Drafted Letter</Text>
              <div>
                <Text>{meeting.selfDraftedLetter || "-"}</Text>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Participant Information */}
      {(meeting.citizenName ||
        meeting.citizenMobile ||
        meeting.contactName) && (
        <Card title="Participant Information" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            {meeting.citizenName && (
              <Col xs={24} md={12}>
                <div>
                  <Text type="secondary">Citizen Name</Text>
                  <div>
                    <Text>{meeting.citizenName}</Text>
                  </div>
                </div>
              </Col>
            )}
            {meeting.citizenMobile && (
              <Col xs={24} md={12}>
                <div>
                  <Text type="secondary">Citizen Mobile</Text>
                  <div>
                    <Text>{meeting.citizenMobile}</Text>
                  </div>
                </div>
              </Col>
            )}
            {meeting.citizenArea && (
              <Col xs={24} md={12}>
                <div>
                  <Text type="secondary">Area</Text>
                  <div>
                    <Text>{meeting.citizenArea}</Text>
                  </div>
                </div>
              </Col>
            )}
            {meeting.contactName && (
              <Col xs={24} md={12}>
                <div>
                  <Text type="secondary">Contact Name</Text>
                  <div>
                    <Text>{meeting.contactName}</Text>
                  </div>
                </div>
              </Col>
            )}
            {meeting.contactMobile && (
              <Col xs={24} md={12}>
                <div>
                  <Text type="secondary">Contact Mobile</Text>
                  <div>
                    <Text>{meeting.contactMobile}</Text>
                  </div>
                </div>
              </Col>
            )}
            {meeting.contactDesignation && (
              <Col xs={24} md={12}>
                <div>
                  <Text type="secondary">Designation</Text>
                  <div>
                    <Text>{meeting.contactDesignation}</Text>
                  </div>
                </div>
              </Col>
            )}
            {meeting.contactDepartment && (
              <Col xs={24} md={12}>
                <div>
                  <Text type="secondary">Department</Text>
                  <div>
                    <Text>{meeting.contactDepartment}</Text>
                  </div>
                </div>
              </Col>
            )}
          </Row>
        </Card>
      )}

      {/* Approval Information */}
      <Card title="Approval Information" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div>
              <Text type="secondary">Approval Status</Text>
              <div>
                <Text strong>{meeting.approvalStatus}</Text>
              </div>
            </div>
          </Col>
          {meeting.approvedAt && (
            <Col xs={24} md={12}>
              <div>
                <Text type="secondary">Approved At</Text>
                <div>
                  <Text>{formatDateTime(meeting.approvedAt)}</Text>
                </div>
              </div>
            </Col>
          )}
          {meeting.rejectedAt && (
            <Col xs={24} md={12}>
              <div>
                <Text type="secondary">Rejected At</Text>
                <div>
                  <Text>{formatDateTime(meeting.rejectedAt)}</Text>
                </div>
              </div>
            </Col>
          )}
          {meeting.completedAt && (
            <Col xs={24} md={12}>
              <div>
                <Text type="secondary">Completed At</Text>
                <div>
                  <Text>{formatDateTime(meeting.completedAt)}</Text>
                </div>
              </div>
            </Col>
          )}
          {meeting.approvalRemarks && (
            <Col xs={24}>
              <div>
                <Text type="secondary">Approval Remarks</Text>
                <div>
                  <Text>{meeting.approvalRemarks}</Text>
                </div>
              </div>
            </Col>
          )}
        </Row>
      </Card>

      {/* Completion Photo */}
      {meeting.completedAt && meeting.selectedStaffNames && meeting.selectedStaffNames.startsWith("/upload/") && (
        <Card title="Completion Photo" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <div style={{ textAlign: "center" }}>
                <Image
                  src={meeting.selectedStaffNames}
                  alt="Completion Photo"
                  style={{ maxWidth: "100%", maxHeight: 400 }}
                  preview
                />
              </div>
            </Col>
            <Col xs={24}>
              <Text type="secondary">Photo uploaded on: {formatDateTime(meeting.completedAt)}</Text>
            </Col>
          </Row>
        </Card>
      )}

      {/* Action Buttons */}
      <Space style={{ marginTop: 24 }}>
        <Button onClick={() => router.back()}>Back</Button>
      </Space>
    </div>
  );
}
