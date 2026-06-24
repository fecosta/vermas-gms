"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { unlinkDocument } from "@/app/actions/documents";
import { XIcon } from "lucide-react";

export function UnlinkDocumentButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      size="icon-xs"
      variant="ghost"
      disabled={pending}
      aria-label="Remove linked document"
      onClick={() => startTransition(() => void unlinkDocument(id))}
    >
      <XIcon />
    </Button>
  );
}
