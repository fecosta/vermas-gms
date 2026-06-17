"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type State = { errors?: Record<string, string[]>; message?: string } | null;

interface CriteriaEditFormProps {
  action: (prev: State, formData: FormData) => Promise<State>;
  defaultName: string;
  defaultDescription: string;
}

export function CriteriaEditForm({ action, defaultName, defaultDescription }: CriteriaEditFormProps) {
  const [state, formAction, pending] = useActionState<State, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" name="name" defaultValue={defaultName} />
        {state?.errors?.name && (
          <p className="text-xs text-destructive">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={defaultDescription} />
      </div>

      {state?.message && !state?.errors && (
        <p className="text-xs text-green-700">{state.message}</p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
