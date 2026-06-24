"use client";

import { COLUMN_ORDER, columnForStage } from "@/lib/workflow";
import { InitiativeCard } from "./initiative-card";
import { cn } from "@/lib/utils";
import type { InitiativeRow } from "@/lib/db/initiatives";

interface PipelineBoardProps {
  initiatives: InitiativeRow[];
}

// 7 fixed CRM columns derived from the 16 detailed stages via columnForStage().
export function PipelineBoard({ initiatives }: PipelineBoardProps) {
  const byColumn = COLUMN_ORDER.reduce<Record<string, InitiativeRow[]>>(
    (acc, col) => {
      acc[col] = [];
      return acc;
    },
    {}
  );
  for (const i of initiatives) {
    byColumn[columnForStage(i.stage)].push(i);
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div
        className="flex items-start"
        style={{ minWidth: `${COLUMN_ORDER.length * 256}px` }}
      >
        {COLUMN_ORDER.map((col, idx) => {
          const cards = byColumn[col] ?? [];
          return (
            <div
              key={col}
              className={cn(
                "w-64 shrink-0 px-4",
                idx < COLUMN_ORDER.length - 1 && "border-r border-dotted border-border"
              )}
            >
              <div className="mb-3 flex items-baseline gap-2 px-1">
                <span className="truncate text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {col}
                </span>
                <span className="font-serif text-xl leading-none text-foreground">
                  {cards.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {cards.length === 0 ? (
                  <p className="py-2 text-xs text-faint">—</p>
                ) : (
                  cards.map((initiative) => (
                    <InitiativeCard key={initiative.id} initiative={initiative} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
