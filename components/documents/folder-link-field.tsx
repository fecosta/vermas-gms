"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { LinkDriveButton } from "./link-drive-button";
import { unlinkDriveFolder } from "@/app/actions/documents";
import { FolderIcon, ExternalLinkIcon, XIcon } from "lucide-react";

export function FolderLinkField({
  kind,
  id,
  folderName,
  folderUrl,
  canManage = false,
}: {
  kind: "organization" | "initiative";
  id: string;
  folderName: string | null;
  folderUrl: string | null;
  canManage?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (folderUrl) {
    return (
      <div className="flex items-center justify-between gap-2">
        <a
          href={folderUrl}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-0 items-center gap-1.5 text-sm hover:underline"
        >
          <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{folderName ?? "Drive folder"}</span>
          <ExternalLinkIcon className="size-3 shrink-0 text-muted-foreground" />
        </a>
        {canManage && (
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            disabled={pending}
            aria-label="Unlink folder"
            onClick={() => startTransition(() => void unlinkDriveFolder(kind, id))}
          >
            <XIcon />
          </Button>
        )}
      </div>
    );
  }

  if (!canManage) {
    return <p className="text-sm text-muted-foreground">No Drive folder linked.</p>;
  }

  return (
    <LinkDriveButton
      target={{ kind: "folder", folderTarget: kind, id }}
      label="Link Drive folder"
      variant="outline"
      size="sm"
    />
  );
}
