"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateChecklistItemStatus, requestRevision, resolveRevision } from "@/app/actions/legal";
import type { ChecklistItemStatus } from "@/app/generated/prisma/enums";
import type { LegalCaseDetail } from "@/lib/db/legal";

const STATUS_LABELS: Record<ChecklistItemStatus, string> = {
  PENDING: "Pending",
  SUBMITTED: "Submitted",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  REVISION_REQUESTED: "Revision Requested",
};

const STATUS_COLORS: Record<ChecklistItemStatus, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  REVISION_REQUESTED: "bg-orange-100 text-orange-700",
};

type ChecklistItem = LegalCaseDetail["checklistItems"][number];

interface ChecklistTableProps {
  items: ChecklistItem[];
  isAD: boolean;
}

function ChecklistRow({ item, isAD }: { item: ChecklistItem; isAD: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");

  const openRevision = item.revisions[0]?.resolvedAt === null ? item.revisions[0] : null;

  const handleStatusChange = (status: ChecklistItemStatus) => {
    startTransition(async () => {
      await updateChecklistItemStatus(item.id, status);
    });
  };

  const handleRequestRevision = () => {
    startTransition(async () => {
      const result = await requestRevision(item.id, revisionNotes);
      if (!result?.error) {
        setShowRevisionForm(false);
        setRevisionNotes("");
      }
    });
  };

  const handleResolveRevision = (revisionId: string) => {
    startTransition(async () => {
      await resolveRevision(revisionId);
    });
  };

  return (
    <tr className="border-b last:border-0">
      <td className="py-3 pr-4">
        <div className="font-medium text-sm">{item.requiredDocName}</div>
        {item.description && (
          <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
        )}
        {openRevision && (
          <div className="text-xs text-orange-600 mt-0.5">
            Revision requested: {openRevision.notes}
          </div>
        )}
        {isAD && (
          <div className="mt-1.5 space-y-1.5">
            {openRevision ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-green-700 hover:text-green-800 px-0"
                disabled={isPending}
                onClick={() => handleResolveRevision(openRevision.id)}
              >
                Mark resolved
              </Button>
            ) : showRevisionForm ? (
              <div className="space-y-1.5">
                <Textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Describe what needs to be revised…"
                  rows={2}
                  className="text-xs"
                />
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    className="h-6 text-xs"
                    disabled={isPending || !revisionNotes.trim()}
                    onClick={handleRequestRevision}
                  >
                    Submit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => { setShowRevisionForm(false); setRevisionNotes(""); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-orange-600 hover:text-orange-700 px-0"
                onClick={() => setShowRevisionForm(true)}
              >
                Request revision
              </Button>
            )}
          </div>
        )}
      </td>
      <td className="py-3 pr-4 text-center align-top pt-3">
        {item.isRequired ? (
          <span className="text-xs font-medium text-red-600">Required</span>
        ) : (
          <span className="text-xs text-muted-foreground">Optional</span>
        )}
      </td>
      <td className="py-3 pr-4 align-top pt-3">
        {isAD ? (
          <Select
            value={item.status}
            onValueChange={(v) => handleStatusChange(v as ChecklistItemStatus)}
            disabled={isPending}
          >
            <SelectTrigger className="h-7 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABELS) as ChecklistItemStatus[]).map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status]}`}>
            {STATUS_LABELS[item.status]}
          </span>
        )}
      </td>
      <td className="py-3 text-xs text-muted-foreground align-top pt-3">
        {item.reviewedBy?.name}
        {item.reviewedDate && (
          <span className="ml-1">({new Date(item.reviewedDate).toLocaleDateString()})</span>
        )}
      </td>
    </tr>
  );
}

export function ChecklistTable({ items, isAD }: ChecklistTableProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No checklist items yet.{isAD ? " Add items above." : ""}
      </p>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Document</th>
          <th className="text-center text-xs font-medium text-muted-foreground pb-2 pr-4">Required</th>
          <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Status</th>
          <th className="text-left text-xs font-medium text-muted-foreground pb-2">Reviewed by</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <ChecklistRow key={item.id} item={item} isAD={isAD} />
        ))}
      </tbody>
    </table>
  );
}
