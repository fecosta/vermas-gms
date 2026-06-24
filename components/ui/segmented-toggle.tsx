"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface SegmentedToggleProps<T extends string> {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
  "aria-label"?: string;
}

function SegmentedToggle<T extends string>({
  options,
  value,
  onValueChange,
  className,
  ...props
}: SegmentedToggleProps<T>) {
  return (
    <div
      role="tablist"
      data-slot="segmented-toggle"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-dotted border-border bg-card p-1",
        className
      )}
      {...props}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={opt.value === value}
          data-active={opt.value === value}
          onClick={() => onValueChange(opt.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
            opt.value === value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export { SegmentedToggle };
