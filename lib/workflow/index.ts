import type {
  Stage,
  ReviewReportStatus,
  LegalDDCaseStatus,
  DecisionOutcome,
} from "@/app/generated/prisma/enums";
import type { SessionUser } from "@/lib/auth";

// ----------------------------------------------------------------
// Ordered stage list (canonical sequence)
// ----------------------------------------------------------------

export const STAGE_ORDER: Stage[] = [
  "SOURCED",
  "SCOPING",
  "SCREENING_MATERIALS_REQUESTED",
  "CONCEPT_REVIEW",
  "CONCEPT_DECISION",
  "APPLICATION_REQUESTED",
  "APPLICATION_RECEIVED",
  "APPLICATION_REVIEW",
  "MEMO_DRAFTING",
  "PEER_REVIEW",
  "CEO_COMMITTEE_REVIEW",
  "MEMO_DECISION",
  "LEGAL_DUE_DILIGENCE",
  "LEGAL_DD_COMPLETE",
  "ONBOARDING",
  "ACTIVE",
];

// ----------------------------------------------------------------
// Context fed into the transition guard
// ----------------------------------------------------------------

export type TransitionContext = {
  initiative: {
    id: string;
    stage: Stage;
    assignedAlId: string;
  };
  actor: SessionUser;
  // Gate prerequisites — caller must populate these from the DB
  reviewReportStatus?: ReviewReportStatus | null;
  legalDdCaseStatus?: LegalDDCaseStatus | null;
  lastConceptDecision?: DecisionOutcome | null;
  lastMemoDecision?: DecisionOutcome | null;
  peerReviewsComplete?: boolean; // true when all 2 peer reviews are COMPLETE
  peerReviewerNominated?: boolean; // true when 2 reviewers have been assigned
};

export type TransitionResult =
  | { allowed: true }
  | { allowed: false; reason: string };

// ----------------------------------------------------------------
// canTransition — the single guarded gate for stage moves
// ----------------------------------------------------------------

export function canTransition(
  ctx: TransitionContext,
  toStage: Stage
): TransitionResult {
  const { initiative, actor } = ctx;
  const fromStage = initiative.stage;
  const isAl = actor.role === "AL" && actor.id === initiative.assignedAlId;
  const isCeo = actor.role === "CEO";
  const isAt = actor.role === "AT";
  const isAd = actor.role === "AD";
  const isKmd = actor.role === "KMD";

  // AT can never move stages
  if (isAt) {
    return { allowed: false, reason: "Area Team members cannot move initiative stages." };
  }

  // Validate this is a known transition
  const transition = `${fromStage}→${toStage}`;

  switch (transition) {
    // ---- Early pipeline (AL-owned) ----
    case "SOURCED→SCOPING":
    case "SCOPING→SCREENING_MATERIALS_REQUESTED":
      if (!isAl) return notAl();
      return ok();

    case "SCREENING_MATERIALS_REQUESTED→CONCEPT_REVIEW":
      if (!isAl) return notAl();
      return ok();

    case "CONCEPT_REVIEW→CONCEPT_DECISION":
      // CEO records a Decision of type CONCEPT — the stage move follows
      if (!isCeo) return { allowed: false, reason: "Only the CEO can record a concept decision." };
      return ok();

    case "CONCEPT_DECISION→APPLICATION_REQUESTED":
      if (!isAl) return notAl();
      if (ctx.lastConceptDecision !== "APPROVED" && ctx.lastConceptDecision !== "CONDITIONALLY_APPROVED") {
        return { allowed: false, reason: "A CEO approval (or conditional approval) is required before requesting an application." };
      }
      return ok();

    case "APPLICATION_REQUESTED→APPLICATION_RECEIVED":
      if (!isAl) return notAl();
      return ok();

    case "APPLICATION_RECEIVED→APPLICATION_REVIEW":
      if (!isAl && !isKmd) {
        return { allowed: false, reason: "Only the AL or KMD can start application review." };
      }
      return ok();

    case "APPLICATION_REVIEW→MEMO_DRAFTING":
      if (!isAl) return notAl();
      // KMD must have signed off the review report
      if (
        ctx.reviewReportStatus !== "KMD_SIGNED" &&
        ctx.reviewReportStatus !== "COMPLETE"
      ) {
        return {
          allowed: false,
          reason: "The KMD must sign off the application review report before drafting the memo.",
        };
      }
      return ok();

    case "MEMO_DRAFTING→PEER_REVIEW":
      if (!isAl) return notAl();
      if (!ctx.peerReviewerNominated) {
        return { allowed: false, reason: "2 peer reviewers must be nominated before moving to peer review." };
      }
      return ok();

    case "PEER_REVIEW→CEO_COMMITTEE_REVIEW":
      if (!isAl) return notAl();
      if (!ctx.peerReviewsComplete) {
        return { allowed: false, reason: "All peer reviewers must complete their review and the AL must respond to comments." };
      }
      return ok();

    case "CEO_COMMITTEE_REVIEW→MEMO_DECISION":
      if (!isCeo) return { allowed: false, reason: "Only the CEO can record a memo decision." };
      return ok();

    case "MEMO_DECISION→LEGAL_DUE_DILIGENCE":
      if (!isAl) return notAl();
      if (ctx.lastMemoDecision !== "APPROVED" && ctx.lastMemoDecision !== "CONDITIONALLY_APPROVED") {
        return { allowed: false, reason: "A CEO approval of the memo is required before starting legal due diligence." };
      }
      return ok();

    case "LEGAL_DUE_DILIGENCE→LEGAL_DD_COMPLETE":
      // Only AD can mark legal DD complete
      if (!isAd) {
        return { allowed: false, reason: "Only the Administrative Director can mark legal due diligence complete." };
      }
      if (ctx.legalDdCaseStatus !== "VALIDATED") {
        return { allowed: false, reason: "The legal due diligence case must be validated before it can be marked complete." };
      }
      return ok();

    case "LEGAL_DD_COMPLETE→ONBOARDING":
      if (!isAl) return notAl();
      if (ctx.legalDdCaseStatus !== "COMPLETE") {
        return { allowed: false, reason: "Legal due diligence must be fully complete before starting onboarding." };
      }
      return ok();

    case "ONBOARDING→ACTIVE":
      if (!isAl && actor.role !== "AT") {
        return { allowed: false, reason: "Only the AL or AT can move an initiative to active." };
      }
      return ok();

    default:
      return {
        allowed: false,
        reason: `No valid transition defined from ${fromStage} to ${toStage}.`,
      };
  }
}

function ok(): TransitionResult {
  return { allowed: true };
}

function notAl(): TransitionResult {
  return {
    allowed: false,
    reason: "Only the assigned Area Lead can perform this stage transition.",
  };
}

// ----------------------------------------------------------------
// Helper: check if a stage is a revision loop (not a forward move)
// ----------------------------------------------------------------

export function isRevisionReturn(fromStage: Stage, toStage: Stage): boolean {
  const fromIdx = STAGE_ORDER.indexOf(fromStage);
  const toIdx = STAGE_ORDER.indexOf(toStage);
  return toIdx < fromIdx;
}

// ----------------------------------------------------------------
// Board columns — a derived 7-column view over the 16 detailed stages.
// Purely for display/grouping; does NOT affect STAGE_ORDER or canTransition.
// ----------------------------------------------------------------

export type PipelineColumn =
  | "Sourcing"
  | "Screening"
  | "Application"
  | "Memo Review"
  | "Legal Due Diligence"
  | "Onboarding"
  | "Active Grant Management";

export const COLUMN_ORDER: PipelineColumn[] = [
  "Sourcing",
  "Screening",
  "Application",
  "Memo Review",
  "Legal Due Diligence",
  "Onboarding",
  "Active Grant Management",
];

// Exhaustive map — TypeScript enforces that every Stage is covered.
const STAGE_TO_COLUMN: Record<Stage, PipelineColumn> = {
  SOURCED: "Sourcing",
  SCOPING: "Sourcing",
  SCREENING_MATERIALS_REQUESTED: "Screening",
  CONCEPT_REVIEW: "Screening",
  CONCEPT_DECISION: "Screening",
  APPLICATION_REQUESTED: "Application",
  APPLICATION_RECEIVED: "Application",
  APPLICATION_REVIEW: "Application",
  MEMO_DRAFTING: "Memo Review",
  PEER_REVIEW: "Memo Review",
  CEO_COMMITTEE_REVIEW: "Memo Review",
  MEMO_DECISION: "Memo Review",
  LEGAL_DUE_DILIGENCE: "Legal Due Diligence",
  LEGAL_DD_COMPLETE: "Legal Due Diligence",
  ONBOARDING: "Onboarding",
  ACTIVE: "Active Grant Management",
};

export function columnForStage(stage: Stage): PipelineColumn {
  return STAGE_TO_COLUMN[stage];
}

// Detailed stages grouped under each column, preserving STAGE_ORDER sequence.
export const STAGES_BY_COLUMN: Record<PipelineColumn, Stage[]> = COLUMN_ORDER.reduce(
  (acc, col) => {
    acc[col] = STAGE_ORDER.filter((s) => STAGE_TO_COLUMN[s] === col);
    return acc;
  },
  {} as Record<PipelineColumn, Stage[]>
);
