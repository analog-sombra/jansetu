import { ROLE } from "@prisma/client";

export type CampCitizenInput = {
  mobile: string;
  name: string;
  address: string;
  aadhaar?: string;
  voterId: string;
};

export type CampComplaintInput = {
  categoryId: number;
  subcategoryId: number;
  description: string;
  complaintAddress: string;
  affectedCitizensCount: string;
  sublocalityId?: number;
  lat: string;
  lng: string;
};

export type CampCreateComplaintInput = {
  citizen: CampCitizenInput;
  complaint: CampComplaintInput;
};

export type CampUserSummary = {
  id: string;
  role: ROLE;
  name: string | null;
  mobile: string;
  address: string | null;
  aadhaar: string | null;
  voterId: string | null;
  complaintCount: number;
  lastComplaintAt: string | null;
};

export type CampComplaintSummary = {
  id: number;
  citizenName: string;
  citizenMobile: string;
  category: string;
  subcategory: string | null;
  affectedCitizensCount: number;
  status: string;
  locality: string | null;
  sublocality: string | null;
  createdAt: string;
};

export type CampComplaintResponseSummary = {
  id: number;
  type: string;
  message: string;
  proofUrl: string | null;
  createdAt: string;
};

export type CampComplaintAssignmentSummary = {
  id: number;
  status: string;
  dueDate: string;
  officer: {
    name: string;
    designation: string;
    department: {
      name: string;
    };
  };
  responses: CampComplaintResponseSummary[];
};

export type CampComplaintDetail = {
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
  complaintAddress: string | null;
  affectedCitizensCount: number;
  status: string;
  plannedCompletionDate: string | null;
  lat: number;
  lng: number;
  locality: string | null;
  sublocality: string | null;
  media: Array<{ id: number; fileUrl: string; type: string }>;
  assignments: CampComplaintAssignmentSummary[];
  createdAt: string;
  cluster: {
    clusterId: string;
    departmentName: string;
    complaintCount: number;
    totalAffectedCitizensCount: number;
    bucketSizeMeters: number;
  } | null;
};

export type CampAuthResult = {
  ok: false;
  error: string;
};

export type GetCitizenByMobileResult =
  | {
      ok: true;
      found: true;
      user: {
        id: string;
        name: string;
        mobile: string;
        address: string;
        aadhaar: string;
        voterId: string;
      };
    }
  | {
      ok: true;
      found: false;
    }
  | CampAuthResult;

export type GetCitizenComplaintSummaryResult =
  | {
      ok: true;
      found: true;
      summary: {
        total: number;
        resolved: number;
        pending: number;
        closed: number;
      };
    }
  | {
      ok: true;
      found: false;
      summary: {
        total: 0;
        resolved: 0;
        pending: 0;
        closed: 0;
      };
    }
  | CampAuthResult
  | {
      ok: false;
      error: string;
    };

export type CitizenComplaintListItem = {
  id: number;
  category: string;
  subcategory: string | null;
  status: string;
  locality: string | null;
  sublocality: string | null;
  createdAt: string;
};

export type GetCitizenComplaintsByMobileResult =
  | {
      ok: true;
      found: true;
      complaints: CitizenComplaintListItem[];
    }
  | {
      ok: true;
      found: false;
      complaints: [];
    }
  | CampAuthResult
  | {
      ok: false;
      error: string;
    };

export type CreateCampComplaintResult =
  | {
      ok: true;
      complaintId: number;
      userId: string;
      createdNewUser: boolean;
      clusterId: string;
      clusterComplaintCount: number;
    }
  | CampAuthResult
  | {
      ok: false;
      error: string;
    };

export type CampComplaintsDashboardResult =
  | {
      ok: true;
      complaints: CampComplaintSummary[];
    }
  | CampAuthResult;

export type CampComplaintDetailResult =
  | {
      ok: true;
      complaint: CampComplaintDetail;
    }
  | CampAuthResult
  | {
      ok: false;
      error: string;
    };

export type CampUsersListResult =
  | {
      ok: true;
      users: CampUserSummary[];
    }
  | CampAuthResult;

export type UpdateCampCitizenProfileInput = {
  userId: string;
  name: string;
  address: string;
  aadhaar?: string;
  voterId?: string;
};

export type UpdateCampCitizenProfileResult =
  | {
      ok: true;
    }
  | CampAuthResult
  | {
      ok: false;
      error: string;
    };
