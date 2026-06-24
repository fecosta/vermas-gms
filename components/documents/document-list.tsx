import { Badge } from "@/components/ui/badge";
import { formatDate, formatSize, getFileColor } from "@/lib/google/helpers";
import type { DocumentType } from "@/app/generated/prisma/enums";
import { UnlinkDocumentButton } from "./unlink-document-button";

const TYPE_LABELS: Record<DocumentType, string> = {
  STRATEGY: "Strategy",
  CONCEPT_NOTE: "Concept note",
  INSTITUTIONAL_DECK: "Institutional deck",
  FULL_APPLICATION: "Application",
  APPLICATION_REVIEW_REPORT: "Review report",
  INVESTMENT_MEMO: "Investment memo",
  PEER_REVIEW_COMMENTS: "Peer review",
  CEO_NOTES: "CEO notes",
  LEGAL_DOCUMENT: "Legal document",
  TRUST_VALIDATION: "Trust validation",
  KICKOFF_MINUTES: "Kickoff minutes",
  KPI_REPORTING_AGREEMENT: "KPI agreement",
  OTHER: "Document",
};

export type LinkedDocument = {
  id: string;
  type: DocumentType;
  fileName: string;
  googleFileUrl: string | null;
  googleMimeType: string | null;
  googleModifiedTime: Date | null;
  googleOwnerName: string | null;
  googleFileSize: string | null;
};

export function DocumentList({
  documents,
  canManage = false,
  emptyLabel = "No documents linked yet.",
}: {
  documents: LinkedDocument[];
  canManage?: boolean;
  emptyLabel?: string;
}) {
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="divide-y">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between gap-2 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: getFileColor(doc.googleMimeType ?? undefined) }}
            />
            <div className="min-w-0">
              <a
                href={doc.googleFileUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-sm font-medium hover:underline"
              >
                {doc.fileName}
              </a>
              <p className="truncate text-xs text-muted-foreground">
                {doc.googleOwnerName ?? ""}
                {doc.googleModifiedTime
                  ? `${doc.googleOwnerName ? " · " : ""}${formatDate(
                      doc.googleModifiedTime.toISOString()
                    )}`
                  : ""}
                {doc.googleFileSize ? ` · ${formatSize(doc.googleFileSize)}` : ""}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {TYPE_LABELS[doc.type]}
            </Badge>
            {canManage && <UnlinkDocumentButton id={doc.id} />}
          </div>
        </div>
      ))}
    </div>
  );
}
