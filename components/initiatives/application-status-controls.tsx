"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateApplicationStatus } from "@/app/actions/applications";
import type { ApplicationStatus } from "@/app/generated/prisma/enums";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  REQUESTED: "Requested",
  RECEIVED: "Received",
  IN_REVIEW: "In review",
  COMPLETE: "Complete",
  REJECTED: "Rejected",
  LINK_SENT: "Link sent",
  REVISION_REQUESTED: "Revision requested",
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  REQUESTED: "text-muted-foreground",
  RECEIVED: "text-blue-600",
  IN_REVIEW: "text-amber-600",
  COMPLETE: "text-green-600",
  REJECTED: "text-destructive",
  LINK_SENT: "text-blue-600",
  REVISION_REQUESTED: "text-orange-600",
};

interface Props {
  applicationId: string;
  currentStatus: ApplicationStatus;
}

export function ApplicationStatusControls({ applicationId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const advance = (status: ApplicationStatus) => {
    setError(undefined);
    startTransition(async () => {
      const result = await updateApplicationStatus(applicationId, status);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-medium">Status:</span>
        <span className={`font-medium ${STATUS_COLORS[currentStatus]}`}>
          {STATUS_LABELS[currentStatus]}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {currentStatus === "REQUESTED" && (
          <Button size="sm" onClick={() => advance("RECEIVED")} disabled={isPending}>
            Mark received
          </Button>
        )}
        {currentStatus === "RECEIVED" && (
          <Button size="sm" onClick={() => advance("IN_REVIEW")} disabled={isPending}>
            Start review
          </Button>
        )}
        {currentStatus === "IN_REVIEW" && (
          <>
            <Button size="sm" onClick={() => advance("COMPLETE")} disabled={isPending}>
              Mark complete
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive/10"
              onClick={() => advance("REJECTED")}
              disabled={isPending}
            >
              Reject
            </Button>
          </>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
