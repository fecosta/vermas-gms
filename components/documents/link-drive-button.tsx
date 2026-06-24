"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DriveSearchPanel } from "./drive-search-panel";
import type { DriveFile } from "@/lib/google/drive";
import {
  linkDriveDocument,
  linkChecklistItemDocument,
  linkDriveFolder,
} from "@/app/actions/documents";
import type { DocumentType } from "@/app/generated/prisma/enums";
import { LinkIcon } from "lucide-react";

type Target =
  | { kind: "organization"; organizationId: string; type: DocumentType }
  | { kind: "initiative"; initiativeId: string; type: DocumentType }
  | { kind: "application"; applicationId: string; type: DocumentType }
  | { kind: "checklist-item"; itemId: string }
  | { kind: "folder"; folderTarget: "organization" | "initiative"; id: string };

const TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: "CONCEPT_NOTE", label: "Concept note" },
  { value: "INSTITUTIONAL_DECK", label: "Institutional deck" },
  { value: "FULL_APPLICATION", label: "Application" },
  { value: "INVESTMENT_MEMO", label: "Investment memo" },
  { value: "LEGAL_DOCUMENT", label: "Legal document" },
  { value: "STRATEGY", label: "Strategy" },
  { value: "KICKOFF_MINUTES", label: "Kickoff minutes" },
  { value: "KPI_REPORTING_AGREEMENT", label: "KPI agreement" },
  { value: "OTHER", label: "Other" },
];

export function LinkDriveButton({
  target,
  label = "Link Drive document",
  size = "sm",
  variant = "outline",
  allowTypeChange = false,
}: {
  target: Target;
  label?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
  allowTypeChange?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(
    "type" in target ? target.type : null
  );

  const foldersOnly = target.kind === "folder";

  function handlePick(file: DriveFile) {
    setError(null);
    startTransition(async () => {
      let res: { error?: string };
      switch (target.kind) {
        case "organization":
          res = await linkDriveDocument({
            googleFileId: file.id,
            type: selectedType ?? target.type,
            organizationId: target.organizationId,
          });
          break;
        case "initiative":
          res = await linkDriveDocument({
            googleFileId: file.id,
            type: selectedType ?? target.type,
            initiativeId: target.initiativeId,
          });
          break;
        case "application":
          res = await linkDriveDocument({
            googleFileId: file.id,
            type: selectedType ?? target.type,
            applicationId: target.applicationId,
          });
          break;
        case "checklist-item":
          res = await linkChecklistItemDocument({
            itemId: target.itemId,
            googleFileId: file.id,
          });
          break;
        case "folder":
          res = await linkDriveFolder({
            kind: target.folderTarget,
            id: target.id,
            folderId: file.id,
          });
          break;
      }
      if (res?.error) setError(res.error);
      else setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size={size} variant={variant} onClick={() => setOpen(true)}>
        <LinkIcon className="size-3.5" />
        {label}
      </Button>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {foldersOnly ? "Link a Drive folder" : "Link a Drive document"}
          </DialogTitle>
        </DialogHeader>
        {allowTypeChange && selectedType && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Category</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DocumentType)}
              className="h-7 rounded-md border bg-background px-2 text-xs"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DriveSearchPanel
          foldersOnly={foldersOnly}
          pending={pending}
          onPick={handlePick}
        />
      </DialogContent>
    </Dialog>
  );
}
