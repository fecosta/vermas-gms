"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignCriteriaSet } from "@/app/actions/initiatives";

interface CriteriaAssignmentProps {
  initiativeId: string;
  currentSetId: string | null;
  criteriaSets: { id: string; name: string }[];
}

export function CriteriaAssignment({
  initiativeId,
  currentSetId,
  criteriaSets,
}: CriteriaAssignmentProps) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: string | null) => {
    const setId = value === "__none__" || !value ? null : value;
    startTransition(async () => {
      await assignCriteriaSet(initiativeId, setId);
    });
  };

  return (
    <Select
      value={currentSetId ?? "__none__"}
      onValueChange={(v: string | null) => handleChange(v)}
      disabled={isPending}
    >
      <SelectTrigger className="h-8 text-xs w-64">
        <SelectValue placeholder="Select criteria set…" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__" className="text-xs text-muted-foreground">
          None
        </SelectItem>
        {criteriaSets.map((s) => (
          <SelectItem key={s.id} value={s.id} className="text-xs">
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
