import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { getInitiative } from "@/lib/db/initiatives";
import { PageHeader } from "@/components/shared/page-header";
import { StageBadge } from "@/components/shared/stage-badge";
import { AuditLogTable } from "@/components/shared/audit-log-table";
import { StageTransitionButton } from "@/components/initiatives/stage-transition-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/authz";
import { EditIcon } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InitiativeDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  let data;
  try {
    data = await getInitiative(id);
  } catch {
    notFound();
  }

  const { initiative, auditLogs } = data;

  const canEdit = can(user, "initiative:edit", {
    type: "initiative",
    assignedAlId: initiative.assignedAlId,
    supportingAtIds: initiative.supportingAt.map((s) => s.userId),
  });

  const lastConceptDecision =
    initiative.decisions.find((d) => d.type === "CONCEPT")?.decision ?? null;
  const lastMemoDecision =
    initiative.decisions.find((d) => d.type === "MEMO")?.decision ?? null;

  const reviewReport = initiative.application?.reviewReport ?? null;
  const peerReviews = reviewReport?.memo?.peerReviews ?? [];
  const legalCase = initiative.legalDdCase ?? null;

  const stageActionLink: Record<string, string> = {
    CONCEPT_REVIEW: `./concept-review`,
    CONCEPT_DECISION: `./concept-review`,
    APPLICATION_REVIEW: `./application-review`,
    MEMO_DRAFTING: `./memo`,
    PEER_REVIEW: `./memo`,
    CEO_COMMITTEE_REVIEW: `./memo`,
    ONBOARDING: `./onboarding`,
    ...(legalCase ? {
      LEGAL_DUE_DILIGENCE: `/legal/${legalCase.id}`,
      LEGAL_DD_COMPLETE: `/legal/${legalCase.id}`,
    } : {}),
  };
  const subPageLink = stageActionLink[initiative.stage];

  return (
    <div className="space-y-6">
      <PageHeader
        title={initiative.name}
        description={`${initiative.country} · ${initiative.area.name}`}
        action={
          <div className="flex items-center gap-2">
            <StageBadge stage={initiative.stage} />
            {canEdit && (
              <Button variant="outline" size="sm" render={<Link href={`/initiatives/${id}/edit`} />}>
                <EditIcon className="size-4 mr-1" />
                Edit
              </Button>
            )}
            <StageTransitionButton
              initiative={{
                id: initiative.id,
                stage: initiative.stage,
                assignedAlId: initiative.assignedAlId,
              }}
              user={user}
              context={{
                lastConceptDecision,
                lastMemoDecision,
                reviewReportStatus: reviewReport?.status ?? null,
                legalDdCaseStatus: legalCase?.status ?? null,
                peerReviewerNominated: peerReviews.length >= 2,
                peerReviewsComplete:
                  peerReviews.length >= 2 &&
                  peerReviews.every((pr) => pr.status === "COMPLETE"),
              }}
            />
          </div>
        }
      />

      {subPageLink && (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            This initiative is in a stage with a dedicated workflow view.
          </p>
          <Button size="sm" variant="outline" render={<Link href={subPageLink} />}>
            Open workflow →
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {/* Main details */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {initiative.organization && (
                <Row label="Organization">
                  <Link
                    href={`/organizations/${initiative.organization.id}`}
                    className="underline underline-offset-3"
                  >
                    {initiative.organization.name}
                  </Link>
                </Row>
              )}
              {initiative.individualName && (
                <Row label="Individual" value={initiative.individualName} />
              )}
              <Row label="Country" value={initiative.country} />
              <Row label="Area" value={initiative.area.name} />
              <Row label="Lead (AL)">
                <span>{initiative.assignedAl.name}</span>
                <span className="text-muted-foreground ml-1 text-xs">
                  {initiative.assignedAl.email}
                </span>
              </Row>
              {initiative.source && (
                <Row label="Source" value={initiative.source} />
              )}
              <Separator />
              <div>
                <p className="text-muted-foreground mb-1">Summary</p>
                <p className="text-sm">{initiative.summary}</p>
              </div>
            </CardContent>
          </Card>

          {(initiative.thematicAlignment ||
            initiative.strategicFitNotes ||
            initiative.solutionStrengthNotes ||
            initiative.executionCapacityNotes ||
            initiative.fitScore != null) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {initiative.fitScore != null && (
                  <Row label="Fit score" value={`${initiative.fitScore}/10`} />
                )}
                {initiative.thematicAlignment && (
                  <NoteRow label="Thematic alignment" value={initiative.thematicAlignment} />
                )}
                {initiative.strategicFitNotes && (
                  <NoteRow label="Strategic fit" value={initiative.strategicFitNotes} />
                )}
                {initiative.solutionStrengthNotes && (
                  <NoteRow label="Solution strength" value={initiative.solutionStrengthNotes} />
                )}
                {initiative.executionCapacityNotes && (
                  <NoteRow label="Execution capacity" value={initiative.executionCapacityNotes} />
                )}
              </CardContent>
            </Card>
          )}

          {initiative.scopingCallStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Scoping call</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="Status">
                  <Badge variant="outline">{initiative.scopingCallStatus.replace("_", " ")}</Badge>
                </Row>
                {initiative.scopingCallDate && (
                  <Row
                    label="Date"
                    value={new Date(initiative.scopingCallDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  />
                )}
                {initiative.scopingCallNotes && (
                  <NoteRow label="Notes" value={initiative.scopingCallNotes} />
                )}
              </CardContent>
            </Card>
          )}

          {initiative.decisions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Decisions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {initiative.decisions.map((d) => (
                    <div key={d.id} className="py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium capitalize">{d.type.toLowerCase()} decision</span>
                        <DecisionBadge outcome={d.decision} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        By {d.decidedBy.name} ·{" "}
                        {new Date(d.decidedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      {d.rationale && (
                        <p className="text-xs mt-1">{d.rationale}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Supporting team</CardTitle>
            </CardHeader>
            <CardContent>
              {initiative.supportingAt.length === 0 ? (
                <p className="text-sm text-muted-foreground">No supporting AT assigned.</p>
              ) : (
                <div className="space-y-1">
                  {initiative.supportingAt.map((s) => (
                    <div key={s.userId} className="text-sm">
                      {s.user.name}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {s.user.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {initiative.contacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {initiative.contacts.map((ic) => (
                    <div key={ic.contactId}>
                      <Link
                        href={`/contacts/${ic.contact.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {ic.contact.fullName}
                      </Link>
                      {ic.contact.title && (
                        <p className="text-xs text-muted-foreground">{ic.contact.title}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Activity log</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditLogTable entries={auditLogs} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground w-36 shrink-0">{label}</span>
      {children ?? <span>{value}</span>}
    </div>
  );
}

function NoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

const OUTCOME_COLORS: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CONDITIONALLY_APPROVED: "bg-amber-100 text-amber-700",
  REVISION_REQUESTED: "bg-amber-100 text-amber-700",
  DEFERRED: "bg-slate-100 text-slate-700",
};

function DecisionBadge({ outcome }: { outcome: string }) {
  const color = OUTCOME_COLORS[outcome] ?? "bg-gray-100 text-gray-700";
  return (
    <Badge className={`${color} border-0 font-medium capitalize text-xs`}>
      {outcome.toLowerCase().replace(/_/g, " ")}
    </Badge>
  );
}
