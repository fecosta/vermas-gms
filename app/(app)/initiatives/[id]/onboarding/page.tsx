import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { getGrant } from "@/lib/db/grants";
import { prisma } from "@/lib/db/client";
import { can } from "@/lib/authz";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { GrantForm } from "@/components/grants/grant-form";
import { KPITable } from "@/components/grants/kpi-table";
import { createOrUpdateGrant } from "@/app/actions/grants";
import { CompleteOnboardingButton } from "@/components/initiatives/complete-onboarding-button";
import { ChevronLeftIcon } from "lucide-react";

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

  const canEdit = can(user, "grant:edit") && (
    user.role === "ADMIN" ||
    initiative.assignedAlId === user.id
  );

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
          <ChevronLeftIcon className="size-4 mr-1" />
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
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Onboarding complete. This initiative is now active.
        </div>
      )}

      {grant && (
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Status</span>
            <p className="font-medium mt-0.5">{grant.status}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Onboarding status</span>
            <p className="font-medium mt-0.5">
              {grant.onboardingStatus.replace("_", " ")}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Area lead</span>
            <p className="font-medium mt-0.5">{grant.areaLead.name}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Grant details</CardTitle>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <GrantForm action={boundAction} grant={grant} />
          ) : grant ? (
            <div className="text-sm space-y-2">
              {grant.amount && (
                <p><span className="font-medium">Amount: </span>{grant.currency} {grant.amount.toLocaleString()}</p>
              )}
              {grant.reportingCadence && (
                <p><span className="font-medium">Reporting cadence: </span>{grant.reportingCadence}</p>
              )}
              {grant.nextReportDue && (
                <p><span className="font-medium">Next report due: </span>{new Date(grant.nextReportDue).toLocaleDateString()}</p>
              )}
              {grant.supportType.length > 0 && (
                <p><span className="font-medium">Support types: </span>{grant.supportType.join(", ")}</p>
              )}
              {grant.scope && <p><span className="font-medium">Scope: </span>{grant.scope}</p>}
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
            <CardTitle>Key performance indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <KPITable
              grantId={grant.id}
              kpis={grant.kpis}
              canEdit={canEdit}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
