import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { getGrant } from "@/lib/db/grants";
import { prisma } from "@/lib/db/client";
import { can } from "@/lib/authz";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { GrantForm } from "@/components/grants/grant-form";
import { KPITable } from "@/components/grants/kpi-table";
import { createOrUpdateGrant } from "@/app/actions/grants";
import { CompleteOnboardingButton } from "@/components/initiatives/complete-onboarding-button";
import { ChevronLeftIcon } from "lucide-react";

const GRANT_TONE: Record<string, StatusTone> = {
  ACTIVE: "green",
  PAUSED: "purple",
  CLOSED: "neutral",
};

const ONBOARDING_TONE: Record<string, StatusTone> = {
  NOT_STARTED: "neutral",
  SCHEDULED: "purple",
  IN_PROGRESS: "purple",
  COMPLETED: "green",
};

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const initiative = await prisma.initiative.findUnique({
    where: { id },
    select: { id: true, name: true, stage: true, assignedAlId: true },
  });
  if (!initiative) notFound();

  const grant = await getGrant(id);

  const canEdit =
    can(user, "grant:edit") &&
    (user.role === "ADMIN" || initiative.assignedAlId === user.id);

  const boundAction = createOrUpdateGrant.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href={`/initiatives/${id}`} />}
          className="mb-2 -ml-2"
        >
          <ChevronLeftIcon className="size-4" />
          Back to initiative
        </Button>
        <PageHeader
          title="Onboarding"
          description={initiative.name}
          action={
            canEdit && grant && grant.onboardingStatus !== "COMPLETED" ? (
              <CompleteOnboardingButton initiativeId={id} />
            ) : undefined
          }
        />
      </div>

      {grant?.onboardingStatus === "COMPLETED" && (
        <div className="rounded-xl border border-dotted border-border bg-[color-mix(in_srgb,var(--green)_12%,white)] px-4 py-3 text-sm font-medium text-green-deep">
          Onboarding complete — this initiative is now an active grant.
        </div>
      )}

      {grant && (
        <Card>
          <CardContent className="grid gap-4 py-4 text-sm sm:grid-cols-3">
            <Meta label="Grant status">
              <StatusChip tone={GRANT_TONE[grant.status] ?? "neutral"}>{grant.status}</StatusChip>
            </Meta>
            <Meta label="Onboarding">
              <StatusChip tone={ONBOARDING_TONE[grant.onboardingStatus] ?? "neutral"}>
                {grant.onboardingStatus.replace("_", " ")}
              </StatusChip>
            </Meta>
            <Meta label="Area lead">
              <span className="font-medium text-foreground">{grant.areaLead.name}</span>
            </Meta>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Grant details</CardTitle>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <GrantForm action={boundAction} grant={grant} />
          ) : grant ? (
            <div className="space-y-2 text-sm">
              {grant.amount && (
                <p>
                  <span className="font-medium">Amount: </span>
                  {grant.currency} {grant.amount.toLocaleString()}
                </p>
              )}
              {grant.reportingCadence && (
                <p>
                  <span className="font-medium">Reporting cadence: </span>
                  {grant.reportingCadence}
                </p>
              )}
              {grant.nextReportDue && (
                <p>
                  <span className="font-medium">Next report due: </span>
                  {new Date(grant.nextReportDue).toLocaleDateString()}
                </p>
              )}
              {grant.supportType.length > 0 && (
                <p>
                  <span className="font-medium">Support types: </span>
                  {grant.supportType.join(", ")}
                </p>
              )}
              {grant.scope && (
                <p>
                  <span className="font-medium">Scope: </span>
                  {grant.scope}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Grant details will be added during onboarding.
            </p>
          )}
        </CardContent>
      </Card>

      {grant && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Key performance indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <KPITable grantId={grant.id} kpis={grant.kpis} canEdit={canEdit} />
          </CardContent>
        </Card>
      )}
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
