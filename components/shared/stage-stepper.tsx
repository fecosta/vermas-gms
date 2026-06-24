import { cn } from "@/lib/utils";
import { COLUMN_ORDER, columnForStage } from "@/lib/workflow";
import type { Stage } from "@/app/generated/prisma/enums";

// The dotted 7-step journey, derived from the workflow column model (never the
// raw Stage enum). Completed / current / upcoming states.
export function StageStepper({
  stage,
  className,
}: {
  stage: Stage;
  className?: string;
}) {
  const currentIdx = COLUMN_ORDER.indexOf(columnForStage(stage));

  return (
    <ol className={cn("flex flex-wrap items-center gap-2", className)}>
      {COLUMN_ORDER.map((col, i) => {
        const state =
          i < currentIdx ? "complete" : i === currentIdx ? "current" : "upcoming";
        return (
          <li key={col} className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full border border-dotted px-2.5 py-1 text-xs font-medium",
                state === "complete" && "border-green/50 text-green-deep",
                state === "current" &&
                  "border-purple bg-[color-mix(in_srgb,var(--purple)_12%,white)] text-purple-deep",
                state === "upcoming" && "border-border text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  state === "complete" && "bg-green",
                  state === "current" && "bg-purple",
                  state === "upcoming" && "bg-faint"
                )}
              />
              {col}
            </span>
            {i < COLUMN_ORDER.length - 1 && (
              <span className="hidden h-px w-4 border-t border-dotted border-border sm:inline-block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
