import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { getLegalCase } from "@/lib/db/legal";
import { can } from "@/lib/authz";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StageBadge } from "@/components/shared/stage-badge";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { ChecklistTable } from "@/components/legal/checklist-table";
import { AddChecklistItemDialog } from "@/components/legal/add-checklist-item-dialog";
import { CompleteCaseButton } from "@/components/legal/complete-case-button";
import { ValidateTrustButton } from "@/components/legal/validate-trust-button";
import { ChevronLeftIcon } from "lucide-react";
import { LEGAL_TONE } from "../page";

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

const TRUST_TONE: Record<string, StatusTone> = {
  NOT_SENT: "neutral",
  SENT: "purple",
  VALIDATED: "green",
  REJECTED: "danger",
};

export default async function LegalCasePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  if (!can(user, "legal-dd:view")) {
    return notFound();
  }

  const legalCase = await getLegalCase(caseId);

  const isAD = user.role === "AD";
  const canComplete = isAD && legalCase.status === "VALIDATED";
  const canValidate =
    isAD &&
    legalCase.status !== "VALIDATED" &&
    legalCase.status !== "COMPLETE" &&
    legalCase.checklistItems.every(
      (item) => !item.isRequired || item.status === "ACCEPTED"
    );

  const trust = legalCase.trustValidationStatus ?? "NOT_SENT";

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/legal" />}
          className="mb-2 -ml-2"
        >
          <ChevronLeftIcon className="size-4" />
          All cases
        </Button>
        <PageHeader
          title={legalCase.initiative.name}
          description="Legal Due Diligence"
          action={
            <div className="flex items-center gap-2">
              {isAD && <AddChecklistItemDialog caseId={caseId} />}
              {canValidate && <ValidateTrustButton caseId={caseId} />}
              {canComplete && <CompleteCaseButton caseId={caseId} />}
            </div>
          }
        />
      </div>

      <Card>
        <CardContent className="grid gap-4 py-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Case status">
            <StatusChip tone={LEGAL_TONE[legalCase.status] ?? "neutral"}>
              {CASE_STATUS_LABELS[legalCase.status] ?? legalCase.status}
            </StatusChip>
          </Meta>
          <Meta label="Initiative stage">
            <StageBadge stage={legalCase.initiative.stage} />
          </Meta>
          <Meta label="Trust validation">
            <StatusChip tone={TRUST_TONE[trust] ?? "neutral"}>
              {trust.replace("_", " ")}
            </StatusChip>
          </Meta>
          <Meta label="AD">
            <span className="font-medium text-foreground">{legalCase.ad.name}</span>
          </Meta>
          <Meta label="Organization">
            <span className="font-medium text-foreground">{legalCase.organization.name}</span>
          </Meta>
          <Meta label="Revisions">
            <span className="font-medium text-foreground">{legalCase.revisionCount}</span>
          </Meta>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Document checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ChecklistTable items={legalCase.checklistItems} isAD={isAD} />
        </CardContent>
      </Card>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
