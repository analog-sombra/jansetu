"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MEETINGTYPE, INVITATIONSUBTYPE } from "@prisma/client";
import { Alert, Button, Card, Col, Row, Typography, Tag, Skeleton } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

import { useLanguage } from "@/components/provider/language_provider";
import {
  getAdminMeetingDetailAction,
  type AdminMeetingDashboardRecord,
} from "@/actions/admin/meeting";

const { Title, Text } = Typography;

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

const PAGE_COPY = {
  en: {
    title: "Meeting Details",
    back: "Back",
    loading: "Loading...",
    notFound: "Meeting not found",
    error: "Error loading meeting details",
    basicInfo: "Basic Information",
    participantInfo: "Participant Information",
    meetingCategory: "Meeting Category",
    meetingDetails: "Meeting Details",
    approvalInfo: "Approval Information",
    additionalInfo: "Additional Information",
    id: "Meeting ID",
    type: "Meeting Type",
    purpose: "Purpose",
    createdBy: "Created By",
    assignedTo: "Assigned To",
    createdAt: "Created At",
    updatedAt: "Updated At",
    approvalStatus: "Approval Status",
    approvalRemarks: "Approval Remarks",
    approvedAt: "Approved At",
    rejectedAt: "Rejected At",
    completedAt: "Completed At",
    priority: "Priority",
    preferredDateTime: "Preferred Date & Time",
    meetingDateTime: "Confirmed Date & Time",
    meetingPlace: "Meeting Place",
    citizenName: "Citizen Name",
    citizenMobile: "Citizen Mobile",
    citizenArea: "Area",
    citizenDetails: "Citizen Details",
    contactName: "Contact Name",
    contactMobile: "Contact Mobile",
    contactDesignation: "Designation",
    contactDepartment: "Department",
    partyMeetDetails: "Party Office Details",
    selectedStaffNames: "Staff Members",
    invitationSubtype: "Invitation Type",
    typeConstituency: "Constituency Visit",
    typeDepartment: "Department Visit",
    typeCitizen: "Citizen Meet",
    typePersonal: "Personal Meet",
    typeParty: "Party Meet",
    typeOffice: "Office Meet",
    typeInvitation: "Invitation",
    invitationMarriage: "Marriage",
    invitationBirthday: "Birthday",
    invitationFuneral: "Funeral",
    invitationOther: "Other",
  },
  hi: {
    title: "मीटिंग विवरण",
    back: "वापस",
    loading: "लोड हो रहा है...",
    notFound: "मीटिंग नहीं मिली",
    error: "मीटिंग विवरण लोड करने में त्रुटि",
    basicInfo: "बुनियादी जानकारी",
    participantInfo: "प्रतिभागी जानकारी",
    meetingCategory: "मीटिंग श्रेणी",
    meetingDetails: "मीटिंग विवरण",
    approvalInfo: "अनुमोदन जानकारी",
    additionalInfo: "अतिरिक्त जानकारी",
    id: "मीटिंग आईडी",
    type: "मीटिंग प्रकार",
    purpose: "उद्देश्य",
    createdBy: "द्वारा बनाया गया",
    assignedTo: "को असाइन किया गया",
    createdAt: "पर बनाया गया",
    updatedAt: "पर अपडेट किया गया",
    approvalStatus: "अनुमोदन स्थिति",
    approvalRemarks: "अनुमोदन टिप्पणियां",
    approvedAt: "को मंजूरी दी गई",
    rejectedAt: "को अस्वीकार किया गया",
    completedAt: "पूरा हुआ",
    priority: "प्राथमिकता",
    preferredDateTime: "पसंदीदा तारीख और समय",
    meetingDateTime: "पुष्टि की गई तारीख और समय",
    meetingPlace: "मीटिंग स्थान",
    citizenName: "नागरिक का नाम",
    citizenMobile: "नागरिक मोबाइल",
    citizenArea: "क्षेत्र",
    citizenDetails: "नागरिक विवरण",
    contactName: "संपर्क का नाम",
    contactMobile: "संपर्क मोबाइल",
    contactDesignation: "पद",
    contactDepartment: "विभाग",
    partyMeetDetails: "पार्टी कार्यालय विवरण",
    selectedStaffNames: "कर्मचारी सदस्य",
    invitationSubtype: "आमंत्रण प्रकार",
    typeConstituency: "क्षेत्र का दौरा",
    typeDepartment: "विभाग का दौरा",
    typeCitizen: "नागरिक मीटिंग",
    typePersonal: "व्यक्तिगत मीटिंग",
    typeParty: "पार्टी मीटिंग",
    typeOffice: "कार्यालय मीटिंग",
    typeInvitation: "आमंत्रण",
    invitationMarriage: "विवाह",
    invitationBirthday: "जन्मदिन",
    invitationFuneral: "अंतिम संस्कार",
    invitationOther: "अन्य",
  },
  pa: {
    title: "ਮੀਟਿੰਗ ਵੇਰਵੇ",
    back: "ਵਾਪਸ",
    loading: "ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...",
    notFound: "ਮੀਟਿੰਗ ਨਹੀਂ ਮਿਲੀ",
    error: "ਮੀਟਿੰਗ ਵੇਰਵੇ ਲੋਡ ਕਰਨ ਵਿੱਚ ਗਲਤੀ",
    basicInfo: "ਬੁਨਿਆਦੀ ਜਾਣਕਾਰੀ",
    participantInfo: "ਭਾਗੀਦਾਰ ਜਾਣਕਾਰੀ",
    meetingCategory: "ਮੀਟਿੰਗ ਸ਼੍ਰੇਣੀ",
    meetingDetails: "ਮੀਟਿੰਗ ਵੇਰਵੇ",
    approvalInfo: "ਮਨਜ਼ੂਰੀ ਜਾਣਕਾਰੀ",
    additionalInfo: "ਵਾਧੂ ਜਾਣਕਾਰੀ",
    id: "ਮੀਟਿੰਗ ਆਈਡੀ",
    type: "ਮੀਟਿੰਗ ਦੀ ਕਿਸਮ",
    purpose: "ਉਦੇਸ਼",
    createdBy: "ਦੁਆਰਾ ਬਣਾਈ ਗਈ",
    assignedTo: "ਨੂੰ ਨਿਯੁਕਤ ਕੀਤਾ ਗਿਆ",
    createdAt: "ਨੂੰ ਬਣਾਇਆ ਗਿਆ",
    updatedAt: "ਨੂੰ ਅੱਪਡੇਟ ਕੀਤਾ ਗਿਆ",
    approvalStatus: "ਮਨਜ਼ੂਰੀ ਸਥਿਤੀ",
    approvalRemarks: "ਮਨਜ਼ੂਰੀ ਟਿਪਣੀਆਂ",
    approvedAt: "ਨੂੰ ਮਨਜ਼ੂਰ ਕੀਤਾ ਗਿਆ",
    rejectedAt: "ਨੂੰ ਰੱਦ ਕੀਤਾ ਗਿਆ",
    completedAt: "ਮੁਕੰਮਲ ਕੀਤਾ ਗਿਆ",
    priority: "ਤਰਜੀਹ",
    preferredDateTime: "ਪਸੰਦਾਖਤਾ ਤਾਰੀਖ ਅਤੇ ਸਮਾਂ",
    meetingDateTime: "ਪੁਸ਼ਟੀ ਕੀਤੀ ਤਾਰੀਖ ਅਤੇ ਸਮਾਂ",
    meetingPlace: "ਮੀਟਿੰਗ ਸਥਾਨ",
    citizenName: "ਨਾਗਰਿਕ ਦਾ ਨਾਮ",
    citizenMobile: "ਨਾਗਰਿਕ ਮੋਬਾਈਲ",
    citizenArea: "ਖੇਤਰ",
    citizenDetails: "ਨਾਗਰਿਕ ਵੇਰਵੇ",
    contactName: "ਸੰਪਰਕ ਦਾ ਨਾਮ",
    contactMobile: "ਸੰਪਰਕ ਮੋਬਾਈਲ",
    contactDesignation: "ਨਿਯੁਕਤੀ",
    contactDepartment: "ਵਿਭਾਗ",
    partyMeetDetails: "ਪਾਰਟੀ ਆਫਿਸ ਵੇਰਵੇ",
    selectedStaffNames: "ਸਟਾਫ ਮੈਂਬਰ",
    invitationSubtype: "ਸੱਦਾ ਕਿਸਮ",
    typeConstituency: "ਹਲਕਾ ਲਾਹਿਆ",
    typeDepartment: "ਵਿਭਾਗ ਲਾਹਿਆ",
    typeCitizen: "ਨਾਗਰਿਕ ਮੀਟਿੰਗ",
    typePersonal: "ਨਿਜੀ ਮੀਟਿੰਗ",
    typeParty: "ਪਾਰਟੀ ਮੀਟਿੰਗ",
    typeOffice: "ਆਫਿਸ ਮੀਟਿੰਗ",
    typeInvitation: "ਸੱਦਾ",
    invitationMarriage: "ਵਿਆਹ",
    invitationBirthday: "ਜਨਮਦਿਨ",
    invitationFuneral: "ਲੈਂਡਾ",
    invitationOther: "ਹੋਰ",
  },
};

function getMeetingTypeLabel(
  type: MEETINGTYPE,
  copy: typeof PAGE_COPY.en,
): string {
  const labels: Record<MEETINGTYPE, string> = {
    INVITATION: copy.typeInvitation,
    CONSTITUENCY_VISIT: copy.typeConstituency,
    DEPARTMENT_VISIT: copy.typeDepartment,
    CITIZEN_MEET: copy.typeCitizen,
    PERSONAL_MEET: copy.typePersonal,
    PARTY_MEET: copy.typeParty,
    OFFICE_MEET: copy.typeOffice,
  };
  return labels[type] ?? type;
}

function getInvitationSubtypeLabel(
  value: INVITATIONSUBTYPE,
  copy: typeof PAGE_COPY.en,
): string {
  const labels: Record<INVITATIONSUBTYPE, string> = {
    MARRIAGE: copy.invitationMarriage,
    BIRTHDAY: copy.invitationBirthday,
    FUNERAL: copy.invitationFuneral,
    OTHER: copy.invitationOther,
  };
  return labels[value] ?? value;
}

function getApprovalStatusTag(status: string) {
  const colors: Record<string, string> = {
    NOT_REQUIRED: "blue",
    PENDING: "orange",
    APPROVED: "green",
    REJECTED: "red",
  };
  return colors[status] ?? "default";
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <Text strong>{label}:</Text>
      <div style={{ marginTop: 4, color: "#666" }}>
        <Text>{value}</Text>
      </div>
    </div>
  );
}

export default function MeetingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useLanguage();
  const [meeting, setMeeting] = useState<AdminMeetingDashboardRecord | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const meetingId = parseInt(params.id as string, 10);
  const copy = PAGE_COPY.en; // Use English by default or get from language context

  useEffect(() => {
    async function loadMeeting() {
      setLoading(true);
      const result = await getAdminMeetingDetailAction(meetingId);
      setLoading(false);

      if (!result.ok) {
        setError(result.error ?? copy.error);
        return;
      }

      setMeeting(result.meeting);
    }

    void loadMeeting();
  }, [meetingId]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div style={{ padding: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          style={{ marginBottom: 16 }}
        >
          {copy.back}
        </Button>
        <Alert
          type="error"
          showIcon
          message={error || copy.notFound}
          style={{ marginBottom: 20 }}
        />
      </div>
    );
  }

  const isConstituencyVisit = meeting.type === MEETINGTYPE.CONSTITUENCY_VISIT;
  const isDepartmentVisit = meeting.type === MEETINGTYPE.DEPARTMENT_VISIT;
  const isCitizenMeet = meeting.type === MEETINGTYPE.CITIZEN_MEET;
  const isPersonalMeet = meeting.type === MEETINGTYPE.PERSONAL_MEET;
  const isPartyMeet = meeting.type === MEETINGTYPE.PARTY_MEET;
  const isOfficeMeet = meeting.type === MEETINGTYPE.OFFICE_MEET;
  const isInvitation = meeting.type === MEETINGTYPE.INVITATION;

  return (
    <div style={{ padding: 24 }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        style={{ marginBottom: 16 }}
      >
        {copy.back}
      </Button>

      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginBottom: 20 }}
        />
      )}

      <Title level={2} style={{ color: "#1a3c6e", marginBottom: 24 }}>
        {copy.title} #{meeting.id}
      </Title>

      <Row gutter={[16, 16]}>
        {/* Basic Information */}
        <Col xs={24} md={12}>
          <Card title={copy.basicInfo} style={{ borderRadius: 8 }}>
            <DetailField
              label={copy.type}
              value={getMeetingTypeLabel(meeting.type, copy)}
            />
            <DetailField label={copy.purpose} value={meeting.purpose} />
            <DetailField
              label={copy.assignedTo}
              value={`${meeting.assignedToUser.name ?? "N/A"} (${meeting.assignedToUser.mobile})`}
            />
          </Card>
        </Col>

        {/* Meeting Category */}
        <Col xs={24} md={12}>
          <Card title={copy.meetingCategory} style={{ borderRadius: 8 }}>
            {meeting.priority && (
              <div style={{ marginBottom: 12 }}>
                <Text strong>{copy.priority}:</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag>{meeting.priority}</Tag>
                </div>
              </div>
            )}
            {meeting.preferredDateTime && (
              <DetailField
                label={copy.preferredDateTime}
                value={formatDateTime(meeting.preferredDateTime)}
              />
            )}
            {meeting.meetingDateTime && (
              <DetailField
                label={copy.meetingDateTime}
                value={formatDateTime(meeting.meetingDateTime)}
              />
            )}
            {meeting.meetingPlace && (
              <DetailField
                label={copy.meetingPlace}
                value={meeting.meetingPlace}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Participant Information - varies by meeting type */}
      {(isCitizenMeet || isDepartmentVisit || isPersonalMeet) && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Card title={copy.participantInfo} style={{ borderRadius: 8 }}>
              {isCitizenMeet && (
                <>
                  <DetailField
                    label={copy.citizenName}
                    value={meeting.citizenName}
                  />
                  <DetailField
                    label={copy.citizenMobile}
                    value={meeting.citizenMobile}
                  />
                  <DetailField
                    label={copy.citizenArea}
                    value={meeting.citizenArea}
                  />
                  <DetailField
                    label={copy.citizenDetails}
                    value={meeting.citizenDetails}
                  />
                </>
              )}
              {(isDepartmentVisit || isPersonalMeet) && (
                <>
                  <DetailField
                    label={copy.contactName}
                    value={meeting.contactName}
                  />
                  <DetailField
                    label={copy.contactMobile}
                    value={meeting.contactMobile}
                  />
                  <DetailField
                    label={copy.contactDesignation}
                    value={meeting.contactDesignation}
                  />
                  <DetailField
                    label={copy.contactDepartment}
                    value={meeting.contactDepartment}
                  />
                </>
              )}
            </Card>
          </Col>

          {isCitizenMeet && (
            <Col xs={24} md={12}>
              <Card title={copy.approvalInfo} style={{ borderRadius: 8 }}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{copy.approvalStatus}:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag color={getApprovalStatusTag(meeting.approvalStatus)}>
                      {meeting.approvalStatus}
                    </Tag>
                  </div>
                </div>
                {meeting.approvalRemarks && (
                  <DetailField
                    label={copy.approvalRemarks}
                    value={meeting.approvalRemarks}
                  />
                )}
                {meeting.approvedAt && (
                  <DetailField
                    label={copy.approvedAt}
                    value={formatDateTime(meeting.approvedAt)}
                  />
                )}
                {meeting.rejectedAt && (
                  <DetailField
                    label={copy.rejectedAt}
                    value={formatDateTime(meeting.rejectedAt)}
                  />
                )}
                {meeting.completedAt && (
                  <DetailField
                    label={copy.completedAt}
                    value={formatDateTime(meeting.completedAt)}
                  />
                )}
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* Party Meet Details */}
      {isPartyMeet && meeting.partyMeetDetails && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24}>
            <Card title={copy.additionalInfo} style={{ borderRadius: 8 }}>
              <DetailField
                label={copy.partyMeetDetails}
                value={meeting.partyMeetDetails}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Office Meet Details */}
      {isOfficeMeet && meeting.selectedStaffNames && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24}>
            <Card title={copy.additionalInfo} style={{ borderRadius: 8 }}>
              <DetailField
                label={copy.selectedStaffNames}
                value={meeting.selectedStaffNames}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Invitation Details */}
      {isInvitation && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24}>
            <Card title={copy.additionalInfo} style={{ borderRadius: 8 }}>
              {meeting.invitationSubtype && (
                <DetailField
                  label={copy.invitationSubtype}
                  value={getInvitationSubtypeLabel(
                    meeting.invitationSubtype,
                    copy,
                  )}
                />
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
