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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addChecklistItem } from "@/app/actions/legal";
import { PlusIcon } from "lucide-react";

export function AddChecklistItemDialog({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = addChecklistItem.bind(null, caseId);
  const [state, formAction, pending] = useActionState(boundAction, null);

  useEffect(() => {
    if (state?.message && !state.errors) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <PlusIcon className="size-4 mr-1" />
        Add item
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add checklist item</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="requiredDocName">Document name *</Label>
            <Input
              id="requiredDocName"
              name="requiredDocName"
              required
              aria-invalid={!!state?.errors?.requiredDocName}
            />
            {state?.errors?.requiredDocName && (
              <p className="text-xs text-destructive">{state.errors.requiredDocName[0]}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isRequired" name="isRequired" value="true" defaultChecked />
            <Label htmlFor="isRequired">Required</Label>
            <input type="hidden" name="isRequired" value="false" />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Adding…" : "Add item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
