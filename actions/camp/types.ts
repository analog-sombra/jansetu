import { UserRole } from "@prisma/client";

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
  affectedCitizensCount: string;
  area?: string;
  lat: string;
  lng: string;
};

export type CampCreateComplaintInput = {
  citizen: CampCitizenInput;
  complaint: CampComplaintInput;
};

export type CampUserSummary = {
  id: string;
  role: UserRole;
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
  area: string;
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
  affectedCitizensCount: number;
  status: string;
  plannedCompletionDate: string | null;
  lat: number;
  lng: number;
  area: string | null;
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
