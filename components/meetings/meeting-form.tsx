"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type State = { errors?: Record<string, string[]>; message?: string } | null;

interface MeetingFormProps {
  action: (prev: State, formData: FormData) => Promise<State>;
  onSuccess?: () => void;
}

export function MeetingForm({ action, onSuccess }: MeetingFormProps) {
  const [state, formAction, pending] = useActionState(async (prev: State, formData: FormData) => {
    const result = await action(prev, formData);
    if (result?.message && !result?.errors) {
      onSuccess?.();
    }
    return result;
  }, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="type">Type *</Label>
          <Select name="type">
            <SelectTrigger id="type" className="w-full">
              <SelectValue placeholder="Select type…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CONCEPT_REVIEW">Concept Review</SelectItem>
              <SelectItem value="MEMO_REVIEW">Memo Review</SelectItem>
              <SelectItem value="KICKOFF">Kickoff</SelectItem>
            </SelectContent>
          </Select>
          {state?.errors?.type && (
            <p className="text-xs text-destructive">{state.errors.type[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dateTime">Date & time *</Label>
          <input
            id="dateTime"
            name="dateTime"
            type="datetime-local"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {state?.errors?.dateTime && (
            <p className="text-xs text-destructive">{state.errors.dateTime[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" placeholder="e.g. Concept review with team" />
        {state?.errors?.title && (
          <p className="text-xs text-destructive">{state.errors.title[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="externalParticipants">External participants</Label>
        <Input id="externalParticipants" name="externalParticipants" placeholder="Names of external attendees" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="agenda">Agenda</Label>
        <Textarea id="agenda" name="agenda" rows={3} placeholder="Meeting agenda…" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="minutes">Minutes</Label>
        <Textarea id="minutes" name="minutes" rows={4} placeholder="Meeting minutes…" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="decisions">Decisions</Label>
        <Textarea id="decisions" name="decisions" rows={3} placeholder="Key decisions made…" />
      </div>

      {state?.message && !state?.errors && (
        <p className="text-xs text-green-700">{state.message}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save meeting"}
      </Button>
    </form>
  );
}
