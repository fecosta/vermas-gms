import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { getLegalCase } from "@/lib/db/legal";
import { can } from "@/lib/authz";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StageBadge } from "@/components/shared/stage-badge";
import { ChecklistTable } from "@/components/legal/checklist-table";
import { AddChecklistItemDialog } from "@/components/legal/add-checklist-item-dialog";
import { CompleteCaseButton } from "@/components/legal/complete-case-button";
import { ValidateTrustButton } from "@/components/legal/validate-trust-button";
import { ChevronLeftIcon } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/legal" />}
          className="mb-2 -ml-2"
        >
          <ChevronLeftIcon className="size-4 mr-1" />
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

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Case status</span>
          <p className="font-medium mt-0.5">{CASE_STATUS_LABELS[legalCase.status] ?? legalCase.status}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Initiative stage</span>
          <div className="mt-0.5">
            <StageBadge stage={legalCase.initiative.stage} />
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Trust validation</span>
          <p className="font-medium mt-0.5">
            {legalCase.trustValidationStatus ?? "Not started"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">Organization</span>
          <p className="font-medium mt-0.5">{legalCase.organization.name}</p>
        </div>
        <div>
          <span className="text-muted-foreground">AD</span>
          <p className="font-medium mt-0.5">{legalCase.ad.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ChecklistTable items={legalCase.checklistItems} isAD={isAD} />
        </CardContent>
      </Card>
    </div>
  );
}
