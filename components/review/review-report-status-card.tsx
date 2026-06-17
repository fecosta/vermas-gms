"use client";

import { useState, useTransition, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { alSignOff, kmdSignOff } from "@/app/actions/review-reports";
import type { ReviewReportStatus } from "@/app/generated/prisma/enums";

const STATUS_LABELS: Record<ReviewReportStatus, string> = {
  IN_PROGRESS: "In Progress",
  AL_SIGNED: "AL Signed",
  KMD_SIGNED: "KMD Signed",
  COMPLETE: "Complete",
};

const STATUS_COLORS: Record<ReviewReportStatus, string> = {
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  AL_SIGNED: "bg-blue-100 text-blue-800",
  KMD_SIGNED: "bg-green-100 text-green-800",
  COMPLETE: "bg-emerald-100 text-emerald-800",
};

interface ReviewReportStatusCardProps {
  reportId: string;
  status: ReviewReportStatus;
  alSignOffAt?: Date | null;
  kmdSignOffAt?: Date | null;
  kmdReviewerName?: string | null;
  protocolNotes?: string | null;
  reviewComments?: string | null;
  userRole: string;
  isAssignedAl: boolean;
}

export function ReviewReportStatusCard({
  reportId,
  status,
  alSignOffAt,
  kmdSignOffAt,
  kmdReviewerName,
  protocolNotes,
  reviewComments,
  userRole,
  isAssignedAl,
}: ReviewReportStatusCardProps) {
  const [isPending, startTransition] = useTransition();
  const [alError, setAlError] = useState<string | null>(null);
  const boundKmdSignOff = kmdSignOff.bind(null, reportId);
  const [kmdState, kmdFormAction, kmdPending] = useActionState(boundKmdSignOff, null);

  const handleAlSignOff = () => {
    startTransition(async () => {
      const result = await alSignOff(reportId);
      if (result?.error) setAlError(result.error);
    });
  };

  const steps: Array<{ label: string; done: boolean; date?: Date | null }> = [
    { label: "Review in progress", done: true },
    { label: "AL signed off", done: status !== "IN_PROGRESS", date: alSignOffAt },
    { label: "KMD signed off", done: status === "KMD_SIGNED" || status === "COMPLETE", date: kmdSignOffAt },
    { label: "Complete", done: status === "COMPLETE" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Status:</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      <div className="flex items-center gap-3 text-sm">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`size-4 rounded-full flex items-center justify-center text-[10px] font-bold ${step.done ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
              {step.done ? "✓" : i + 1}
            </div>
            <span className={step.done ? "text-foreground" : "text-muted-foreground"}>
              {step.label}
              {step.date && <span className="ml-1 text-xs text-muted-foreground">({new Date(step.date).toLocaleDateString()})</span>}
            </span>
            {i < steps.length - 1 && <span className="text-muted-foreground">→</span>}
          </div>
        ))}
      </div>

      {status === "IN_PROGRESS" && isAssignedAl && (
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground mb-2">Sign off as AL to confirm you have reviewed the application.</p>
          {alError && <p className="text-sm text-destructive mb-2">{alError}</p>}
          <Button size="sm" onClick={handleAlSignOff} disabled={isPending}>
            {isPending ? "Signing…" : "Sign off as AL"}
          </Button>
        </div>
      )}

      {status === "AL_SIGNED" && userRole === "KMD" && (
        <div className="pt-2 border-t space-y-3">
          <p className="text-sm text-muted-foreground">Add review notes and sign off as KMD.</p>
          <form action={kmdFormAction} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="protocolNotes">Protocol notes</Label>
              <Textarea id="protocolNotes" name="protocolNotes" rows={3} defaultValue={protocolNotes ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reviewComments">Review comments</Label>
              <Textarea id="reviewComments" name="reviewComments" rows={3} defaultValue={reviewComments ?? ""} />
            </div>
            {kmdState?.message && !kmdState.errors && (
              <p className="text-sm text-green-600">{kmdState.message}</p>
            )}
            <Button size="sm" type="submit" disabled={kmdPending}>
              {kmdPending ? "Signing…" : "Sign off as KMD"}
            </Button>
          </form>
        </div>
      )}

      {(protocolNotes || reviewComments) && status !== "IN_PROGRESS" && (
        <div className="pt-2 border-t space-y-2 text-sm">
          {kmdReviewerName && <p className="text-muted-foreground">KMD reviewer: <span className="font-medium text-foreground">{kmdReviewerName}</span></p>}
          {protocolNotes && <div><span className="font-medium">Protocol notes:</span> {protocolNotes}</div>}
          {reviewComments && <div><span className="font-medium">Review comments:</span> {reviewComments}</div>}
        </div>
      )}
    </div>
  );
}
