"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function FilterChip({
  active = false,
  className,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      data-slot="filter-chip"
      data-active={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-dotted px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-purple bg-[color-mix(in_srgb,var(--purple)_12%,white)] text-purple-deep"
          : "border-border text-muted-foreground hover:bg-cream-soft hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}

export { FilterChip };
