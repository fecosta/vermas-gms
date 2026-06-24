import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { getInitiative } from "@/lib/db/initiatives";
import { getComments } from "@/lib/db/comments";
import { getMeetings } from "@/lib/db/meetings";
import { CreateMeetingDialog } from "@/components/meetings/create-meeting-dialog";
import { CriteriaAssignment } from "@/components/initiatives/criteria-assignment";
import { ContactAssignment } from "@/components/initiatives/contact-assignment";
import { SupportingAtAssignment } from "@/components/initiatives/supporting-at-assignment";
import { MeetingParticipantsSection } from "@/components/initiatives/meeting-participants-section";
import { EditMeetingDialog } from "@/components/meetings/edit-meeting-dialog";
import { prisma } from "@/lib/db/client";
import { StageBadge } from "@/components/shared/stage-badge";
import { StageStepper } from "@/components/shared/stage-stepper";
import { AuditLogTable } from "@/components/shared/audit-log-table";
import { CommentThread } from "@/components/shared/comment-thread";
import { StageTransitionButton } from "@/components/initiatives/stage-transition-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/authz";
import { columnForStage } from "@/lib/workflow";
import { addComment } from "@/app/actions/comments";
import type { CommentRelatedType, DecisionOutcome } from "@/app/generated/prisma/enums";
import { DocumentList } from "@/components/documents/document-list";
import { LinkDriveButton } from "@/components/documents/link-drive-button";
import { FolderLinkField } from "@/components/documents/folder-link-field";
import { NextActionCard } from "@/components/initiatives/next-action-card";
import { ArrowLeftIcon, ArrowRightIcon, EditIcon } from "lucide-react";

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

  const [comments, meetings, criteriaSets, allContacts, atUsers, allUsers] = await Promise.all([
    getComments("INITIATIVE" as CommentRelatedType, id),
    getMeetings(id),
    prisma.criteriaSet.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.contact.findMany({
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, title: true },
    }),
    prisma.user.findMany({
      where: { role: { in: ["AT", "AL"] }, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  const canComment = can(user, "comment:create");
  const canLogMeeting = can(user, "meeting:create");
  const canManageParticipants = can(user, "meeting:select-participants");
  const canViewInternal = can(user, "comment:view-internal");
  const boundAddComment = addComment.bind(null, "INITIATIVE" as CommentRelatedType, id);

  const canEdit = can(user, "initiative:edit", {
    type: "initiative",
    assignedAlId: initiative.assignedAlId,
    supportingAtIds: initiative.supportingAt.map((s) => s.userId),
  });
  const canManageDocs = can(user, "document:upload");

  const lastConceptDecision =
    initiative.decisions.find((d) => d.type === "CONCEPT")?.decision ?? null;
  const lastMemoDecision =
    initiative.decisions.find((d) => d.type === "MEMO")?.decision ?? null;

  const reviewReport = initiative.application?.reviewReport ?? null;
  const peerReviews = reviewReport?.memo?.peerReviews ?? [];
  const legalCase = initiative.legalDdCase ?? null;

  const stageActionLink: Record<string, string> = {
    SOURCED: `./scoping`,
    SCOPING: `./scoping`,
    SCREENING_MATERIALS_REQUESTED: `./scoping`,
    APPLICATION_REQUESTED: `./application-request`,
    APPLICATION_RECEIVED: `./application-request`,
    CONCEPT_REVIEW: `./concept-review`,
    CONCEPT_DECISION: `./concept-review`,
    APPLICATION_REVIEW: `./application-review`,
    MEMO_DRAFTING: `./memo`,
    PEER_REVIEW: `./memo`,
    CEO_COMMITTEE_REVIEW: `./memo`,
    MEMO_DECISION: `./memo`,
    ONBOARDING: `./onboarding`,
    ACTIVE: `./active`,
    ...(legalCase
      ? {
          LEGAL_DUE_DILIGENCE: `/legal/${legalCase.id}`,
          LEGAL_DD_COMPLETE: `/legal/${legalCase.id}`,
        }
      : {}),
  };
  const subPageLink = stageActionLink[initiative.stage];

  return (
    <div className="space-y-6">
      <Link
        href="/initiatives"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" /> Pipeline
      </Link>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-dotted border-border bg-card p-6 pl-7">
        <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-purple" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {initiative.area.name}
              </span>
              <span className="size-1 rounded-full bg-faint" />
              <StageBadge stage={initiative.stage} />
            </div>
            <h1 className="mt-2 font-serif text-3xl text-foreground">{initiative.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {initiative.organization ? (
                <Link
                  href={`/organizations/${initiative.organization.id}`}
                  className="hover:text-foreground"
                >
                  {initiative.organization.name}
                </Link>
              ) : (
                initiative.individualName
              )}
              {" · "}
              {initiative.country}
            </p>
            <div className="mt-2.5 flex items-center gap-2 text-sm">
              <Avatar name={initiative.assignedAl.name} className="size-6 text-[9px]" />
              <span className="font-medium text-foreground">{initiative.assignedAl.name}</span>
              <span className="text-xs text-muted-foreground">Area Lead</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/initiatives/${id}/edit`} />}
              >
                <EditIcon className="size-4" />
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
        </div>

        <div className="mt-5 border-t border-dotted border-border pt-5">
          <StageStepper stage={initiative.stage} />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* LEFT — tabbed content */}
        <div className="min-w-0">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">
                Documents ({initiative.documents.length})
              </TabsTrigger>
              <TabsTrigger value="activity">Activity &amp; comments</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="mt-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Overview</CardTitle>
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
                    <span className="ml-1 text-xs text-muted-foreground">
                      {initiative.assignedAl.email}
                    </span>
                  </Row>
                  {initiative.source && <Row label="Source" value={initiative.source} />}
                  <Row label="Drive folder">
                    <FolderLinkField
                      kind="initiative"
                      id={initiative.id}
                      folderName={initiative.googleDriveFolderName}
                      folderUrl={initiative.googleDriveFolderUrl}
                      canManage={canManageDocs}
                    />
                  </Row>
                  <Separator />
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Summary
                    </p>
                    <p className="text-sm leading-relaxed">{initiative.summary}</p>
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
                    <CardTitle className="text-xl">Strategic-fit assessment</CardTitle>
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
                      <NoteRow
                        label="Execution capacity"
                        value={initiative.executionCapacityNotes}
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              {(initiative.criteriaSet || canEdit) && (
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <CardTitle className="text-xl">Evaluation criteria</CardTitle>
                    {canEdit && (
                      <CriteriaAssignment
                        initiativeId={id}
                        currentSetId={initiative.criteriaSet?.id ?? null}
                        criteriaSets={criteriaSets}
                      />
                    )}
                  </CardHeader>
                  {initiative.criteriaSet ? (
                    <CardContent className="space-y-1">
                      <p className="mb-2 text-xs text-muted-foreground">
                        {initiative.criteriaSet.name}
                      </p>
                      <div className="divide-y divide-dotted divide-border">
                        {initiative.criteriaSet.items.map((item) => (
                          <div key={item.id} className="py-2 text-sm">
                            <span className="font-medium">{item.label}</span>
                            {item.guidance && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {item.guidance}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">No criteria set assigned.</p>
                    </CardContent>
                  )}
                </Card>
              )}

              {initiative.scopingCallStatus && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Scoping call</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <Row label="Status">
                      <StatusChip tone="neutral">
                        {initiative.scopingCallStatus.replace("_", " ")}
                      </StatusChip>
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

              <div className="grid gap-6 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Contacts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {canEdit ? (
                      <ContactAssignment
                        initiativeId={id}
                        linked={initiative.contacts}
                        allContacts={allContacts}
                      />
                    ) : initiative.contacts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No contacts assigned.</p>
                    ) : (
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
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Supporting team</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {canEdit ? (
                      <SupportingAtAssignment
                        initiativeId={id}
                        currentTeam={initiative.supportingAt}
                        atUsers={atUsers}
                      />
                    ) : initiative.supportingAt.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No supporting AT assigned.</p>
                    ) : (
                      <div className="space-y-1">
                        {initiative.supportingAt.map((s) => (
                          <div key={s.userId} className="text-sm">
                            {s.user.name}
                            <span className="ml-1 text-xs text-muted-foreground">{s.user.role}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xl">
                    Documents ({initiative.documents.length})
                  </CardTitle>
                  {canManageDocs && (
                    <LinkDriveButton
                      target={{
                        kind: "initiative",
                        initiativeId: initiative.id,
                        type: "CONCEPT_NOTE",
                      }}
                      allowTypeChange
                    />
                  )}
                </CardHeader>
                <CardContent>
                  <DocumentList documents={initiative.documents} canManage={canManageDocs} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity & comments */}
            <TabsContent value="activity" className="mt-4 space-y-6">
              {canComment && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Comments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CommentThread
                      comments={comments}
                      addCommentAction={boundAddComment}
                      canViewInternal={canViewInternal}
                      canSetInternal={canViewInternal}
                    />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl">Meetings</CardTitle>
                  {canLogMeeting && <CreateMeetingDialog initiativeId={id} />}
                </CardHeader>
                <CardContent>
                  {meetings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No meetings recorded.</p>
                  ) : (
                    <div className="divide-y divide-dotted divide-border">
                      {meetings.map((m) => (
                        <div key={m.id} className="py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <StatusChip tone="neutral">{m.type.replace("_", " ")}</StatusChip>
                            <span className="font-medium">{m.title}</span>
                            {canLogMeeting && <EditMeetingDialog meeting={m} />}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {new Date(m.dateTime).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                            {m.externalParticipants && ` · ${m.externalParticipants}`}
                          </p>
                          {m.decisions && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {m.decisions}
                            </p>
                          )}
                          <MeetingParticipantsSection
                            meetingId={m.id}
                            participants={m.participants}
                            allUsers={allUsers}
                            canManage={canManageParticipants}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Activity log</CardTitle>
                </CardHeader>
                <CardContent>
                  <AuditLogTable entries={auditLogs} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT — stage action + next action + decision log */}
        <div className="flex min-w-0 flex-col gap-6">
          {subPageLink && (
            <section className="rounded-2xl bg-panel p-5 text-panel-foreground shadow-lg">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-yellow" />
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                  Current stage · {columnForStage(initiative.stage)}
                </span>
              </div>
              <h3 className="mt-2.5 font-serif text-xl">Continue this stage</h3>
              <p className="mt-1 text-xs leading-relaxed text-white/65">
                Open the dedicated workflow view to record the next step for this stage.
              </p>
              <Button
                className="mt-4 w-full bg-yellow text-panel hover:bg-yellow/90"
                render={<Link href={subPageLink} />}
              >
                Open workflow
                <ArrowRightIcon className="size-4" />
              </Button>
            </section>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Next action</CardTitle>
            </CardHeader>
            <CardContent>
              <NextActionCard
                initiativeId={id}
                current={{
                  nextAction: initiative.nextAction,
                  nextActionDueDate: initiative.nextActionDueDate,
                  nextActionOwnerId: initiative.nextActionOwnerId,
                  priority: initiative.priority,
                }}
                users={allUsers}
                canEdit={canEdit}
              />
            </CardContent>
          </Card>

          {initiative.decisions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Decision log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  {initiative.decisions.map((d) => (
                    <div
                      key={d.id}
                      className="border-t border-dotted border-border py-3 first:border-t-0"
                    >
                      <div className="flex items-center gap-2">
                        <DecisionChip outcome={d.decision} />
                        <span className="ml-auto text-xs text-faint">
                          {new Date(d.decidedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {d.rationale && (
                        <p className="mt-1.5 text-xs leading-relaxed text-foreground/80">
                          {d.rationale}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {d.type.charAt(0) + d.type.slice(1).toLowerCase()} decision · {d.decidedBy.name}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
      <span className="w-36 shrink-0 text-muted-foreground">{label}</span>
      {children ?? <span>{value}</span>}
    </div>
  );
}

function NoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm leading-relaxed">{value}</p>
    </div>
  );
}

const OUTCOME_TONE: Record<DecisionOutcome, StatusTone> = {
  APPROVED: "green",
  REJECTED: "danger",
  CONDITIONALLY_APPROVED: "purple",
  REVISION_REQUESTED: "purple",
  DEFERRED: "neutral",
};

function DecisionChip({ outcome }: { outcome: DecisionOutcome }) {
  return (
    <StatusChip tone={OUTCOME_TONE[outcome]}>
      {outcome.charAt(0) + outcome.slice(1).toLowerCase().replace(/_/g, " ")}
    </StatusChip>
  );
}
