import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Soft-tinted chip: brand color mixed into white for the fill, the -deep variant
// for the text, and a solid dot. Colored text on cream always uses -deep variants.
const statusChipVariants = cva(
  "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        green:
          "bg-[color-mix(in_srgb,var(--green)_16%,white)] text-green-deep",
        purple:
          "bg-[color-mix(in_srgb,var(--purple)_16%,white)] text-purple-deep",
        danger:
          "bg-[color-mix(in_srgb,var(--danger)_16%,white)] text-danger-deep",
        neutral: "bg-cream-soft text-muted-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

const DOT_CLASS: Record<NonNullable<StatusTone>, string> = {
  green: "bg-green",
  purple: "bg-purple",
  danger: "bg-danger",
  neutral: "bg-faint",
};

type StatusTone = VariantProps<typeof statusChipVariants>["tone"];

function StatusChip({
  tone = "neutral",
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof statusChipVariants>) {
  return (
    <span className={cn(statusChipVariants({ tone }), className)} {...props}>
      <span className={cn("size-1.5 rounded-full", DOT_CLASS[tone ?? "neutral"])} />
      {children}
    </span>
  );
}

export { StatusChip, statusChipVariants, type StatusTone };
