export type OfficerAssignmentResponse = {
  id: number;
  type: string;
  message: string;
  proofUrl: string | null;
  createdAt: string;
};

export type OfficerCompletedAssignmentSummary = {
  id: number;
  token: string;
  complaintId: number;
  category: string;
  subcategory: string | null;
  locality: string | null;
  sublocality: string | null;
  address: string | null;
  status: string;
  completedAt: string;
};

export type OfficerComplaintResponseSummary = {
  id: number;
  type: string;
  message: string;
  proofUrl: string | null;
  createdAt: string;
};

export type OfficerComplaintAssignmentSummary = {
  id: number;
  status: string;
  dueDate: string;
  officer: {
    id: number;
    name: string;
    designation: string;
    department: {
      name: string;
    };
  };
  responses: OfficerComplaintResponseSummary[];
};

export type OfficerComplaintDetail = {
  id: number;
  citizen: {
    name: string;
    mobile: string;
    address: string;
    aadhaar: string;
    voterId: string;
  };
  category: string;
  subcategory: string | null;
  description: string;
  affectedCitizensCount: number;
  status: string;
  plannedCompletionDate: string | null;
  lat: number;
  lng: number;
  sublocality: string | null;
  media: Array<{ id: number; fileUrl: string; type: string }>;
  assignments: OfficerComplaintAssignmentSummary[];
  createdAt: string;
  cluster: {
    clusterId: string;
    departmentName: string;
    complaintCount: number;
    totalAffectedCitizensCount: number;
    bucketSizeMeters: number;
  } | null;
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
    locality: string | null;
    sublocality: string | null;
    user: {
      name: string | null;
      mobile: string;
      address: string | null;
    };
    media: Array<{
      id: number;
      fileUrl: string;
      type: string;
    }>;
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

export type OfficerComplaintDetailResult =
  | {
      ok: true;
      complaint: OfficerComplaintDetail;
    }
  | OfficerAuthResult
  | {
      ok: false;
      error: string;
    };

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
