import Link from "next/link";
import { StageBadge } from "@/components/shared/stage-badge";
import type { InitiativeRow } from "@/lib/db/initiatives";

export function InitiativeCard({ initiative }: { initiative: InitiativeRow }) {
  return (
    <Link
      href={`/initiatives/${initiative.id}`}
      className="block rounded-lg border bg-card p-3 hover:border-ring/50 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-medium text-sm leading-snug">{initiative.name}</span>
      </div>
      <div className="space-y-1">
        {initiative.organization && (
          <p className="text-xs text-muted-foreground truncate">
            {initiative.organization.name}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{initiative.country}</p>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground truncate">
          {initiative.assignedAl.name}
        </span>
        <StageBadge stage={initiative.stage} />
      </div>
    </Link>
  );
}
