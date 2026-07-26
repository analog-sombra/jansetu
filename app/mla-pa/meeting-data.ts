import {
  INVITATIONSUBTYPE,
  MLAPAMEETINGTYPE,
  ROLE,
} from "@prisma/client";

export type MlaPaMeetingStatus = "SCHEDULED" | "COMPLETED";

export type MlaPaMeetingRecord = {
  id: number;
  createdByUserId: string;
  mlaUserId: string;
  campHeadUserId: string;
  type: MLAPAMEETINGTYPE;
  invitationSubtype: INVITATIONSUBTYPE | null;
  invitationOtherPurpose: string | null;
  purpose: string;
  scheduledAt: string;
  meetingPlace: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  giftToCarry: string | null;
  selfDraftedLetter: string | null;
  createdByUser: {
    id: string;
    name: string | null;
    mobile: string;
    role: ROLE;
  };
  mlaUser: {
    id: string;
    name: string | null;
    mobile: string;
    role: ROLE;
  };
  campHeadUser: {
    id: string;
    name: string | null;
    mobile: string;
    role: ROLE;
  };
};

export function deriveMlaPaMeetingStatus(
  meeting: MlaPaMeetingRecord,
): MlaPaMeetingStatus {
  return meeting.completedAt ? "COMPLETED" : "SCHEDULED";
}

export function getMlaPaMeetingTypeLabel(type: MLAPAMEETINGTYPE): string {
  const labels: Record<MLAPAMEETINGTYPE, string> = {
    INVITATION: "Invitation",
    CONSTITUENCY_VISIT: "Constituency Visit",
    DEPARTMENT_VISIT: "Department Visit",
    CITIZEN_MEET: "Citizen Meet",
    PERSONAL_MEET: "Personal Meet",
    PARTY_MEET: "Party Meet",
    OFFICE_MEET: "Office Meet",
  };

  return labels[type] ?? type;
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

export function formatDateTime(value: string): string {
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

export function dateKeyFromIso(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
