export type AdminComplaintSummary = {
  id: number;
  citizenName: string;
  citizenMobile: string;
  category: string;
  subcategory: string | null;
  status: string;
  area: string;
  createdAt: string;
};

export type AdminOfficerSummary = {
  id: number;
  name: string;
  designation: string;
  department: {
    name: string;
  };
};

export type AdminDepartmentSummary = {
  id: number;
  name: string;
  officersCount: number;
  createdAt: string;
};

export type AdminOfficerDirectorySummary = {
  id: number;
  name: string;
  designation: string;
  email: string;
  phone: string;
  createdAt: string;
  department: {
    id: number;
    name: string;
  };
};

export type AdminComplaintResponseSummary = {
  id: number;
  type: string;
  message: string;
  proofUrl: string | null;
  createdAt: string;
  officer: AdminOfficerSummary;
};

export type AdminComplaintAssignmentSummary = {
  id: number;
  status: string;
  dueDate: string;
  officer: AdminOfficerSummary;
  responses: AdminComplaintResponseSummary[];
};

export type AdminOfficerAssignmentHistorySummary = {
  id: number;
  createdAt: string;
  isCurrent: boolean;
  officer: AdminOfficerSummary;
  assignedByName: string | null;
};

export type AdminComplaintDetail = {
  id: number;
  user: {
    name: string | null;
    address: string | null;
    mobile: string;
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
  assignments: AdminComplaintAssignmentSummary[];
  officerAssignmentHistory: AdminOfficerAssignmentHistorySummary[];
  cluster: {
    clusterId: string;
    departmentName: string;
    complaintCount: number;
    totalAffectedCitizensCount: number;
    bucketSizeMeters: number;
    complaints: Array<{
      id: number;
      category: string;
      subcategory: string | null;
      status: string;
      area: string | null;
      affectedCitizensCount: number;
      createdAt: string;
      isCurrentComplaint: boolean;
    }>;
  } | null;
};

export type AdminAuthResult = {
  ok: false;
  error: string;
};

export type AdminComplaintsDashboardResult =
  | {
      ok: true;
      complaints: AdminComplaintSummary[];
    }
  | AdminAuthResult;

export type AdminComplaintDetailResult =
  | {
      ok: true;
      complaint: AdminComplaintDetail;
      officers: AdminOfficerSummary[];
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export type AdminAssignmentResult =
  | {
      ok: true;
      token: string;
      assignmentId: number;
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export type AdminQueryResult =
  | {
      ok: true;
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export type AdminDepartmentOfficerDirectoryResult =
  | {
      ok: true;
      departments: AdminDepartmentSummary[];
      officers: AdminOfficerDirectorySummary[];
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export type AdminDepartmentCreateResult =
  | {
      ok: true;
      department: AdminDepartmentSummary;
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export type AdminOfficerCreateResult =
  | {
      ok: true;
      officer: AdminOfficerDirectorySummary;
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export type AdminCategorySummary = {
  id: number;
  name: string;
  subcategoriesCount: number;
  createdAt: string;
};

export type AdminSubcategoryDirectorySummary = {
  id: number;
  name: string;
  createdAt: string;
  category: {
    id: number;
    name: string;
  };
};

export type AdminCategorySubcategoryDirectoryResult =
  | {
      ok: true;
      categories: AdminCategorySummary[];
      subcategories: AdminSubcategoryDirectorySummary[];
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export type AdminCategoryCreateResult =
  | {
      ok: true;
      category: AdminCategorySummary;
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

export type AdminSubcategoryCreateResult =
  | {
      ok: true;
      subcategory: AdminSubcategoryDirectorySummary;
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };
