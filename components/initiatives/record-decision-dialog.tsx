"use client";

import { useState, useEffect, useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DecisionFormState } from "@/app/actions/decisions";
import type { DecisionType } from "@/app/generated/prisma/enums";
import { CheckIcon } from "lucide-react";

interface RecordDecisionDialogProps {
  action: (prev: DecisionFormState, formData: FormData) => Promise<DecisionFormState>;
  decisionType: DecisionType;
  onSuccess?: () => void;
}

export function RecordDecisionDialog({
  action,
  decisionType,
  onSuccess,
}: RecordDecisionDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.message && !state.errors) {
      setOpen(false);
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <CheckIcon className="size-4 mr-1" />
        Record Decision
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Record {decisionType === "CONCEPT" ? "Concept" : "Memo"} Decision
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="type" value={decisionType} />

          <div className="space-y-1.5">
            <Label htmlFor="decision">Outcome *</Label>
            <Select name="decision">
              <SelectTrigger id="decision" className="w-full" aria-invalid={!!state?.errors?.decision}>
                <SelectValue placeholder="Select outcome…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="CONDITIONALLY_APPROVED">Conditionally Approved</SelectItem>
                <SelectItem value="REVISION_REQUESTED">Revision Requested</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="DEFERRED">Deferred</SelectItem>
              </SelectContent>
            </Select>
            {state?.errors?.decision && (
              <p className="text-xs text-destructive">{state.errors.decision[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rationale">Rationale</Label>
            <Textarea id="rationale" name="rationale" rows={4} placeholder="Reasoning for this decision…" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="conditions">Conditions</Label>
            <Textarea id="conditions" name="conditions" rows={2} placeholder="Any conditions attached (optional)…" />
          </div>

          {state?.message && !state.errors && (
            <p className="text-sm text-green-600">{state.message}</p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Recording…" : "Record Decision"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
