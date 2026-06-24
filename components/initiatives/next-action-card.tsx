"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateNextAction } from "@/app/actions/initiatives";
import type { Priority } from "@/app/generated/prisma/enums";

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

type Current = {
  nextAction: string | null;
  nextActionDueDate: Date | null;
  nextActionOwnerId: string | null;
  priority: Priority | null;
};

export function NextActionCard({
  initiativeId,
  current,
  users,
  canEdit,
}: {
  initiativeId: string;
  current: Current;
  users: { id: string; name: string }[];
  canEdit: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [nextAction, setNextAction] = useState(current.nextAction ?? "");
  const [dueDate, setDueDate] = useState(
    current.nextActionDueDate
      ? new Date(current.nextActionDueDate).toISOString().slice(0, 10)
      : ""
  );
  const [ownerId, setOwnerId] = useState(current.nextActionOwnerId ?? "");
  const [priority, setPriority] = useState<string>(current.priority ?? "");
  const [saved, setSaved] = useState(false);

  if (!canEdit) {
    if (!current.nextAction) {
      return <p className="text-sm text-muted-foreground">No next action set.</p>;
    }
    const owner = users.find((u) => u.id === current.nextActionOwnerId)?.name;
    return (
      <div className="space-y-1 text-sm">
        <p>{current.nextAction}</p>
        {(owner || current.nextActionDueDate) && (
          <p className="text-xs text-muted-foreground">
            {owner}
            {owner && current.nextActionDueDate ? " · " : ""}
            {current.nextActionDueDate &&
              `due ${new Date(current.nextActionDueDate).toLocaleDateString()}`}
          </p>
        )}
      </div>
    );
  }

  function save() {
    setSaved(false);
    startTransition(async () => {
      await updateNextAction(initiativeId, {
        nextAction: nextAction.trim() || null,
        nextActionDueDate: dueDate || null,
        nextActionOwnerId: ownerId || null,
        priority: (priority || null) as Priority | null,
      });
      setSaved(true);
    });
  }

  return (
    <div className="space-y-2">
      <Input
        value={nextAction}
        onChange={(e) => {
          setNextAction(e.target.value);
          setSaved(false);
        }}
        placeholder="Next action…"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => {
            setDueDate(e.target.value);
            setSaved(false);
          }}
          className="h-8 rounded-md border bg-background px-2 text-xs"
          aria-label="Due date"
        />
        <select
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value);
            setSaved(false);
          }}
          className="h-8 rounded-md border bg-background px-2 text-xs"
          aria-label="Priority"
        >
          <option value="">No priority</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <select
        value={ownerId}
        onChange={(e) => {
          setOwnerId(e.target.value);
          setSaved(false);
        }}
        className="h-8 w-full rounded-md border bg-background px-2 text-xs"
        aria-label="Owner"
      >
        <option value="">No owner</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {saved && <span className="text-xs text-green-600">Saved</span>}
      </div>
    </div>
  );
}
