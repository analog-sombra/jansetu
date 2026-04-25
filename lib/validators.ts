import { z } from "zod";

const mobileRegex = /^[6-9]\d{9}$/;
const aadhaarRegex = /^\d{12}$/;

export const sendOtpSchema = z.object({
  mobile: z.string().regex(mobileRegex, "Invalid mobile number"),
});

export const verifyOtpSchema = z.object({
  mobile: z.string().regex(mobileRegex),
  otp: z.string().length(6),
});

export const completeProfileSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  aadhaar: z.string().regex(aadhaarRegex).optional().or(z.literal("")),
  voterId: z.string().min(4),
});

export const createComplaintSchema = z.object({
  category: z.string().min(2),
  subcategory: z.string().optional(),
  description: z.string().min(10),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  area: z.string().optional(),
  media: z
    .array(
      z.object({
        fileUrl: z.string().min(3),
        type: z.enum(["IMAGE", "VIDEO", "DOCUMENT"]),
      }),
    )
    .default([]),
});

export const assignSchema = z.object({
  complaintId: z.coerce.number().int().positive(),
  officerId: z.coerce.number().int().positive(),
  dueDate: z.string().datetime().optional(),
});

export const respondSchema = z.object({
  token: z.string().min(10),
  type: z.enum(["RESOLVED", "QUERY", "REJECTED", "WORK_IN_PROGESS"]),
  message: z.string().min(3),
  proofUrl: z.string().optional(),
  plannedCompletionDate: z.string().datetime().optional(),
}).superRefine((payload, ctx) => {
  if (payload.type === "WORK_IN_PROGESS" && !payload.plannedCompletionDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "plannedCompletionDate is required for WORK_IN_PROGESS",
      path: ["plannedCompletionDate"],
    });
  }
});

export const confirmResolutionSchema = z.object({
  complaintId: z.coerce.number().int().positive(),
  confirmed: z.boolean(),
  message: z.string().optional(),
});

export const raiseQuerySchema = z.object({
  message: z.string().min(3),
});

export const createMeetingSchema = z
  .object({
    assignedToUserId: z.string().min(1),
    type: z.enum([
      "CONSTITUENCY_VISIT",
      "DEPARTMENT_VISIT",
      "CITIZEN_MEET",
      "PERSONAL_MEET",
    ]),
    purpose: z.string().min(5),
    meetingDateTime: z.string().datetime().optional(),
    meetingPlace: z.string().min(2).optional(),
    preferredDateTime: z.string().datetime().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    citizenName: z.string().min(2).optional(),
    citizenMobile: z.string().regex(mobileRegex).optional(),
    citizenArea: z.string().min(2).optional(),
    citizenDetails: z.string().min(3).optional(),
    contactName: z.string().min(2).optional(),
    contactMobile: z.string().regex(mobileRegex).optional(),
    contactDesignation: z.string().min(2).optional(),
    contactDepartment: z.string().min(2).optional(),
  })
  .superRefine((payload, ctx) => {
    if (payload.type === "CITIZEN_MEET") {
      if (!payload.preferredDateTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "preferredDateTime is required for CITIZEN_MEET",
          path: ["preferredDateTime"],
        });
      }
      if (!payload.priority) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "priority is required for CITIZEN_MEET",
          path: ["priority"],
        });
      }
      if (!payload.citizenName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "citizenName is required for CITIZEN_MEET",
          path: ["citizenName"],
        });
      }
      if (!payload.citizenMobile) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "citizenMobile is required for CITIZEN_MEET",
          path: ["citizenMobile"],
        });
      }
      if (!payload.citizenArea) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "citizenArea is required for CITIZEN_MEET",
          path: ["citizenArea"],
        });
      }
      if (!payload.citizenDetails) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "citizenDetails is required for CITIZEN_MEET",
          path: ["citizenDetails"],
        });
      }
      return;
    }

    if (!payload.meetingDateTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "meetingDateTime is required for non-citizen meetings",
        path: ["meetingDateTime"],
      });
    }
    if (!payload.meetingPlace) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "meetingPlace is required for non-citizen meetings",
        path: ["meetingPlace"],
      });
    }

    if (
      payload.type === "DEPARTMENT_VISIT" ||
      payload.type === "PERSONAL_MEET"
    ) {
      if (!payload.contactName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "contactName is required",
          path: ["contactName"],
        });
      }
      if (!payload.contactMobile) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "contactMobile is required",
          path: ["contactMobile"],
        });
      }
      if (!payload.contactDesignation) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "contactDesignation is required",
          path: ["contactDesignation"],
        });
      }
      if (!payload.contactDepartment) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "contactDepartment is required",
          path: ["contactDepartment"],
        });
      }
    }
  });

export const approveMeetingSchema = z.object({
  meetingDateTime: z.string().datetime(),
  meetingPlace: z.string().min(2),
  approvalRemarks: z.string().optional(),
});

export const rejectMeetingSchema = z.object({
  rejectionRemarks: z.string().min(3),
});

export const completeMeetingSchema = z.object({
  completionRemarks: z.string().min(3).optional(),
});
