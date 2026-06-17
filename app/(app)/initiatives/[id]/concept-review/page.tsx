import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { can } from "@/lib/authz";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { RecordDecisionDialog } from "@/components/initiatives/record-decision-dialog";
import { recordDecision } from "@/app/actions/decisions";
import { ChevronLeftIcon } from "lucide-react";

const OUTCOME_COLORS: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-800",
  CONDITIONALLY_APPROVED: "bg-blue-100 text-blue-800",
  REVISION_REQUESTED: "bg-yellow-100 text-yellow-800",
  REJECTED: "bg-red-100 text-red-800",
  DEFERRED: "bg-gray-100 text-gray-700",
};

const OUTCOME_LABELS: Record<string, string> = {
  APPROVED: "Approved",
  CONDITIONALLY_APPROVED: "Conditionally Approved",
  REVISION_REQUESTED: "Revision Requested",
  REJECTED: "Rejected",
  DEFERRED: "Deferred",
};

export default async function ConceptReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const initiative = await prisma.initiative.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      stage: true,
      summary: true,
      decisions: {
        where: { type: "CONCEPT" },
        include: { decidedBy: { select: { id: true, name: true } } },
        orderBy: { decidedAt: "desc" },
      },
    },
  });

  if (!initiative) notFound();

  const canDecide =
    can(user, "decision:record") && initiative.stage === "CONCEPT_REVIEW";

  const boundAction = recordDecision.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" render={<Link href={`/initiatives/${id}`} />} className="mb-2 -ml-2">
          <ChevronLeftIcon className="size-4 mr-1" />
          Back to initiative
        </Button>
        <PageHeader
          title="Concept Review"
          description={initiative.name}
          action={
            canDecide ? (
              <RecordDecisionDialog action={boundAction} decisionType="CONCEPT" />
            ) : undefined
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Initiative summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{initiative.summary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Concept decisions</CardTitle>
        </CardHeader>
        <CardContent>
          {initiative.decisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No concept decisions recorded yet.
              {canDecide && " Use the button above to record a decision."}
            </p>
          ) : (
            <div className="space-y-4">
              {initiative.decisions.map((d) => (
                <div key={d.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        OUTCOME_COLORS[d.decision] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {OUTCOME_LABELS[d.decision] ?? d.decision}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {d.decidedBy.name} · {new Date(d.decidedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {d.rationale && (
                    <p className="text-sm">
                      <span className="font-medium">Rationale: </span>
                      {d.rationale}
                    </p>
                  )}
                  {d.conditions && (
                    <p className="text-sm">
                      <span className="font-medium">Conditions: </span>
                      {d.conditions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
