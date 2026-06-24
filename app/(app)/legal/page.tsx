import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { getLegalCases } from "@/lib/db/legal";
import { can } from "@/lib/authz";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StageBadge } from "@/components/shared/stage-badge";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";

const CASE_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not started",
  REQUESTED: "Requested",
  DOCUMENTS_PENDING: "Documents pending",
  SUBMITTED: "Submitted",
  UNDER_AD_REVIEW: "Under AD review",
  REVISIONS_REQUESTED: "Revisions requested",
  RESUBMITTED: "Resubmitted",
  TRUST_VALIDATION: "Trust validation",
  VALIDATED: "Validated",
  REJECTED: "Rejected",
  COMPLETE: "Complete",
};

export const LEGAL_TONE: Record<string, StatusTone> = {
  NOT_STARTED: "neutral",
  REQUESTED: "purple",
  DOCUMENTS_PENDING: "purple",
  SUBMITTED: "purple",
  UNDER_AD_REVIEW: "purple",
  REVISIONS_REQUESTED: "danger",
  RESUBMITTED: "purple",
  TRUST_VALIDATION: "purple",
  VALIDATED: "green",
  REJECTED: "danger",
  COMPLETE: "green",
};

export default async function LegalPage() {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  if (!can(user, "legal-dd:view")) {
    return (
      <EmptyState
        title="Access restricted"
        description="You don't have permission to view legal due diligence cases."
      />
    );
  }

  const cases = await getLegalCases();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Legal Due Diligence"
        description={`${cases.length} case${cases.length !== 1 ? "s" : ""}`}
      />

      {cases.length === 0 ? (
        <EmptyState
          title="No legal DD cases"
          description="Legal due diligence cases are created automatically when an initiative reaches the Legal DD stage."
        />
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <Link key={c.id} href={`/legal/${c.id}`} className="block">
              <Card className="transition-colors hover:bg-cream-soft">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{c.initiative.name}</p>
                    <p className="text-sm text-muted-foreground">{c.organization.name}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <StageBadge stage={c.initiative.stage} />
                    <StatusChip tone={LEGAL_TONE[c.status] ?? "neutral"}>
                      {CASE_STATUS_LABELS[c.status] ?? c.status}
                    </StatusChip>
                    <span className="text-xs text-muted-foreground">AD: {c.ad.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {c._count.checklistItems} items
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
