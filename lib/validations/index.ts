import { z } from "zod";

export const OrgSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  legalName: z.string().max(200).optional(),
  country: z.string().min(2, "Country is required").max(100),
  website: z.union([z.string().url("Invalid URL"), z.literal("")]).optional(),
  type: z.enum(["NGO", "COMPANY", "INDIVIDUAL", "OTHER"]),
  description: z.string().max(2000).optional(),
});
export type OrgInput = z.infer<typeof OrgSchema>;

export const ContactSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(50).optional(),
  title: z.string().max(200).optional(),
  organizationId: z.string().cuid().optional(),
});
export type ContactInput = z.infer<typeof ContactSchema>;

export const InitiativeSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  organizationId: z.string().cuid().optional(),
  individualName: z.string().max(200).optional(),
  primaryContactId: z.string().cuid().optional(),
  areaId: z.string().cuid({ message: "Area is required" }),
  country: z.string().min(2, "Country is required").max(100),
  summary: z
    .string()
    .min(1, "Summary is required")
    .max(1000, "Summary must be under 1000 characters"),
  source: z.string().max(500).optional(),
  needsTechReview: z.boolean().default(false),
  fitScore: z.coerce.number().min(0).max(10).optional(),
  thematicAlignment: z.string().max(2000).optional(),
  strategicFitNotes: z.string().max(2000).optional(),
  solutionStrengthNotes: z.string().max(2000).optional(),
  executionCapacityNotes: z.string().max(2000).optional(),
  scopingCallStatus: z
    .enum([
      "NOT_SCHEDULED",
      "SCHEDULED",
      "COMPLETED",
      "CANCELLED",
    ])
    .optional(),
  scopingCallNotes: z.string().max(2000).optional(),
  scopingCallDate: z.coerce.date().optional(),
});
export type InitiativeInput = z.infer<typeof InitiativeSchema>;
