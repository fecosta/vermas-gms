import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { columnForStage, type PipelineColumn } from "@/lib/workflow";
import type { Stage } from "@/app/generated/prisma/enums";

const STAGE_LABELS: Record<Stage, string> = {
  SOURCED: "Sourced",
  SCOPING: "Scoping",
  SCREENING_MATERIALS_REQUESTED: "Screening",
  CONCEPT_REVIEW: "Concept Review",
  CONCEPT_DECISION: "Concept Decision",
  APPLICATION_REQUESTED: "App Requested",
  APPLICATION_RECEIVED: "App Received",
  APPLICATION_REVIEW: "App Review",
  MEMO_DRAFTING: "Memo Drafting",
  PEER_REVIEW: "Peer Review",
  CEO_COMMITTEE_REVIEW: "CEO Review",
  MEMO_DECISION: "Memo Decision",
  LEGAL_DUE_DILIGENCE: "Legal DD",
  LEGAL_DD_COMPLETE: "Legal Complete",
  ONBOARDING: "Onboarding",
  ACTIVE: "Active",
};

// Tone follows the pipeline column: early = neutral, mid/in-flight = purple,
// nearing/active = green. Keeps the brand palette (no hardcoded Tailwind colors).
const COLUMN_TONE: Record<PipelineColumn, StatusTone> = {
  Sourcing: "neutral",
  Screening: "neutral",
  Application: "purple",
  "Memo Review": "purple",
  "Legal Due Diligence": "purple",
  Onboarding: "green",
  "Active Grant Management": "green",
};

export function StageBadge({ stage }: { stage: Stage }) {
  return <StatusChip tone={COLUMN_TONE[columnForStage(stage)]}>{STAGE_LABELS[stage]}</StatusChip>;
}

export { STAGE_LABELS };
