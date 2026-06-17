"use client";

import { STAGE_ORDER } from "@/lib/workflow";
import { STAGE_LABELS } from "@/components/shared/stage-badge";
import { InitiativeCard } from "./initiative-card";
import { Badge } from "@/components/ui/badge";
import type { InitiativeRow } from "@/lib/db/initiatives";

interface PipelineBoardProps {
  initiatives: InitiativeRow[];
}

export function PipelineBoard({ initiatives }: PipelineBoardProps) {
  const byStage = STAGE_ORDER.reduce<Record<string, InitiativeRow[]>>(
    (acc, stage) => {
      acc[stage] = initiatives.filter((i) => i.stage === stage);
      return acc;
    },
    {}
  );

  const activeStages = STAGE_ORDER.filter(
    (stage) => (byStage[stage]?.length ?? 0) > 0
  );

  if (activeStages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No initiatives to display.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div
        className="flex gap-4"
        style={{ minWidth: `${activeStages.length * 220}px` }}
      >
        {activeStages.map((stage) => {
          const cards = byStage[stage] ?? [];
          return (
            <div key={stage} className="w-52 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                  {STAGE_LABELS[stage]}
                </span>
                <Badge
                  variant="outline"
                  className="text-xs h-4 px-1.5 min-w-4 justify-center"
                >
                  {cards.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {cards.map((initiative) => (
                  <InitiativeCard key={initiative.id} initiative={initiative} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
