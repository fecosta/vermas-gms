"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { submitStrategyDocForReview } from "@/app/actions/strategy";
import { SendIcon } from "lucide-react";

export function SubmitForReviewButton({ docId }: { docId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitStrategyDocForReview(docId);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" disabled={isPending} onClick={handleClick}>
        <SendIcon className="size-4 mr-1" />
        {isPending ? "Submitting…" : "Submit for review"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
