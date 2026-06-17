import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [stageCounts, pendingDecisionInitiatives, stuckInitiatives, recentLogs, legalInProgress] =
    await Promise.all([
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
    ]);

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
