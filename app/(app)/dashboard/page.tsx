import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { StageBadge, STAGE_LABELS } from "@/components/shared/stage-badge";
import { AuditLogTable } from "@/components/shared/audit-log-table";
import type { Stage } from "@/app/generated/prisma/enums";

const FUNNEL_STAGES: Stage[] = [
  "SOURCED",
  "CONCEPT_REVIEW",
  "APPLICATION_REVIEW",
  "MEMO_DRAFTING",
  "PEER_REVIEW",
  "CEO_COMMITTEE_REVIEW",
  "LEGAL_DUE_DILIGENCE",
  "ONBOARDING",
  "ACTIVE",
];

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

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  if (user.role === "PEER_REVIEWER") redirect("/reviews");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

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

  const countByStage: Record<string, number> = {};
  for (const s of stageCounts) {
    countByStage[s.stage] = s._count;
  }

  const total = stageCounts.reduce((sum, s) => sum + s._count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.name}`}
      />

      {/* Role-specific "My work" section */}
      {user.role === "AL" && myInitiatives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              My pipeline
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({myInitiatives.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myInitiatives.map((i) => {
                const daysAgo = Math.floor(
                  (Date.now() - new Date(i.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <Link
                    key={i.id}
                    href={`/initiatives/${i.id}`}
                    className="flex items-center justify-between py-1.5 border-b last:border-0 hover:text-primary transition-colors"
                  >
                    <span className="text-sm truncate mr-2">{i.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <StageBadge stage={i.stage} />
                      <span className="text-xs text-muted-foreground">{daysAgo}d ago</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {user.role === "AD" && myLegalCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              My legal cases
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({myLegalCases.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myLegalCases.map((c) => (
                <Link
                  key={c.id}
                  href={`/legal/${c.id}`}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 hover:text-primary transition-colors"
                >
                  <span className="text-sm truncate mr-2">{c.initiative.name}</span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {CASE_STATUS_LABELS[c.status] ?? c.status}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeInitiatives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Active portfolio
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({activeInitiatives.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeInitiatives.map((i) => (
                <Link
                  key={i.id}
                  href={`/initiatives/${i.id}/active`}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 hover:text-primary transition-colors"
                >
                  <div>
                    <p className="text-sm truncate mr-2">{i.name}</p>
                    {user.role !== "AL" && (
                      <p className="text-xs text-muted-foreground">
                        AL: {i.assignedAl?.name ?? "—"}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ${
                      i.grant?.status === "PAUSED"
                        ? "border-amber-300 text-amber-700"
                        : i.grant?.status === "CLOSED"
                        ? "text-muted-foreground"
                        : ""
                    }`}
                  >
                    {i.grant?.status ?? "No grant"}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {user.role === "AT" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Onboarding queue
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({onboardingInitiatives.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {onboardingInitiatives.length === 0 ? (
              <p className="text-sm text-muted-foreground">No initiatives in onboarding.</p>
            ) : (
              <div className="space-y-2">
                {onboardingInitiatives.map((ini) => (
                  <Link
                    key={ini.id}
                    href={`/initiatives/${ini.id}/onboarding`}
                    className="flex items-center justify-between py-1.5 border-b last:border-0 hover:text-primary transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{ini.name}</p>
                      <p className="text-xs text-muted-foreground">
                        AL: {ini.assignedAl?.name ?? "Unassigned"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {ini.grant?.onboardingStatus.replace("_", " ") ?? "No grant"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {user.role === "KMD" && strategyDocsNeedingAttention.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Strategy documents
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({strategyDocsNeedingAttention.length} pending)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {strategyDocsNeedingAttention.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/strategy/${doc.id}`}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 hover:text-primary transition-colors"
                >
                  <span className="text-sm truncate mr-2">{doc.title}</span>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ${doc.status === "IN_REVIEW" ? "border-amber-300 text-amber-700" : ""}`}
                  >
                    {doc.status.replace("_", " ")}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline stat cards */}
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-5">
        {FUNNEL_STAGES.map((stage) => (
          <Card key={stage}>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{countByStage[stage] ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                {STAGE_LABELS[stage]}
              </p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Pending CEO decisions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Pending CEO decisions
              {pendingDecisionInitiatives.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({pendingDecisionInitiatives.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingDecisionInitiatives.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending decisions.</p>
            ) : (
              <div className="space-y-2">
                {pendingDecisionInitiatives.map((i) => (
                  <Link
                    key={i.id}
                    href={
                      i.stage === "CONCEPT_REVIEW"
                        ? `/initiatives/${i.id}/concept-review`
                        : `/initiatives/${i.id}`
                    }
                    className="flex items-center justify-between py-1.5 border-b last:border-0 hover:text-primary transition-colors"
                  >
                    <span className="text-sm truncate mr-2">{i.name}</span>
                    <StageBadge stage={i.stage} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stuck initiatives */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Stuck &gt;30 days
              {stuckInitiatives.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({stuckInitiatives.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stuckInitiatives.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stuck initiatives.</p>
            ) : (
              <div className="space-y-2">
                {stuckInitiatives.map((i) => {
                  const daysStuck = Math.floor(
                    (Date.now() - new Date(i.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <Link
                      key={i.id}
                      href={`/initiatives/${i.id}`}
                      className="flex items-center justify-between py-1.5 border-b last:border-0 hover:text-primary transition-colors"
                    >
                      <span className="text-sm truncate mr-2">{i.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <StageBadge stage={i.stage} />
                        <span className="text-xs text-orange-600">{daysStuck}d</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {legalInProgress > 0 && (
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center justify-between">
            <div>
              <p className="font-medium">{legalInProgress} legal DD case{legalInProgress !== 1 ? "s" : ""} in progress</p>
              <p className="text-sm text-muted-foreground">Pending AD review and trust validation</p>
            </div>
            <Link href="/legal">
              <span className="text-sm text-primary hover:underline">View cases →</span>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogTable entries={recentLogs} />
        </CardContent>
      </Card>
    </div>
  );
}
