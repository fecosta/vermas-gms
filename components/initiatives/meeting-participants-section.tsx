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
import { addMeetingParticipant, removeMeetingParticipant } from "@/app/actions/meetings";

interface Participant {
  userId: string;
  user: { id: string; name: string };
}

interface Props {
  meetingId: string;
  participants: Participant[];
  allUsers: { id: string; name: string }[];
  canManage: boolean;
}

export function MeetingParticipantsSection({
  meetingId,
  participants,
  allUsers,
  canManage,
}: Props) {
  const [addValue, setAddValue] = useState("__none__");
  const [isPending, startTransition] = useTransition();

  const nonParticipants = allUsers.filter(
    (u) => !participants.some((p) => p.userId === u.id)
  );

  const handleAdd = (value: string | null) => {
    if (!value || value === "__none__") return;
    setAddValue("__none__");
    startTransition(async () => {
      await addMeetingParticipant(meetingId, value);
    });
  };

  const handleRemove = (userId: string) => {
    startTransition(async () => {
      await removeMeetingParticipant(meetingId, userId);
    });
  };

  if (participants.length === 0 && !canManage) return null;

  return (
    <div className="mt-1.5 space-y-1.5">
      {participants.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {participants.map((p) => (
            <span
              key={p.userId}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
            >
              {p.user.name}
              {canManage && (
                <button
                  onClick={() => handleRemove(p.userId)}
                  disabled={isPending}
                  className="hover:text-destructive disabled:opacity-50"
                  aria-label={`Remove ${p.user.name}`}
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      {canManage && nonParticipants.length > 0 && (
        <Select
          value={addValue}
          onValueChange={(v: string | null) => handleAdd(v)}
          disabled={isPending}
        >
          <SelectTrigger className="h-7 text-xs w-48">
            <SelectValue placeholder="Add participant…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__" className="text-xs text-muted-foreground">
              Add participant…
            </SelectItem>
            {nonParticipants.map((u) => (
              <SelectItem key={u.id} value={u.id} className="text-xs">
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
