import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatStrip, StatCard } from "@/components/ui/stat";
import { StatusChip } from "@/components/ui/status-chip";
import { StageBadge } from "@/components/shared/stage-badge";
import { AuditLogTable } from "@/components/shared/audit-log-table";
import { COLUMN_ORDER, columnForStage } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import type { Stage } from "@/app/generated/prisma/enums";

const CASE_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not started",
  REQUESTED: "Requested",
  DOCUMENTS_PENDING: "Documents pending",
  SUBMITTED: "Submitted",
  UNDER_AD_REVIEW: "Under review",
  REVISIONS_REQUESTED: "Revisions requested",
  RESUBMITTED: "Resubmitted",
  TRUST_VALIDATION: "Trust validation",
  VALIDATED: "Validated",
  REJECTED: "Rejected",
  COMPLETE: "Complete",
};

// Bar colour per pipeline column (fills/bars may use bright accents; never yellow on cream).
const COLUMN_BAR: Record<string, string> = {
  Sourcing: "bg-faint",
  Screening: "bg-purple",
  Application: "bg-purple",
  "Memo Review": "bg-purple",
  "Legal Due Diligence": "bg-purple",
  Onboarding: "bg-green",
  "Active Grant Management": "bg-green",
};

function daysSince(date: Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  if (user.role === "PEER_REVIEWER") redirect("/reviews");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    stageCounts,
    pendingDecisionInitiatives,
    stuckInitiatives,
    recentLogs,
    legalInProgress,
    myInitiatives,
    myLegalCases,
    strategyDocsNeedingAttention,
  ] = await Promise.all([
    prisma.initiative.groupBy({ by: ["stage"], _count: true }),
    prisma.initiative.findMany({
      where: { stage: { in: ["CONCEPT_REVIEW", "CEO_COMMITTEE_REVIEW"] } },
      select: { id: true, name: true, stage: true, updatedAt: true },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.initiative.findMany({
      where: {
        stage: { notIn: ["ACTIVE"] },
        updatedAt: { lt: thirtyDaysAgo },
      },
      select: { id: true, name: true, stage: true, updatedAt: true },
      orderBy: { updatedAt: "asc" },
      take: 10,
    }),
    prisma.auditLog.findMany({
      include: { actor: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.legalDueDiligenceCase.count({
      where: { status: { notIn: ["COMPLETE", "REJECTED"] } },
    }),
    user.role === "AL"
      ? prisma.initiative.findMany({
          where: { assignedAlId: user.id, stage: { notIn: ["ACTIVE"] } },
          select: { id: true, name: true, stage: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 8,
        })
      : Promise.resolve([] as { id: string; name: string; stage: Stage; updatedAt: Date }[]),
    user.role === "AD"
      ? prisma.legalDueDiligenceCase.findMany({
          where: { adId: user.id, status: { notIn: ["COMPLETE", "REJECTED"] } },
          select: {
            id: true,
            status: true,
            initiative: { select: { name: true } },
          },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([] as { id: string; status: string; initiative: { name: string } }[]),
    user.role === "KMD"
      ? prisma.strategyDocument.findMany({
          where: { status: { in: ["DRAFT", "IN_REVIEW"] } },
          select: { id: true, title: true, status: true },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([] as { id: string; title: string; status: string }[]),
  ]);

  const activeInitiatives = await prisma.initiative.findMany({
    where: {
      stage: "ACTIVE",
      ...(user.role === "AL" ? { assignedAlId: user.id } : {}),
    },
    select: {
      id: true,
      name: true,
      assignedAl: { select: { name: true } },
      grant: { select: { status: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  const onboardingInitiatives =
    user.role === "AT"
      ? await prisma.initiative.findMany({
          where: { stage: "ONBOARDING" },
          select: {
            id: true,
            name: true,
            assignedAl: { select: { name: true } },
            grant: { select: { onboardingStatus: true } },
          },
          orderBy: { updatedAt: "desc" },
        })
      : [];

  const countByColumn: Record<string, number> = {};
  for (const col of COLUMN_ORDER) countByColumn[col] = 0;
  for (const s of stageCounts) {
    countByColumn[columnForStage(s.stage)] += s._count;
  }
  const total = stageCounts.reduce((sum, s) => sum + s._count, 0);

  // ---- Presentation-only derived values ----
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user.name.split(/\s+/)[0];
  const roleLabel = user.role.replace("_", " ");
  const isCeo = user.role === "CEO";
  const pendingTitle = isCeo ? "Pending your decisions" : "Pending CEO decisions";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {dateLabel} · {roleLabel}
          </p>
          <h1 className="mt-1.5 font-serif text-3xl text-foreground">
            {greeting}, {firstName}
          </h1>
        </div>
        <Button render={<Link href="/initiatives" />}>
          <ArrowUpRight className="text-yellow" />
          Open pipeline
        </Button>
      </div>

      {/* Stat strip — real pipeline metrics */}
      <StatStrip>
        <StatCard accent="purple" label="Initiatives in pipeline" value={total} />
        <StatCard
          accent="purple"
          valueClassName="text-purple-deep"
          label={isCeo ? "Decisions pending you" : "Pending CEO decisions"}
          value={pendingDecisionInitiatives.length}
        />
        <StatCard
          accent="danger"
          valueClassName={stuckInitiatives.length > 0 ? "text-danger-deep" : undefined}
          label="Stuck over 30 days"
          value={stuckInitiatives.length}
        />
        <StatCard accent="green" label="Legal DD in progress" value={legalInProgress} />
      </StatStrip>

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* LEFT */}
        <div className="flex min-w-0 flex-col gap-6">
          <SectionCard title={pendingTitle} count={pendingDecisionInitiatives.length}>
            {pendingDecisionInitiatives.length === 0 ? (
              <EmptyLine>No pending decisions.</EmptyLine>
            ) : (
              <div className="flex flex-col">
                {pendingDecisionInitiatives.map((i) => {
                  const isConcept = i.stage === "CONCEPT_REVIEW";
                  return (
                    <Row
                      key={i.id}
                      href={
                        isConcept
                          ? `/initiatives/${i.id}/concept-review`
                          : `/initiatives/${i.id}/memo`
                      }
                    >
                      <StatusChip tone={isConcept ? "purple" : "green"}>
                        {isConcept ? "Concept" : "Memo"}
                      </StatusChip>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {i.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Waiting {daysSince(i.updatedAt)}d
                        </p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                        Review
                      </span>
                    </Row>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Role-specific "my work" */}
          {user.role === "AL" && myInitiatives.length > 0 && (
            <SectionCard title="My pipeline" count={myInitiatives.length}>
              <div className="flex flex-col">
                {myInitiatives.map((i) => (
                  <Row key={i.id} href={`/initiatives/${i.id}`}>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {i.name}
                    </span>
                    <StageBadge stage={i.stage} />
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {daysSince(i.updatedAt)}d ago
                    </span>
                  </Row>
                ))}
              </div>
            </SectionCard>
          )}

          {user.role === "AD" && myLegalCases.length > 0 && (
            <SectionCard title="My legal cases" count={myLegalCases.length}>
              <div className="flex flex-col">
                {myLegalCases.map((c) => (
                  <Row key={c.id} href={`/legal/${c.id}`}>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {c.initiative.name}
                    </span>
                    <StatusChip tone="neutral">
                      {CASE_STATUS_LABELS[c.status] ?? c.status}
                    </StatusChip>
                  </Row>
                ))}
              </div>
            </SectionCard>
          )}

          {user.role === "KMD" && strategyDocsNeedingAttention.length > 0 && (
            <SectionCard
              title="Strategy documents"
              count={strategyDocsNeedingAttention.length}
            >
              <div className="flex flex-col">
                {strategyDocsNeedingAttention.map((doc) => (
                  <Row key={doc.id} href={`/strategy/${doc.id}`}>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {doc.title}
                    </span>
                    <StatusChip tone={doc.status === "IN_REVIEW" ? "purple" : "neutral"}>
                      {doc.status.replace("_", " ")}
                    </StatusChip>
                  </Row>
                ))}
              </div>
            </SectionCard>
          )}

          {user.role === "AT" && (
            <SectionCard title="Onboarding queue" count={onboardingInitiatives.length}>
              {onboardingInitiatives.length === 0 ? (
                <EmptyLine>No initiatives in onboarding.</EmptyLine>
              ) : (
                <div className="flex flex-col">
                  {onboardingInitiatives.map((ini) => (
                    <Row key={ini.id} href={`/initiatives/${ini.id}/onboarding`}>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {ini.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          AL: {ini.assignedAl?.name ?? "Unassigned"}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {ini.grant?.onboardingStatus.replace("_", " ") ?? "No grant"}
                      </span>
                    </Row>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          <SectionCard title="Stuck over 30 days" count={stuckInitiatives.length}>
            {stuckInitiatives.length === 0 ? (
              <EmptyLine>Nothing stuck — the pipeline is moving.</EmptyLine>
            ) : (
              <div className="flex flex-col">
                {stuckInitiatives.map((i) => (
                  <Row key={i.id} href={`/initiatives/${i.id}`}>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {i.name}
                    </span>
                    <StageBadge stage={i.stage} />
                    <span className="shrink-0 text-xs font-semibold text-danger-deep">
                      {daysSince(i.updatedAt)}d
                    </span>
                  </Row>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* RIGHT */}
        <div className="flex min-w-0 flex-col gap-6">
          <SectionCard title="Pipeline by column" eyebrow>
            <div className="flex flex-col">
              {COLUMN_ORDER.map((col) => (
                <div
                  key={col}
                  className="flex items-center gap-3 border-t border-dotted border-border py-2.5 first:border-t-0"
                >
                  <span className={cn("size-2.5 shrink-0 rounded-sm", COLUMN_BAR[col])} />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {col}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {countByColumn[col] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Active portfolio — dark panel (yellow allowed on this surface) */}
          <section className="rounded-2xl bg-panel p-5 text-panel-foreground shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              Active portfolio
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-4xl leading-none">
                {activeInitiatives.length}
              </span>
              <span className="text-sm text-white/70">
                active {activeInitiatives.length === 1 ? "grant" : "grants"}
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-1 border-t border-dotted border-white/15 pt-3">
              {activeInitiatives.length === 0 ? (
                <p className="text-sm text-white/55">No active grants yet.</p>
              ) : (
                activeInitiatives.slice(0, 6).map((i) => (
                  <Link
                    key={i.id}
                    href={`/initiatives/${i.id}/active`}
                    className="flex items-center gap-2.5 py-1 text-sm text-white/85 transition-colors hover:text-white"
                  >
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-sm",
                        i.grant?.status === "PAUSED"
                          ? "bg-yellow"
                          : i.grant?.status === "CLOSED"
                          ? "bg-faint"
                          : "bg-green"
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">{i.name}</span>
                    {user.role !== "AL" && i.assignedAl?.name ? (
                      <span className="shrink-0 text-xs text-white/45">
                        {i.assignedAl.name}
                      </span>
                    ) : null}
                  </Link>
                ))
              )}
            </div>
          </section>

          <SectionCard title="Recent activity" eyebrow>
            <AuditLogTable entries={recentLogs} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ---- Local presentation helpers (server components) ----

function SectionCard({
  title,
  count,
  eyebrow = false,
  children,
}: {
  title: string;
  count?: number;
  eyebrow?: boolean;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          {eyebrow ? (
            <CardTitle className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {title}
            </CardTitle>
          ) : (
            <CardTitle className="text-xl">{title}</CardTitle>
          )}
          {typeof count === "number" && count > 0 ? (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
              {count}
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Row({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md border-t border-dotted border-border px-1 py-3 transition-colors first:border-t-0 hover:bg-cream-soft"
    >
      {children}
    </Link>
  );
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="py-2 text-sm text-muted-foreground">{children}</p>;
}
