"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { rejectStrategyDoc } from "@/app/actions/strategy";
import { RotateCcwIcon } from "lucide-react";

export function RejectStrategyDocButton({ docId }: { docId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await rejectStrategyDoc(docId);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" disabled={isPending} onClick={handleClick}>
        <RotateCcwIcon className="size-4 mr-1" />
        {isPending ? "Sending back…" : "Send back to draft"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
