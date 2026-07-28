import { z } from "zod";
import { WORKSTATUS, TASKSTATUS, WORKMEDIATYPE } from "@prisma/client";

export const createWorkValidationSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title must be at most 200 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(5000, "Description must be at most 5000 characters"),
  departmentId: z.number().int().positive("Invalid department"),
  wardId: z.number().int().positive("Invalid ward").optional(),
  clusterId: z.number().int().positive("Invalid cluster").optional(),
  complaintId: z.number().int().positive("Invalid complaint").optional(),
  priority: z.number().int().min(1).max(100).default(50),
  estimated_budget: z.number().positive("Budget must be greater than 0").optional(),
  start_date: z.string().datetime().optional(),
  target_completion_date: z.string().datetime(),
  remarks: z.string().max(1000).optional(),
});

export const updateWorkValidationSchema = z.object({
  id: z.number().int().positive("Invalid work ID"),
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(20).max(5000).optional(),
  status: z.enum(Object.values(WORKSTATUS) as [string, ...string[]]).optional(),
  approved_budget: z.number().positive().optional(),
  utilized_budget: z.number().nonnegative().optional(),
  completion_percentage: z.number().int().min(0).max(100).optional(),
  actual_completion_date: z.string().datetime().optional(),
  remarks: z.string().max(1000).optional(),
});

export const createTaskValidationSchema = z.object({
  work_id: z.number().int().positive(),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  officer_id: z.number().int().positive(),
  sequence_no: z.number().int().nonnegative().optional(),
  planned_date: z.string().datetime(),
  remarks: z.string().max(1000).optional(),
});

export const updateTaskValidationSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(Object.values(TASKSTATUS) as [string, ...string[]]).optional(),
  completion_percentage: z.number().int().min(0).max(100).optional(),
  actual_date: z.string().datetime().optional(),
  remarks: z.string().max(1000).optional(),
});

export const uploadMediaValidationSchema = z.object({
  workId: z.number().int().positive(),
  taskId: z.number().int().positive().optional(),
  type: z.enum(Object.values(WORKMEDIATYPE) as [string, ...string[]]),
  caption: z.string().max(500).optional(),
});
