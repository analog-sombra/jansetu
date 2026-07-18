import { MEETINGAPPROVALSTATUS, MEETINGPRIORITY, MEETINGTYPE, ROLE } from "@prisma/client";
import { AdminAuthResult } from "../types";

export type AdminMeetingAssignee = {
  id: string;
  name: string | null;
  mobile: string;
  role: ROLE;
};

export type AdminMeetingAssigneesResult =
  | {
      ok: true;
      assignees: AdminMeetingAssignee[];
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export type AdminMeetingCitizenLookupResult =
  | {
      ok: true;
      found: true;
      user: {
        id: string;
        name: string | null;
        mobile: string;
        address: string | null;
      };
    }
  | {
      ok: true;
      found: false;
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export type AdminMeetingContactLookupResult =
  | {
      ok: true;
      found: true;
      contact: {
        name: string;
        designation: string | null;
        department: string | null;
      };
    }
  | {
      ok: true;
      found: false;
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export type CreateAdminMeetingInput = {
  assignedToUserId: string;
  type: MEETINGTYPE;
  purpose: string;
  meetingDateTime?: string;
  meetingPlace?: string;
  preferredDateTime?: string;
  priority?: MEETINGPRIORITY;
  citizenName?: string;
  citizenMobile?: string;
  citizenArea?: string;
  citizenDetails?: string;
  contactName?: string;
  contactMobile?: string;
  contactDesignation?: string;
  contactDepartment?: string;
};

export type CreateAdminMeetingResult =
  | {
      ok: true;
      meeting: {
        id: number;
        type: MEETINGTYPE;
        approvalStatus: MEETINGAPPROVALSTATUS;
        createdAt: string;
      };
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export type AdminMeetingDashboardRecord = {
  id: number;
  createdByUserId: string;
  assignedToUserId: string;
  type: MEETINGTYPE;
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
  createdAt: string;
  updatedAt: string;
  createdByUser: {
    id: string;
    name: string | null;
    mobile: string;
    role: ROLE;
  };
  assignedToUser: {
    id: string;
    name: string | null;
    mobile: string;
    role: ROLE;
  };
};

export type AdminMeetingsDashboardResult =
  | {
      ok: true;
      meetings: AdminMeetingDashboardRecord[];
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export type ApproveAdminMeetingInput = {
  meetingId: number;
  meetingDateTime: string;
  meetingPlace: string;
  approvalRemarks?: string;
};

export type ApproveAdminMeetingResult =
  | {
      ok: true;
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export type RejectAdminMeetingInput = {
  meetingId: number;
  rejectionRemarks: string;
};

export type RejectAdminMeetingResult =
  | {
      ok: true;
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };
