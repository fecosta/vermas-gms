"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { XIcon } from "lucide-react";
import { addSupportingAt, removeSupportingAt } from "@/app/actions/initiatives";

interface TeamMember {
  userId: string;
  user: { name: string; role: string };
}

interface Props {
  initiativeId: string;
  currentTeam: TeamMember[];
  atUsers: { id: string; name: string; role: string }[];
}

export function SupportingAtAssignment({ initiativeId, currentTeam, atUsers }: Props) {
  const [addValue, setAddValue] = useState("__none__");
  const [isPending, startTransition] = useTransition();

  const available = atUsers.filter((u) => !currentTeam.some((t) => t.userId === u.id));

  const handleAdd = (value: string | null) => {
    if (!value || value === "__none__") return;
    setAddValue("__none__");
    startTransition(async () => {
      await addSupportingAt(initiativeId, value);
    });
  };

  const handleRemove = (userId: string) => {
    startTransition(async () => {
      await removeSupportingAt(initiativeId, userId);
    });
  };

  return (
    <div className="space-y-2">
      {currentTeam.length === 0 ? (
        <p className="text-sm text-muted-foreground">No supporting AT assigned.</p>
      ) : (
        <div className="space-y-1.5">
          {currentTeam.map((s) => (
            <div key={s.userId} className="flex items-center justify-between gap-2">
              <div className="text-sm min-w-0">
                <span className="font-medium">{s.user.name}</span>
                <span className="ml-1 text-xs text-muted-foreground">{s.user.role}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => handleRemove(s.userId)}
                className="h-6 w-6 p-0 shrink-0"
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      {available.length > 0 && (
        <Select
          value={addValue}
          onValueChange={(v: string | null) => handleAdd(v)}
          disabled={isPending}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Add team member…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__" className="text-xs text-muted-foreground">
              Add team member…
            </SelectItem>
            {available.map((u) => (
              <SelectItem key={u.id} value={u.id} className="text-xs">
                {u.name}
                <span className="ml-1 text-muted-foreground text-xs">{u.role}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
