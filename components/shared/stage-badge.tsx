import { Badge } from "@/components/ui/badge";
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

const STAGE_COLORS: Partial<Record<Stage, string>> = {
  SOURCED: "bg-slate-100 text-slate-700",
  SCOPING: "bg-blue-100 text-blue-700",
  SCREENING_MATERIALS_REQUESTED: "bg-blue-100 text-blue-700",
  CONCEPT_REVIEW: "bg-violet-100 text-violet-700",
  CONCEPT_DECISION: "bg-violet-100 text-violet-700",
  APPLICATION_REQUESTED: "bg-amber-100 text-amber-700",
  APPLICATION_RECEIVED: "bg-amber-100 text-amber-700",
  APPLICATION_REVIEW: "bg-amber-100 text-amber-700",
  MEMO_DRAFTING: "bg-orange-100 text-orange-700",
  PEER_REVIEW: "bg-orange-100 text-orange-700",
  CEO_COMMITTEE_REVIEW: "bg-rose-100 text-rose-700",
  MEMO_DECISION: "bg-rose-100 text-rose-700",
  LEGAL_DUE_DILIGENCE: "bg-teal-100 text-teal-700",
  LEGAL_DD_COMPLETE: "bg-teal-100 text-teal-700",
  ONBOARDING: "bg-emerald-100 text-emerald-700",
  ACTIVE: "bg-green-100 text-green-700",
};

export function StageBadge({ stage }: { stage: Stage }) {
  const color = STAGE_COLORS[stage] ?? "bg-gray-100 text-gray-700";
  return (
    <Badge className={`${color} border-0 font-medium`}>
      {STAGE_LABELS[stage]}
    </Badge>
  );
}

export { STAGE_LABELS };
