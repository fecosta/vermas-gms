"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { completeOnboarding } from "@/app/actions/grants";
import { CheckCircleIcon } from "lucide-react";

interface Props {
  initiativeId: string;
}

export function CompleteOnboardingButton({ initiativeId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const handleClick = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await completeOnboarding(initiativeId);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={handleClick} disabled={isPending}>
        <CheckCircleIcon className="size-4 mr-1.5" />
        {isPending ? "Completing…" : "Mark onboarding complete"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
