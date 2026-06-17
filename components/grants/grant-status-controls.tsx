"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateGrantStatus } from "@/app/actions/grants";
import type { GrantStatus } from "@/app/generated/prisma/enums";

const STATUS_LABELS: Record<GrantStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  CLOSED: "Closed",
};

const STATUS_COLORS: Record<GrantStatus, string> = {
  ACTIVE: "text-green-600",
  PAUSED: "text-amber-600",
  CLOSED: "text-muted-foreground",
};

interface Props {
  initiativeId: string;
  currentStatus: GrantStatus;
}

export function GrantStatusControls({ initiativeId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const update = (status: GrantStatus) => {
    setError(undefined);
    startTransition(async () => {
      const result = await updateGrantStatus(initiativeId, status);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Grant status:</span>
        <span className={`text-sm font-medium ${STATUS_COLORS[currentStatus]}`}>
          {STATUS_LABELS[currentStatus]}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {currentStatus === "ACTIVE" && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => update("PAUSED")}
              disabled={isPending}
            >
              Pause grant
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive/10"
              onClick={() => update("CLOSED")}
              disabled={isPending}
            >
              Close grant
            </Button>
          </>
        )}
        {currentStatus === "PAUSED" && (
          <>
            <Button size="sm" onClick={() => update("ACTIVE")} disabled={isPending}>
              Reactivate
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive/10"
              onClick={() => update("CLOSED")}
              disabled={isPending}
            >
              Close grant
            </Button>
          </>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
