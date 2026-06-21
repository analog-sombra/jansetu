export type OfficerAssignmentResponse = {
  id: number;
  type: string;
  message: string;
  proofUrl: string | null;
  createdAt: string;
};

export type OfficerCompletedAssignmentSummary = {
  id: number;
  complaintId: number;
  category: string;
  subcategory: string | null;
  area: string | null;
  status: string;
  completedAt: string;
};

export type OfficerAssignmentDetail = {
  id: number;
  complaintId: number;
  complaint: {
    category: string;
    subcategory: string | null;
    description: string;
    status: string;
    plannedCompletionDate: string | null;
    lat: number;
    lng: number;
    area: string | null;
    user: {
      name: string | null;
      mobile: string;
      address: string | null;
    };
    media: Array<{ id: number; fileUrl: string; type: string }>;
  };
  officer: {
    id: number;
    name: string;
    department: { name: string };
  };
  responses: OfficerAssignmentResponse[];
  completedAssignments: OfficerCompletedAssignmentSummary[];
  availableOfficers: Array<{
    id: number;
    name: string;
    designation: string;
    department: {
      name: string;
    };
  }>;
};

export type OfficerAuthResult = {
  ok: false;
  error: string;
};

export type GetOfficerAssignmentByTokenResult =
  | {
      ok: true;
      assignment: OfficerAssignmentDetail;
    }
  | OfficerAuthResult;

export type SubmitOfficerResponseInput = {
  token: string;
  type: "RESOLVED" | "QUERY" | "REJECTED" | "WORK_IN_PROGESS";
  message: string;
  proofUrl?: string;
  plannedCompletionDate?: string;
};

export type SubmitOfficerResponseResult =
  | {
      ok: true;
    }
  | OfficerAuthResult;

export type AssignOfficerByTokenResult =
  | {
      ok: true;
      token: string;
      assignmentId: number;
    }
  | OfficerAuthResult
  | {
      ok: false;
      error: string;
    };
