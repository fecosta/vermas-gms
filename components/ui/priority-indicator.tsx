import * as React from "react";

import { cn } from "@/lib/utils";
import type { Priority } from "@/app/generated/prisma/enums";

const PRIORITY_META: Record<
  Priority,
  { label: string; dot: string; text: string; stripe: string }
> = {
  URGENT: { label: "Urgent", dot: "bg-danger", text: "text-danger-deep", stripe: "bg-danger" },
  HIGH: { label: "High", dot: "bg-purple", text: "text-purple-deep", stripe: "bg-purple" },
  MEDIUM: { label: "Medium", dot: "bg-green", text: "text-green-deep", stripe: "bg-green" },
  LOW: { label: "Low", dot: "bg-faint", text: "text-muted-foreground", stripe: "bg-faint" },
};

/** Left-edge stripe class for a card, keyed by priority. */
export function priorityStripe(priority: Priority): string {
  return PRIORITY_META[priority].stripe;
}

function PriorityIndicator({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const meta = PRIORITY_META[priority];
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-xs font-medium", meta.text, className)}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export { PriorityIndicator, PRIORITY_META };
