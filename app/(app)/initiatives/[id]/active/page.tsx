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
import { EmptyState } from "@/components/shared/empty-state";
import { KPITable } from "@/components/grants/kpi-table";
import { GrantStatusControls } from "@/components/grants/grant-status-controls";
import { ChevronLeftIcon } from "lucide-react";

export default async function ActiveGrantPage({
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
        <PageHeader title="Active Grant" description={initiative.name} />
      </div>

      {!grant ? (
        <EmptyState
          title="No grant found"
          description="A grant is created automatically when the initiative enters Onboarding."
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Grant details</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="grid grid-cols-2 gap-4">
                {grant.amount != null && (
                  <div>
                    <p className="text-muted-foreground text-xs">Amount</p>
                    <p className="font-medium mt-0.5">
                      {grant.currency} {grant.amount.toLocaleString()}
                    </p>
                  </div>
                )}
                {grant.reportingCadence && (
                  <div>
                    <p className="text-muted-foreground text-xs">Reporting cadence</p>
                    <p className="font-medium mt-0.5">{grant.reportingCadence}</p>
                  </div>
                )}
                {grant.nextReportDue && (
                  <div>
                    <p className="text-muted-foreground text-xs">Next report due</p>
                    <p className="font-medium mt-0.5">
                      {new Date(grant.nextReportDue).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {grant.areaLead && (
                  <div>
                    <p className="text-muted-foreground text-xs">Area lead</p>
                    <p className="font-medium mt-0.5">{grant.areaLead.name}</p>
                  </div>
                )}
              </div>
              {grant.supportType.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs">Support types</p>
                  <p className="font-medium mt-0.5">{grant.supportType.join(", ")}</p>
                </div>
              )}
              {grant.scope && (
                <div>
                  <p className="text-muted-foreground text-xs">Scope</p>
                  <p className="mt-0.5">{grant.scope}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Grant status</CardTitle>
            </CardHeader>
            <CardContent>
              {canEdit ? (
                <GrantStatusControls
                  initiativeId={id}
                  currentStatus={grant.status}
                />
              ) : (
                <p className="text-sm">
                  <span className="font-medium">Status: </span>
                  {grant.status}
                </p>
              )}
            </CardContent>
          </Card>

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
        </div>
      )}
    </div>
  );
}
