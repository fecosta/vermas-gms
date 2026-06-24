import * as React from "react";

import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  hint,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div
      data-slot="stat-card"
      className={cn(
        "rounded-xl border border-dotted border-border bg-card p-4",
        className
      )}
      {...props}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-serif text-3xl leading-none text-foreground">
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function StatStrip({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-strip"
      className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}
      {...props}
    />
  );
}

export { StatStrip, StatCard };
