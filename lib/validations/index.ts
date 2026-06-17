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

export const DecisionSchema = z.object({
  type: z.enum(["CONCEPT", "MEMO", "STRATEGY"]),
  decision: z.enum([
    "APPROVED",
    "REJECTED",
    "REVISION_REQUESTED",
    "CONDITIONALLY_APPROVED",
    "DEFERRED",
  ]),
  rationale: z.string().max(5000).optional(),
  conditions: z.string().max(2000).optional(),
});
export type DecisionInput = z.infer<typeof DecisionSchema>;

export const ReviewNoteSchema = z.object({
  protocolNotes: z.string().max(5000).optional(),
  reviewComments: z.string().max(5000).optional(),
});
export type ReviewNoteInput = z.infer<typeof ReviewNoteSchema>;

export const PeerReviewSchema = z.object({
  reviewText: z.string().min(1, "Review text is required").max(10000),
});
export type PeerReviewInput = z.infer<typeof PeerReviewSchema>;

export const ChecklistItemSchema = z.object({
  requiredDocName: z.string().min(1, "Document name is required").max(200),
  description: z.string().max(500).optional(),
  isRequired: z.coerce.boolean().default(true),
});
export type ChecklistItemInput = z.infer<typeof ChecklistItemSchema>;

export const GrantSchema = z.object({
  amount: z.coerce.number().min(0).optional(),
  currency: z.string().max(10).optional(),
  reportingCadence: z.string().max(200).optional(),
  nextReportDue: z.coerce.date().optional(),
  scope: z.string().max(5000).optional(),
  reportingConditions: z.string().max(5000).optional(),
  supportType: z.array(z.enum(["MEL", "TECH", "STRATEGIC"])).default([]),
});
export type GrantInput = z.infer<typeof GrantSchema>;

export const KPISchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(500).optional(),
  target: z.string().max(200).optional(),
  cadence: z.string().max(200).optional(),
});
export type KPIInput = z.infer<typeof KPISchema>;

export const MeetingSchema = z.object({
  type: z.enum(["CONCEPT_REVIEW", "MEMO_REVIEW", "KICKOFF"]),
  title: z.string().min(1, "Title is required").max(200),
  dateTime: z.coerce.date(),
  externalParticipants: z.string().max(500).optional(),
  agenda: z.string().max(5000).optional(),
  minutes: z.string().max(10000).optional(),
  decisions: z.string().max(5000).optional(),
});
export type MeetingInput = z.infer<typeof MeetingSchema>;

export const CriteriaSetSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
});
export type CriteriaSetInput = z.infer<typeof CriteriaSetSchema>;

export const CriteriaItemSchema = z.object({
  label: z.string().min(1, "Label is required").max(500),
  guidance: z.string().max(2000).optional(),
  order: z.coerce.number().int().default(0),
});
export type CriteriaItemInput = z.infer<typeof CriteriaItemSchema>;

export const StrategyDocSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  type: z.enum([
    "PROCESS_MAP",
    "INVESTMENT_CRITERIA",
    "TOC",
    "THESIS",
    "LEARNING_AGENDA",
  ]),
  body: z.string().max(50000).optional(),
  areaIds: z.array(z.string()).default([]),
});
export type StrategyDocInput = z.infer<typeof StrategyDocSchema>;
