import * as React from "react";

import { cn } from "@/lib/utils";

type StatAccent = "neutral" | "purple" | "green" | "danger";

const ACCENT_STRIPE: Record<StatAccent, string> = {
  neutral: "bg-faint",
  purple: "bg-purple",
  green: "bg-green",
  danger: "bg-danger",
};

function StatCard({
  label,
  value,
  hint,
  accent = "neutral",
  valueClassName,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent?: StatAccent;
  valueClassName?: string;
}) {
  return (
    <div
      data-slot="stat-card"
      className={cn(
        "relative overflow-hidden rounded-xl border border-dotted border-border bg-card p-4 pl-5",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1", ACCENT_STRIPE[accent])}
      />
      <p className={cn("font-serif text-3xl leading-none text-foreground", valueClassName)}>
        {value}
      </p>
      <p className="mt-2 text-xs leading-snug text-muted-foreground">{label}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
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
