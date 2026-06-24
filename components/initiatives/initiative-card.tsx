import Link from "next/link";
import { FileTextIcon, InboxIcon } from "lucide-react";
import { StageBadge } from "@/components/shared/stage-badge";
import { Avatar } from "@/components/ui/avatar";
import { priorityStripe } from "@/components/ui/priority-indicator";
import { cn } from "@/lib/utils";
import type { InitiativeRow } from "@/lib/db/initiatives";

const ROLLUP_TONE = {
  green: "bg-[color-mix(in_srgb,var(--green)_16%,white)] text-green-deep",
  danger: "bg-[color-mix(in_srgb,var(--danger)_16%,white)] text-danger-deep",
  purple: "bg-[color-mix(in_srgb,var(--purple)_16%,white)] text-purple-deep",
} as const;

function Rollup({
  tone,
  children,
}: {
  tone: keyof typeof ROLLUP_TONE;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-px text-[10px] font-semibold",
        ROLLUP_TONE[tone]
      )}
    >
      {children}
    </span>
  );
}

export function InitiativeCard({ initiative }: { initiative: InitiativeRow }) {
  const nowMs = new Date().getTime();
  const daysSinceUpdate = Math.floor(
    (nowMs - new Date(initiative.updatedAt).getTime()) / 86_400_000
  );
  const stuck = initiative.stage !== "ACTIVE" && daysSinceUpdate > 30;
  const reportOverdue = initiative.grant?.nextReportDue
    ? new Date(initiative.grant.nextReportDue).getTime() < nowMs
    : false;
  const nextOverdue = initiative.nextActionDueDate
    ? new Date(initiative.nextActionDueDate).getTime() < nowMs
    : false;

  const subtitle = initiative.organization?.name
    ? `${initiative.organization.name}${initiative.area ? ` · ${initiative.area.name}` : ""}`
    : initiative.area?.name ?? "—";

  return (
    <Link
      href={`/initiatives/${initiative.id}`}
      className="relative block overflow-hidden rounded-xl border border-dotted border-border bg-card p-3 pl-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {initiative.priority && (
        <span
          aria-hidden
          className={cn("absolute inset-y-0 left-0 w-1", priorityStripe(initiative.priority))}
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-snug text-foreground">
          {initiative.name}
        </span>
        {initiative.hasIntake && (
          <span
            className="shrink-0 rounded-md bg-[color-mix(in_srgb,var(--purple)_16%,white)] px-1.5 py-0.5 text-purple-deep"
            title="From Jotform intake"
          >
            <InboxIcon className="size-3" />
          </span>
        )}
      </div>

      <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <StageBadge stage={initiative.stage} />
        {initiative.ceoDecisionStatus === "APPROVED" && <Rollup tone="green">CEO ✓</Rollup>}
        {initiative.ceoDecisionStatus === "REJECTED" && <Rollup tone="danger">CEO ✗</Rollup>}
        {(initiative.ceoDecisionStatus === "CONDITIONALLY_APPROVED" ||
          initiative.ceoDecisionStatus === "REVISION_REQUESTED") && (
          <Rollup tone="purple">CEO ~</Rollup>
        )}
        {initiative.legalDdStatus === "IN_PROGRESS" && <Rollup tone="purple">Legal</Rollup>}
        {initiative.legalDdStatus === "COMPLETE" && <Rollup tone="green">Legal ✓</Rollup>}
        {initiative.onboardingStatus === "IN_PROGRESS" && (
          <Rollup tone="purple">Onboarding</Rollup>
        )}
      </div>

      {stuck && (
        <div className="mt-2 flex items-center gap-1.5 text-[10.5px] font-semibold text-danger-deep">
          <span className="size-1.5 rounded-full bg-danger" />
          {daysSinceUpdate}d in stage
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-dotted border-border pt-2.5">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-faint">Next</p>
          <p
            className={cn(
              "truncate text-[11.5px] font-medium",
              nextOverdue ? "text-danger-deep" : "text-foreground"
            )}
          >
            {initiative.nextAction ?? "—"}
            {initiative.nextActionDueDate ? (
              <span className="font-normal text-muted-foreground">
                {" · "}
                {new Date(initiative.nextActionDueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {initiative._count.documents > 0 && (
            <span
              className="flex items-center gap-0.5 text-[11px] text-muted-foreground"
              title={`${initiative._count.documents} document(s)`}
            >
              <FileTextIcon className="size-3" />
              {initiative._count.documents}
            </span>
          )}
          {reportOverdue && <Rollup tone="danger">Report due</Rollup>}
          <Avatar name={initiative.assignedAl.name} className="size-6 text-[9px]" />
        </div>
      </div>
    </Link>
  );
}
