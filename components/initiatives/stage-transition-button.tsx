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
import { moveInitiativeStage } from "@/app/actions/initiatives";
import { canTransition, STAGE_ORDER } from "@/lib/workflow";
import { STAGE_LABELS } from "@/components/shared/stage-badge";
import type { Stage, ReviewReportStatus, LegalDDCaseStatus, DecisionOutcome } from "@/app/generated/prisma/enums";
import type { SessionUser } from "@/lib/auth";
import { ArrowRightIcon } from "lucide-react";

interface StageTransitionButtonProps {
  initiative: {
    id: string;
    stage: Stage;
    assignedAlId: string;
  };
  user: SessionUser;
  context?: {
    reviewReportStatus?: ReviewReportStatus | null;
    legalDdCaseStatus?: LegalDDCaseStatus | null;
    lastConceptDecision?: DecisionOutcome | null;
    lastMemoDecision?: DecisionOutcome | null;
    peerReviewsComplete?: boolean;
    peerReviewerNominated?: boolean;
  };
}

export function StageTransitionButton({
  initiative,
  user,
  context = {},
}: StageTransitionButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const currentIdx = STAGE_ORDER.indexOf(initiative.stage);
  const nextStage = STAGE_ORDER[currentIdx + 1] as Stage | undefined;

  if (!nextStage) return null;

  const check = canTransition(
    {
      initiative,
      actor: user,
      ...context,
    },
    nextStage
  );

  if (!check.allowed) return null;

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await moveInitiativeStage(initiative.id, nextStage);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <ArrowRightIcon className="size-4 mr-1" />
        Move to {STAGE_LABELS[nextStage]}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm stage transition</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Move this initiative from{" "}
          <strong>{STAGE_LABELS[initiative.stage]}</strong> to{" "}
          <strong>{STAGE_LABELS[nextStage]}</strong>?
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Moving…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
