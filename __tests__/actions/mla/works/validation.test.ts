import { describe, it, expect } from "@jest/globals";
import {
  createWorkValidationSchema,
  updateWorkValidationSchema,
  createTaskValidationSchema,
  updateTaskValidationSchema,
} from "@/schema/workValidationSchema";

describe("Work Validation Schemas", () => {
  describe("createWorkValidationSchema", () => {
    it("should accept valid work creation payload", () => {
      const validPayload = {
        title: "Build New Road",
        description: "This is a detailed description of the work to be done in the constituency.",
        departmentId: 1,
        priority: 50,
        target_completion_date: "2024-12-31",
      };

      const result = createWorkValidationSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("should reject title shorter than 5 characters", () => {
      const invalidPayload = {
        title: "Road",
        description: "This is a detailed description of the work to be done in the constituency.",
        departmentId: 1,
        priority: 50,
      };

      const result = createWorkValidationSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it("should reject description shorter than 20 characters", () => {
      const invalidPayload = {
        title: "Build New Road",
        description: "Short desc",
        departmentId: 1,
        priority: 50,
      };

      const result = createWorkValidationSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it("should reject priority outside 1-100 range", () => {
      const invalidPayload = {
        title: "Build New Road",
        description: "This is a detailed description of the work to be done in the constituency.",
        departmentId: 1,
        priority: 150,
      };

      const result = createWorkValidationSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it("should reject missing departmentId", () => {
      const invalidPayload = {
        title: "Build New Road",
        description: "This is a detailed description of the work to be done in the constituency.",
        priority: 50,
      };

      const result = createWorkValidationSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("updateWorkValidationSchema", () => {
    it("should accept valid work update payload", () => {
      const validPayload = {
        id: 1,
        status: "IN_PROGRESS",
        completion_percentage: 50,
      };

      const result = updateWorkValidationSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("should reject completion_percentage outside 0-100 range", () => {
      const invalidPayload = {
        id: 1,
        completion_percentage: 150,
      };

      const result = updateWorkValidationSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it("should accept negative completion_percentage", () => {
      const invalidPayload = {
        id: 1,
        completion_percentage: -10,
      };

      const result = updateWorkValidationSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("createTaskValidationSchema", () => {
    it("should accept valid task creation payload", () => {
      const validPayload = {
        work_id: 1,
        title: "Foundation Work",
        officer_id: 1,
        planned_date: "2024-12-31",
      };

      const result = createTaskValidationSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("should reject title shorter than 3 characters", () => {
      const invalidPayload = {
        work_id: 1,
        title: "AB",
        officer_id: 1,
        planned_date: "2024-12-31",
      };

      const result = createTaskValidationSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it("should reject missing required fields", () => {
      const invalidPayload = {
        work_id: 1,
        title: "Foundation Work",
      };

      const result = createTaskValidationSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("updateTaskValidationSchema", () => {
    it("should accept valid task update payload", () => {
      const validPayload = {
        id: 1,
        status: "COMPLETED",
        completion_percentage: 100,
      };

      const result = updateTaskValidationSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const invalidPayload = {
        id: 1,
        status: "INVALID_STATUS",
      };

      const result = updateTaskValidationSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });
});
