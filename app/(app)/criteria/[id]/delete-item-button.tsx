"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteCriteriaItem } from "@/app/actions/criteria";
import { Trash2Icon } from "lucide-react";

export function DeleteItemButton({ itemId }: { itemId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
      disabled={isPending}
      onClick={() => startTransition(async () => { await deleteCriteriaItem(itemId); })}
    >
      <Trash2Icon className="size-3.5" />
    </Button>
  );
}
