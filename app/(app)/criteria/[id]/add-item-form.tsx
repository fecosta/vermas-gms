"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type State = { errors?: Record<string, string[]>; message?: string } | null;

interface AddItemFormProps {
  action: (prev: State, formData: FormData) => Promise<State>;
  nextOrder: number;
}

export function AddItemForm({ action, nextOrder }: AddItemFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<State, FormData>(action, null);

  useEffect(() => {
    if (state?.message && !state?.errors) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="order" value={nextOrder} />

      <div className="space-y-1.5">
        <Label htmlFor="label">Label *</Label>
        <Input id="label" name="label" placeholder="e.g. Financial sustainability" />
        {state?.errors?.label && (
          <p className="text-xs text-destructive">{state.errors.label[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guidance">Guidance</Label>
        <Textarea id="guidance" name="guidance" rows={2} placeholder="Evaluator guidance…" />
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding…" : "Add item"}
      </Button>
    </form>
  );
}
