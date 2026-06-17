"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { completeLegalCase } from "@/app/actions/legal";
import { CheckCircleIcon } from "lucide-react";

export function CompleteCaseButton({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await completeLegalCase(caseId);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <CheckCircleIcon className="size-4 mr-1" />
        Complete DD
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Complete legal due diligence</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Mark this legal DD case as complete. The initiative will advance to the Legal DD
          Complete stage, allowing the AL to proceed to Onboarding.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Completing…" : "Complete DD"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
