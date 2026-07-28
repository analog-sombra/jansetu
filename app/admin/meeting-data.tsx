import { ROLE } from "@prisma/client";

export type MEETINGTYPE =
  | "CONSTITUENCY_VISIT"
  | "DEPARTMENT_VISIT"
  | "CITIZEN_MEET"
  | "PERSONAL_MEET"
  | "INVITATION"
  | "PARTY_MEET"
  | "OFFICE_MEET";

export type INVITATIONSUBTYPE =
  | "MARRIAGE"
  | "BIRTHDAY"
  | "FUNERAL"
  | "OTHER";

export type MEETINGAPPROVALSTATUS =
  | "NOT_REQUIRED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type MeetingStatus =
  | "SCHEDULED"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "COMPLETED"
  | "REJECTED";

export type MEETINGPRIORITY = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type UserLite = {
  id: string;
  name: string | null;
  mobile: string;
  role: ROLE;
};

export type MeetingRecord = {
  id: number;
  createdByUserId: string;
  assignedToUserId: string;
  campHeadUserId: string | null;
  type: MEETINGTYPE;
  invitationSubtype: INVITATIONSUBTYPE | null;
  giftToCarry: string | null;
  selfDraftedLetter: string | null;
  purpose: string;
  meetingDateTime: string | null;
  meetingPlace: string | null;
  approvalStatus: MEETINGAPPROVALSTATUS;
  approvedAt: string | null;
  rejectedAt: string | null;
  completedAt: string | null;
  approvalRemarks: string | null;
  preferredDateTime: string | null;
  priority: MEETINGPRIORITY | null;
  citizenName: string | null;
  citizenMobile: string | null;
  citizenArea: string | null;
  citizenDetails: string | null;
  contactName: string | null;
  contactMobile: string | null;
  contactDesignation: string | null;
  contactDepartment: string | null;
  partyMeetDetails: string | null;
  selectedStaffNames: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUser: UserLite;
  assignedToUser: UserLite;
};

export type AdminMeetingDashboardRecord = MeetingRecord & {
  campHeadUser?: UserLite | null;
};

export const MEETING_TYPE_OPTIONS: Array<{
  label: string;
  value: MEETINGTYPE;
}> = [
  { label: "Constituency Visit", value: "CONSTITUENCY_VISIT" },
  { label: "Department Visit", value: "DEPARTMENT_VISIT" },
  { label: "Citizen Meet", value: "CITIZEN_MEET" },
  { label: "Personal Meet", value: "PERSONAL_MEET" },
  { label: "Invitation", value: "INVITATION" },
  { label: "Party Meet", value: "PARTY_MEET" },
  { label: "Office Meet", value: "OFFICE_MEET" },
];

export const PRIORITY_OPTIONS: Array<{
  label: string;
  value: MEETINGPRIORITY;
}> = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Urgent", value: "URGENT" },
];

export function getMeetingTypeLabel(type: MEETINGTYPE) {
  return (
    MEETING_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? type
  );
}

export function deriveMeetingStatus(meeting: MeetingRecord): MeetingStatus {
  if (meeting.completedAt) {
    return "COMPLETED";
  }
  if (meeting.approvalStatus === "REJECTED") {
    return "REJECTED";
  }
  if (meeting.type === "CITIZEN_MEET" && meeting.approvalStatus === "PENDING") {
    return "PENDING_APPROVAL";
  }
  if (
    meeting.type === "CITIZEN_MEET" &&
    meeting.approvalStatus === "APPROVED"
  ) {
    return "APPROVED";
  }
  return "SCHEDULED";
}

export function getMeetingStatusColor(status: MeetingStatus) {
  switch (status) {
    case "SCHEDULED":
      return "blue";
    case "PENDING_APPROVAL":
      return "orange";
    case "APPROVED":
      return "green";
    case "COMPLETED":
      return "purple";
    case "REJECTED":
      return "red";
    default:
      return "default";
  }
}

export function getInvitationSubtypeLabel(subtype: INVITATIONSUBTYPE): string {
  const labels: Record<INVITATIONSUBTYPE, string> = {
    MARRIAGE: "Marriage",
    BIRTHDAY: "Birthday",
    FUNERAL: "Funeral",
    OTHER: "Other",
  };

  return labels[subtype] ?? subtype;
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}
