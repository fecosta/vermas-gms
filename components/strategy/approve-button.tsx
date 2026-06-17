"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { approveStrategyDoc } from "@/app/actions/strategy";
import { CheckCircleIcon } from "lucide-react";

export function ApproveButton({ docId }: { docId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await approveStrategyDoc(docId);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" disabled={isPending} onClick={handleClick}>
        <CheckCircleIcon className="size-4 mr-1" />
        {isPending ? "Approving…" : "Approve"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
