"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type State = { errors?: Record<string, string[]>; message?: string } | null;

interface Props {
  action: (_prev: State, formData: FormData) => Promise<State>;
}

export function CreateAreaForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-3 max-w-md">
      <div className="space-y-1.5">
        <Label htmlFor="newAreaName">Name *</Label>
        <Input id="newAreaName" name="name" placeholder="e.g. Climate & Environment" />
        {state?.errors?.name && (
          <p className="text-xs text-destructive">{state.errors.name[0]}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="newAreaDesc">Description</Label>
        <Textarea
          id="newAreaDesc"
          name="description"
          rows={2}
          placeholder="Optional description…"
        />
        {state?.errors?.description && (
          <p className="text-xs text-destructive">{state.errors.description[0]}</p>
        )}
      </div>
      {state?.message && !state?.errors && (
        <p className="text-xs text-green-700">{state.message}</p>
      )}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Creating…" : "Create area"}
      </Button>
    </form>
  );
}
