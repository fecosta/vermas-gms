import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { getApplication } from "@/lib/db/applications";
import { getPeerReviewers } from "@/lib/db/users";
import { prisma } from "@/lib/db/client";
import { can } from "@/lib/authz";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { MemoEditor } from "@/components/initiatives/memo-editor";
import { NominateReviewersForm } from "@/components/initiatives/nominate-reviewers-form";
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

const PR_STATUS_LABELS: Record<string, string> = {
  NOT_ASSIGNED: "Not assigned",
  ASSIGNED: "Assigned",
  IN_REVIEW: "In review",
  QUESTIONS_SENT: "Questions sent",
  AL_RESPONSE_PENDING: "AL response pending",
  COMPLETE: "Complete",
};

export default async function MemoPage({
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
      assignedAlId: true,
      decisions: {
        where: { type: "MEMO" },
        include: { decidedBy: { select: { id: true, name: true } } },
        orderBy: { decidedAt: "desc" },
      },
    },
  });
  if (!initiative) notFound();

  const [data, peerReviewers] = await Promise.all([
    getApplication(id),
    getPeerReviewers(),
  ]);

  const canDraft = can(user, "memo:draft", {
    type: "initiative",
    assignedAlId: initiative.assignedAlId,
    supportingAtIds: [],
  });
  const canNominate = can(user, "peer-review:nominate", {
    type: "initiative",
    assignedAlId: initiative.assignedAlId,
    supportingAtIds: [],
  });
  const canDecide =
    can(user, "decision:record") && initiative.stage === "CEO_COMMITTEE_REVIEW";
  const boundDecisionAction = recordDecision.bind(null, id);

  // Pre-fetch reviewer names to avoid async in render
  const reviewerNames: Record<string, string> = {};
  if (data?.peerReviews.length) {
    const reviewerUsers = await prisma.user.findMany({
      where: { id: { in: data.peerReviews.map((pr) => pr.reviewerId) } },
      select: { id: true, name: true },
    });
    for (const u of reviewerUsers) reviewerNames[u.id] = u.name;
  }

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
          title="Investment Memo"
          description={initiative.name}
          action={
            canDecide ? (
              <RecordDecisionDialog action={boundDecisionAction} decisionType="MEMO" />
            ) : undefined
          }
        />
      </div>

      {!data?.memo ? (
        <EmptyState
          title="Memo not yet created"
          description="The investment memo is created automatically when the initiative enters Memo Drafting stage."
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Memo draft</CardTitle>
            </CardHeader>
            <CardContent>
              {canDraft ? (
                <MemoEditor memoId={data.memo.id} initialBody={data.memo.body ?? ""} />
              ) : (
                <p className="text-sm whitespace-pre-wrap">
                  {data.memo.body || (
                    <span className="text-muted-foreground">No content yet.</span>
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Peer reviewers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canNominate && (
                <NominateReviewersForm
                  memoId={data.memo.id}
                  peerReviewers={peerReviewers}
                  currentReviews={data.peerReviews}
                />
              )}

              {data.peerReviews.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">
                        Reviewer
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">
                        Status
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground pb-2">
                        Completed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.peerReviews.map((pr) => (
                      <tr key={pr.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          {reviewerNames[pr.reviewerId] ?? pr.reviewerId}
                        </td>
                        <td className="py-2 pr-4">
                          {PR_STATUS_LABELS[pr.status] ?? pr.status}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {pr.status === "COMPLETE" ? "✓" : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No peer reviewers nominated yet.
                </p>
              )}
            </CardContent>
          </Card>

          {data.memo.ceoQuestions && (
            <Card>
              <CardHeader>
                <CardTitle>CEO questions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{data.memo.ceoQuestions}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>CEO decisions</CardTitle>
            </CardHeader>
            <CardContent>
              {initiative.decisions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No CEO decisions recorded yet.
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
      )}
    </div>
  );
}
