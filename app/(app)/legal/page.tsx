import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { getLegalCases } from "@/lib/db/legal";
import { can } from "@/lib/authz";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StageBadge } from "@/components/shared/stage-badge";

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

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-700",
  REQUESTED: "bg-blue-100 text-blue-700",
  DOCUMENTS_PENDING: "bg-yellow-100 text-yellow-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_AD_REVIEW: "bg-purple-100 text-purple-700",
  REVISIONS_REQUESTED: "bg-orange-100 text-orange-700",
  RESUBMITTED: "bg-blue-100 text-blue-700",
  TRUST_VALIDATION: "bg-indigo-100 text-indigo-700",
  VALIDATED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  COMPLETE: "bg-emerald-100 text-emerald-700",
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
      <PageHeader title="Legal Due Diligence" description={`${cases.length} case${cases.length !== 1 ? "s" : ""}`} />

      {cases.length === 0 ? (
        <EmptyState
          title="No legal DD cases"
          description="Legal due diligence cases are created automatically when an initiative reaches the Legal DD stage."
        />
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <Link key={c.id} href={`/legal/${c.id}`}>
              <Card className="hover:bg-muted/40 transition-colors cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{c.initiative.name}</p>
                      <p className="text-sm text-muted-foreground">{c.organization.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StageBadge stage={c.initiative.stage} />
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {CASE_STATUS_LABELS[c.status] ?? c.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        AD: {c.ad.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {c._count.checklistItems} items
                      </span>
                    </div>
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
