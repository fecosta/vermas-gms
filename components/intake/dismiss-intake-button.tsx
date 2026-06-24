"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { dismissIntake } from "@/app/actions/intake";

export function DismissIntakeButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() => startTransition(() => void dismissIntake(id))}
    >
      Dismiss
    </Button>
  );
}
