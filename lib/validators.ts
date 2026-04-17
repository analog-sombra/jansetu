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
  type: z.enum(["RESOLVED", "QUERY", "REJECTED"]),
  message: z.string().min(3),
  proofUrl: z.string().optional(),
});

export const confirmResolutionSchema = z.object({
  complaintId: z.coerce.number().int().positive(),
  confirmed: z.boolean(),
  message: z.string().optional(),
});

export const raiseQuerySchema = z.object({
  message: z.string().min(3),
});
