"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateApplication, type ApplicationEditState } from "@/app/actions/applications";

interface Props {
  applicationId: string;
  initial: {
    type: string | null;
    whyYes: string | null;
    whyNot: string | null;
    submittedDate: Date | null;
  };
}

export function ApplicationEditForm({ applicationId, initial }: Props) {
  const boundAction = updateApplication.bind(null, applicationId);
  const [state, formAction, pending] = useActionState<ApplicationEditState, FormData>(
    boundAction,
    null
  );

  const defaultDate = initial.submittedDate
    ? new Date(initial.submittedDate).toISOString().split("T")[0]
    : "";

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="appType">Grant type</Label>
        <Input
          id="appType"
          name="type"
          defaultValue={initial.type ?? ""}
          placeholder="e.g. Unrestricted, Project-based"
          aria-invalid={!!state?.errors?.type}
        />
        {state?.errors?.type && (
          <p className="text-xs text-destructive">{state.errors.type[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="whyYes">Why proceed?</Label>
        <Textarea
          id="whyYes"
          name="whyYes"
          rows={4}
          defaultValue={initial.whyYes ?? ""}
          placeholder="Reasons to move forward with this application…"
          aria-invalid={!!state?.errors?.whyYes}
        />
        {state?.errors?.whyYes && (
          <p className="text-xs text-destructive">{state.errors.whyYes[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="whyNot">Concerns / why not?</Label>
        <Textarea
          id="whyNot"
          name="whyNot"
          rows={4}
          defaultValue={initial.whyNot ?? ""}
          placeholder="Risks, concerns, or reasons to pause…"
          aria-invalid={!!state?.errors?.whyNot}
        />
        {state?.errors?.whyNot && (
          <p className="text-xs text-destructive">{state.errors.whyNot[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="submittedDate">Submitted date</Label>
        <Input
          id="submittedDate"
          name="submittedDate"
          type="date"
          defaultValue={defaultDate}
          aria-invalid={!!state?.errors?.submittedDate}
        />
        {state?.errors?.submittedDate && (
          <p className="text-xs text-destructive">{state.errors.submittedDate[0]}</p>
        )}
      </div>

      {state?.message && !state.errors && (
        <p className="text-sm text-green-600">{state.message}</p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
