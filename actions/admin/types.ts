export type AdminComplaintSummary = {
  id: number;
  citizenName: string;
  citizenMobile: string;
  departmentName?: string | null;
  officerNames?: string[];
  category: string;
  subcategory: string | null;
  status: string;
  area: string;
  affectedCitizensCount: number;
  createdAt: string;
};

export type AdminOfficerSummary = {
  id: number;
  name: string;
  designation: string;
  department: {
    id: number;
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
  token: string;
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
  address: string | null;
  affectedCitizensCount: number;
  status: string;
  plannedCompletionDate: string | null;
  lat: number;
  lng: number;
  area: string | null;
  media: Array<{ id: number; fileUrl: string; type: string }>;
  assignments: AdminComplaintAssignmentSummary[];
  officerAssignmentHistory: AdminOfficerAssignmentHistorySummary[];
  categoryDepartment: {
    id: number;
    name: string;
  } | null;
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

export type AdminEscalationStatus =
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "QUERY"
  | "ESCALATED";

export type AdminEscalationTrigger = "REMINDER_48H" | "AUTO_ESCALATED_7D";

export type AdminEscalationRecord = {
  id: number;
  complaintId: number;
  area: string;
  category: string;
  subcategory: string | null;
  officer: string;
  officerMobile: string;
  department: string;
  ageHours: number;
  status: AdminEscalationStatus;
  trigger: AdminEscalationTrigger;
  lastActionAt: string;
};

export type AdminEscalationQueueResult =
  | {
      ok: true;
      escalations: AdminEscalationRecord[];
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };

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
  department: {
    id: number;
    name: string;
  };
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

export type AdminReportPeriodKey = "7d" | "30d" | "90d";

export type AdminReportWardStatus = "GREEN" | "AMBER" | "RED";

export type AdminReportAreaStatus = "GREEN" | "AMBER" | "RED";

export type AdminReportOverview = {
  summary: {
    totalVotersAssisted: number;
    resolvedThisPeriod: number;
    pendingFollowUps: number;
    satisfactionScore: number;
  };
  trend: Array<{
    name: string;
    complaints: number;
    resolved: number;
  }>;
  areaHeatmap: Array<{
    area: string;
    complaints: number;
    resolved: number;
    severityScore: number;
    avgResolutionDays: number;
    topIssue: string;
    escalation: string;
    trend: string;
    color: AdminReportAreaStatus;
  }>;
  wards: Array<{
    ward: string;
    total: number;
    resolved: number;
    resolutionRate: number;
    avgResolutionDays: number;
    color: AdminReportWardStatus;
  }>;
  serviceRecord: Array<{
    category: string;
    fixed: number;
    backlog: number;
  }>;
  constituencySentiment: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  departmentReportCard: Array<{
    department: string;
    issuesLogged: number;
    avgResolutionDays: number;
    slaBreachPercent: number;
    workDonePhotosUploaded: number;
  }>;
  noticeTriggerList: Array<{
    assignmentId: number;
    ticketId: number;
    officerName: string;
    department: string;
    reminderCount: number;
    daysOverdue: number;
    area: string;
  }>;
  proofGallery: Array<{
    complaintId: number;
    category: string;
    area: string;
    resolvedAt: string;
    beforeLabel: string;
    afterLabel: string;
    beforeTone: string;
    afterTone: string;
  }>;
  systemicCrises: Array<{
    key: string;
    area: string;
    category: string;
    activeCases: number;
    icon: string;
    severity: string;
  }>;
};

export type AdminReportDashboardResult =
  | {
      ok: true;
      period: AdminReportPeriodKey;
      overview: AdminReportOverview;
    }
  | AdminAuthResult
  | {
      ok: false;
      error: string;
    };
