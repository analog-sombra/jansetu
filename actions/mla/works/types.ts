import { WORKSTATUS, TASKSTATUS, WORKMEDIATYPE } from "@prisma/client";

// Work DTO
export interface WorkDTO {
  id: number;
  title: string;
  description: string;
  status: WORKSTATUS;
  priority: number;
  completion_percentage: number;
  estimated_budget: number | null;
  approved_budget: number | null;
  utilized_budget: number;
  start_date: Date | null;
  target_completion_date: Date | null;
  actual_completion_date: Date | null;
  created_from: string;
  department: { id: number; name: string };
  ward: { id: number; name: string } | null;
  created_by: { id: string; name: string | null };
  approved_by: { id: string; name: string | null } | null;
  complaint_cluster?: {
    id: number;
    affected_citizens_count: number;
    category: string;
  };
}

// Task DTO
export interface WorkTaskDTO {
  id: number;
  title: string;
  description: string | null;
  sequence_no: number;
  status: TASKSTATUS;
  completion_percentage: number;
  planned_date: Date | null;
  actual_date: Date | null;
  officer: { id: number; name: string } | null;
  media_count: number;
}

// Media DTO
export interface WorkMediaDTO {
  id: number;
  file_path: string;
  type: WORKMEDIATYPE;
  caption: string | null;
  uploaded_by: string;
  created_at: Date;
}

// Activity Update DTO
export interface WorkUpdateDTO {
  id: number;
  message: string;
  created_by: string;
  created_at: Date;
}

// Response wrappers
export type ActionResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: string };

export type CreateWorkResult = ActionResult<WorkDTO>;
export type UpdateWorkResult = ActionResult<WorkDTO>;
export type GetWorkDetailsResult = ActionResult<WorkDTO & { 
  tasks: WorkTaskDTO[]; 
  media: Record<string, WorkMediaDTO[]>;
  activity_feed: WorkUpdateDTO[];
}>;
export type GetWorksListingResult = ActionResult<{
  items: WorkDTO[];
  total: number;
  page: number;
  hasMore: boolean;
}>;
export type GetWorksDashboardResult = ActionResult<{
  summary: {
    total_works: number;
    proposed: number;
    approved: number;
    in_progress: number;
    completed: number;
    on_hold: number;
    cancelled: number;
    delayed: number;
  };
  budget: {
    total_approved: number;
    total_utilized: number;
    utilization_percentage: number;
  };
  department_metrics: Array<{
    department_id: number;
    department_name: string;
    work_count: number;
    completion_rate: number;
    delayed_count: number;
  }>;
  ward_distribution: Array<{
    ward_id: number;
    ward_name: string;
    work_count: number;
  }>;
  priority_works: Array<{
    id: number;
    title: string;
    priority: number;
    status: WORKSTATUS;
    target_completion_date: Date | null;
  }>;
  works_due_soon: Array<{
    id: number;
    title: string;
    target_completion_date: Date | null;
    days_remaining: number;
    status: WORKSTATUS;
  }>;
  recent_works: WorkDTO[];
}>;

// Create Work Payload
export interface CreateWorkPayload {
  title: string;
  description: string;
  departmentId: number;
  wardId?: number;
  clusterId?: number;
  complaintId?: number;
  priority?: number;
  estimated_budget?: number;
  start_date?: string;
  target_completion_date?: string;
  remarks?: string;
}

// Update Work Payload
export interface UpdateWorkPayload {
  id: number;
  title?: string;
  description?: string;
  status?: WORKSTATUS;
  approved_budget?: number;
  utilized_budget?: number;
  completion_percentage?: number;
  actual_completion_date?: string;
  remarks?: string;
}

// Task Payload
export interface CreateTaskPayload {
  work_id: number;
  title: string;
  description?: string;
  officer_id: number;
  sequence_no?: number;
  planned_date: string;
  remarks?: string;
}

export interface UpdateTaskPayload {
  id: number;
  status?: TASKSTATUS;
  completion_percentage?: number;
  actual_date?: string;
  remarks?: string;
}

// Media Payload
export interface UploadMediaPayload {
  workId: number;
  taskId?: number;
  type: WORKMEDIATYPE;
  caption?: string;
  file: File;
}
