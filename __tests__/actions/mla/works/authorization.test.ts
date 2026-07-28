import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  isWorksManagerRole,
  isBudgetApproverRole,
  checkWorkAccess,
} from "@/actions/mla/works/_shared";
import { ROLE } from "@prisma/client";

describe("Works Authorization", () => {
  describe("isWorksManagerRole", () => {
    it("should return true for MLA role", () => {
      expect(isWorksManagerRole("MLA")).toBe(true);
    });

    it("should return true for MLA_PA role", () => {
      expect(isWorksManagerRole("MLA_PA")).toBe(true);
    });

    it("should return true for MLA_SECRETARY role", () => {
      expect(isWorksManagerRole("MLA_SECRETARY")).toBe(true);
    });

    it("should return true for ADMIN role", () => {
      expect(isWorksManagerRole("ADMIN")).toBe(true);
    });

    it("should return false for CITIZEN role", () => {
      expect(isWorksManagerRole("CITIZEN")).toBe(false);
    });

    it("should return false for OFFICER role", () => {
      expect(isWorksManagerRole("OFFICER")).toBe(false);
    });
  });

  describe("isBudgetApproverRole", () => {
    it("should return true for MLA role", () => {
      expect(isBudgetApproverRole("MLA")).toBe(true);
    });

    it("should return true for ADMIN role", () => {
      expect(isBudgetApproverRole("ADMIN")).toBe(true);
    });

    it("should return false for non-approver roles", () => {
      expect(isBudgetApproverRole("CITIZEN")).toBe(false);
      expect(isBudgetApproverRole("OFFICER")).toBe(false);
    });
  });

  describe("checkWorkAccess", () => {
    const mockWork = {
      id: 1,
      created_by_user_id: "user-123",
      created_by_user: {
        id: "mla-user-123",
        role: "MLA",
      },
      departmentId: 1,
    };

    it("should allow MLA creator to access their work", () => {
      const user = {
        id: "user-123",
        role: "MLA",
      };

      expect(checkWorkAccess(mockWork as any, user as any)).toBe(true);
    });

    it("should allow ADMIN to access any work", () => {
      const user = {
        id: "admin-user",
        role: "ADMIN",
      };

      expect(checkWorkAccess(mockWork as any, user as any)).toBe(true);
    });

    it("should deny other users from accessing work", () => {
      const user = {
        id: "other-user",
        role: "CITIZEN",
      };

      expect(checkWorkAccess(mockWork as any, user as any)).toBe(false);
    });
  });
});
