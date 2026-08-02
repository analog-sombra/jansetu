"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MEETINGTYPE, INVITATIONSUBTYPE } from "@prisma/client";
import {
  Alert,
  Button,
  Card,
  Col,
  Row,
  Typography,
  Tag,
  Skeleton,
  Statistic,
  Table,
} from "antd";
import { ArrowLeftOutlined, DownloadOutlined } from "@ant-design/icons";

import {
  getAdminMeetingDetailAction,
  type AdminMeetingDashboardRecord,
} from "@/actions/admin/meeting";
import {
  getAreaSummaryReportAction,
  type AreaSummaryReport,
  type CategorySummary,
} from "@/actions/admin";

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
    giftToCarry: "Gift to Carry",
    selfDraftedLetter: "Self Drafted Letter",
    downloadLetter: "Download Letter",
    areaSummaryReport: "Area Summary Report",
    totalComplaints: "Total Complaints",
    resolvedComplaints: "Resolved",
    inProgressComplaints: "In Progress",
    pendingComplaints: "Pending",
    rejectedComplaints: "Rejected",
    averageResolutionTime: "Avg Resolution Time",
    days: "Days",
    affectedCitizens: "Affected Citizens",
    averagePriority: "Average Priority",
    categoryWiseBreakdown: "Category-wise Breakdown",
    category: "Category",
    total: "Total",
    resolved: "Resolved",
    inProgress: "In Progress",
    pending: "Pending",
    rejected: "Rejected",
    recentComplaints: "Recent Complaints",
    complaintId: "Complaint ID",
    subcategory: "Subcategory",
    status: "Status",
    officer: "Assigned Officer",
    submittedDate: "Submitted Date",
    loadingReport: "Loading area report...",
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
    giftToCarry: "ले जाने वाली वस्तु",
    selfDraftedLetter: "स्वयं द्वारा तैयार पत्र",
    downloadLetter: "पत्र डाउनलोड करें",
    areaSummaryReport: "क्षेत्र सारांश रिपोर्ट",
    totalComplaints: "कुल शिकायतें",
    resolvedComplaints: "समाधान की गई",
    inProgressComplaints: "प्रगति में",
    pendingComplaints: "लंबित",
    rejectedComplaints: "अस्वीकृत",
    averageResolutionTime: "औसत समाधान समय",
    days: "दिन",
    affectedCitizens: "प्रभावित नागरिक",
    averagePriority: "औसत प्राथमिकता",
    categoryWiseBreakdown: "श्रेणी-वार विभाजन",
    category: "श्रेणी",
    total: "कुल",
    resolved: "समाधान",
    inProgress: "प्रगति में",
    pending: "लंबित",
    rejected: "अस्वीकृत",
    recentComplaints: "हाल की शिकायतें",
    complaintId: "शिकायत आईडी",
    subcategory: "उप-श्रेणी",
    status: "स्थिति",
    officer: "असाइन किया गया अधिकारी",
    submittedDate: "सबमिट किया गया दिनांक",
    loadingReport: "क्षेत्र रिपोर्ट लोड हो रही है...",
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
    giftToCarry: "ਲਿਜਾਣ ਵਾਲਾ ਤੋਹਫਾ",
    selfDraftedLetter: "ਖੁਦ ਲਿਖਿਆ ਗਿਆ ਪੱਤਰ",
    downloadLetter: "ਪੱਤਰ ਡਾਊਨਲੋਡ ਕਰੋ",
    areaSummaryReport: "ਖੇਤਰ ਸਾਰਾਂਸ਼ ਰਿਪੋਰਟ",
    totalComplaints: "ਕੁੱਲ ਸ਼ਿਕਾਇਤਾਂ",
    resolvedComplaints: "ਹੱਲ ਕੀਤੀਆਂ",
    inProgressComplaints: "ਪ੍ਰਗਤੀ ਵਿੱਚ",
    pendingComplaints: "ਲੰਬਿਤ",
    rejectedComplaints: "ਰੱਦ ਕੀਤੀਆਂ",
    averageResolutionTime: "ਔਸਤ ਹੱਲ ਦਾ ਸਮਾਂ",
    days: "ਦਿਨ",
    affectedCitizens: "ਪ੍ਰਭਾਵਿਤ ਨਾਗਰਿਕ",
    averagePriority: "ਔਸਤ ਤਰਜੀਹ",
    categoryWiseBreakdown: "ਸ਼੍ਰੇਣੀ-ਅਨੁਸਾਰ ਬ੍ਰੇਕਡਾਉਨ",
    category: "ਸ਼੍ਰੇਣੀ",
    total: "ਕੁੱਲ",
    resolved: "ਹੱਲ",
    inProgress: "ਪ੍ਰਗਤੀ ਵਿੱਚ",
    pending: "ਲੰਬਿਤ",
    rejected: "ਰੱਦ",
    recentComplaints: "ਹਾਲੀਆ ਸ਼ਿਕਾਇਤਾਂ",
    complaintId: "ਸ਼ਿਕਾਇਤ ID",
    subcategory: "ਉਪ-ਸ਼੍ਰੇਣੀ",
    status: "ਸਥਿਤੀ",
    officer: "ਨਿਯੁਕਤ ਅਫਸਰ",
    submittedDate: "ਜਮ੍ਹਾ ਕੀਤੀ ਤਾਰੀਖ",
    loadingReport: "ਖੇਤਰ ਰਿਪੋਰਟ ਲੋਡ ਹੋ ਰਹੀ ਹੈ...",
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

function downloadLetter(content: string, fileName: string = "letter.txt") {
  const element = document.createElement("a");
  const file = new Blob([content], { type: "text/plain" });
  element.href = URL.createObjectURL(file);
  element.download = fileName;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export default function MeetingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [meeting, setMeeting] = useState<AdminMeetingDashboardRecord | null>(
    null,
  );
  const [areaReport, setAreaReport] = useState<AreaSummaryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState("");

  const meetingId = parseInt(params.id as string, 10);
  const copy = PAGE_COPY.en; // Use English by default or get from language context

  useEffect(() => {
    async function loadMeeting() {
      setLoading(true);
      const result = await getAdminMeetingDetailAction(meetingId);
      setLoading(false);

      if (!result.ok) {
        setError(result.error ?? "Error loading meeting details");
        return;
      }

      setMeeting(result.meeting);

      // Load area report if it's a constituency visit
      if (
        result.meeting.type === MEETINGTYPE.CONSTITUENCY_VISIT &&
        result.meeting.citizenArea
      ) {
        void loadAreaReport(result.meeting.citizenArea);
      }
    }

    async function loadAreaReport(area: string) {
      setReportLoading(true);
      const result = await getAreaSummaryReportAction(area);
      setReportLoading(false);

      if (result.ok) {
        setAreaReport(result.data);
      }
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
    <div style={{ padding: 4 }}>
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
            {copy.title} #{meeting.id}
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
            {isConstituencyVisit && meeting.citizenArea && (
              <DetailField
                label={copy.citizenArea}
                value={meeting.citizenArea}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Area Summary Report - Only for Constituency Visit */}
      {isConstituencyVisit && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24}>
            <Card
              title={copy.areaSummaryReport}
              style={{ borderRadius: 8 }}
              loading={reportLoading}
            >
              {!reportLoading && areaReport && (
                <Row gutter={[16, 16]}>
                  {/* Key Statistics */}
                  <Col xs={24}>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={4}>
                        <div
                          style={{
                            padding: 16,
                            backgroundColor: "#f0f5ff",
                            borderRadius: 8,
                            border: "1px solid #b3d8ff",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              color: "#666",
                              marginBottom: 8,
                            }}
                          >
                            {copy.totalComplaints}
                          </div>
                          <div
                            style={{
                              fontSize: 28,
                              fontWeight: "bold",
                              color: "#1a3c6e",
                            }}
                          >
                            {areaReport.totalComplaints}
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={5}>
                        <div
                          style={{
                            padding: 16,
                            backgroundColor: "#f6ffed",
                            borderRadius: 8,
                            border: "1px solid #b7eb8f",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              color: "#666",
                              marginBottom: 8,
                            }}
                          >
                            {copy.resolvedComplaints}
                          </div>
                          <div
                            style={{
                              fontSize: 28,
                              fontWeight: "bold",
                              color: "#52c41a",
                            }}
                          >
                            {areaReport.resolvedCount} -{" "}
                            {areaReport.totalComplaints}
                          </div>
                          {/* <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                            / {areaReport.totalComplaints}
                          </div> */}
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={5}>
                        <div
                          style={{
                            padding: 16,
                            backgroundColor: "#fffbe6",
                            borderRadius: 8,
                            border: "1px solid #ffe58f",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              color: "#666",
                              marginBottom: 8,
                            }}
                          >
                            {copy.inProgressComplaints}
                          </div>
                          <div
                            style={{
                              fontSize: 28,
                              fontWeight: "bold",
                              color: "#faad14",
                            }}
                          >
                            {areaReport.inProgressCount} -{" "}
                            {areaReport.totalComplaints}
                          </div>
                          {/* <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                            / {areaReport.totalComplaints}
                          </div> */}
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={4}>
                        <div
                          style={{
                            padding: 16,
                            backgroundColor: "#e6f7ff",
                            borderRadius: 8,
                            border: "1px solid #91d5ff",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              color: "#666",
                              marginBottom: 8,
                            }}
                          >
                            {copy.averageResolutionTime}
                          </div>
                          <div
                            style={{
                              fontSize: 28,
                              fontWeight: "bold",
                              color: "#1890ff",
                            }}
                          >
                            {areaReport.averageResolutionDays} - {copy.days}
                          </div>
                          {/* <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                            {copy.days}
                          </div> */}
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={4}>
                        <div
                          style={{
                            padding: 16,
                            backgroundColor: "#f9f0ff",
                            borderRadius: 8,
                            border: "1px solid #ebadf8",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              color: "#666",
                              marginBottom: 8,
                            }}
                          >
                            {copy.affectedCitizens}
                          </div>
                          <div
                            style={{
                              fontSize: 28,
                              fontWeight: "bold",
                              color: "#722ed1",
                            }}
                          >
                            {areaReport.affectedCitizens}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Col>

                  {/* Category-wise Breakdown Table */}
                  {areaReport.categorySummary.length > 0 && (
                    <Col xs={24}>
                      <Card
                        title={copy.categoryWiseBreakdown}
                        size="small"
                        style={{ borderRadius: 4 }}
                      >
                        <Table
                          dataSource={areaReport.categorySummary}
                          columns={[
                            {
                              title: copy.category,
                              dataIndex: "category",
                              key: "category",
                              width: "30%",
                            },
                            {
                              title: copy.total,
                              dataIndex: "count",
                              key: "count",
                              width: "14%",
                              align: "center" as const,
                            },
                            {
                              title: copy.resolved,
                              dataIndex: "resolved",
                              key: "resolved",
                              width: "14%",
                              align: "center" as const,
                              render: (
                                value: number,
                                record: CategorySummary,
                              ) => (
                                <span style={{ color: "#52c41a" }}>
                                  {value} (
                                  {Math.round((value / record.count) * 100)}%)
                                </span>
                              ),
                            },
                            {
                              title: copy.inProgress,
                              dataIndex: "inProgress",
                              key: "inProgress",
                              width: "14%",
                              align: "center" as const,
                              render: (
                                value: number,
                                record: CategorySummary,
                              ) => (
                                <span style={{ color: "#faad14" }}>
                                  {value} (
                                  {Math.round((value / record.count) * 100)}%)
                                </span>
                              ),
                            },
                            {
                              title: copy.pending,
                              dataIndex: "pending",
                              key: "pending",
                              width: "14%",
                              align: "center" as const,
                              render: (
                                value: number,
                                record: CategorySummary,
                              ) => (
                                <span style={{ color: "#ff4d4f" }}>
                                  {value} (
                                  {Math.round((value / record.count) * 100)}%)
                                </span>
                              ),
                            },
                          ]}
                          pagination={false}
                          size="small"
                          rowKey="category"
                        />
                      </Card>
                    </Col>
                  )}

                  {/* Recent Complaints Table */}
                  {areaReport.recentComplaints.length > 0 && (
                    <Col xs={24}>
                      <Card
                        title={copy.recentComplaints}
                        size="small"
                        style={{ borderRadius: 4 }}
                      >
                        <Table
                          dataSource={areaReport.recentComplaints}
                          columns={[
                            {
                              title: copy.complaintId,
                              dataIndex: "id",
                              key: "id",
                              width: "10%",
                            },
                            {
                              title: copy.category,
                              dataIndex: "category",
                              key: "category",
                              width: "15%",
                            },
                            {
                              title: copy.subcategory,
                              dataIndex: "subcategory",
                              key: "subcategory",
                              width: "15%",
                            },
                            {
                              title: copy.status,
                              dataIndex: "status",
                              key: "status",
                              width: "12%",
                              render: (status: string) => {
                                let color = "default";
                                if (status === "resolved") color = "green";
                                else if (status === "in_progress")
                                  color = "orange";
                                else if (status === "pending") color = "red";
                                else if (status === "rejected")
                                  color = "volcano";
                                return <Tag color={color}>{status}</Tag>;
                              },
                            },
                            {
                              title: copy.priority,
                              dataIndex: "priority",
                              key: "priority",
                              width: "8%",
                              align: "center" as const,
                            },
                            {
                              title: copy.officer,
                              dataIndex: "assignedOfficer",
                              key: "assignedOfficer",
                              width: "15%",
                              render: (officer: string | null) =>
                                officer || "-",
                            },
                            {
                              title: copy.submittedDate,
                              dataIndex: "createdAt",
                              key: "createdAt",
                              width: "15%",
                              render: (date: Date) =>
                                formatDateTime(date.toString()),
                            },
                          ]}
                          pagination={{ pageSize: 5 }}
                          size="small"
                          rowKey="id"
                        />
                      </Card>
                    </Col>
                  )}
                </Row>
              )}
            </Card>
          </Col>
        </Row>
      )}

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
              {meeting.giftToCarry && (
                <DetailField
                  label={copy.giftToCarry}
                  value={meeting.giftToCarry}
                />
              )}
              {meeting.selfDraftedLetter && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{copy.selfDraftedLetter}:</Text>
                  <div
                    style={{
                      marginTop: 8,
                      padding: 12,
                      backgroundColor: "#f5f5f5",
                      borderRadius: 4,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    <Text style={{ whiteSpace: "pre-wrap" }}>
                      {meeting.selfDraftedLetter}
                    </Text>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() =>
                        downloadLetter(
                          meeting.selfDraftedLetter!,
                          "invitation-letter.txt",
                        )
                      }
                    >
                      {copy.downloadLetter}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
