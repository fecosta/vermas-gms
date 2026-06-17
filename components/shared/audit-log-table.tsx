import { formatDistanceToNow } from "@/lib/utils";

interface AuditLogEntry {
  id: string;
  action: string;
  before: unknown;
  after: unknown;
  createdAt: Date;
  actor: { id: string; name: string; role: string };
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  STAGE_CHANGE: "Stage moved",
  DECISION_RECORDED: "Decision recorded",
  LEGAL_STATUS_CHANGE: "Legal status changed",
  DOCUMENT_UPLOADED: "Document uploaded",
  USER_INVITED: "User invited",
  USER_DEACTIVATED: "User deactivated",
};

interface AuditLogTableProps {
  entries: AuditLogEntry[];
}

export function AuditLogTable({ entries }: AuditLogTableProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-start gap-3 text-sm py-2 border-b last:border-b-0"
        >
          <div className="shrink-0 mt-0.5">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
              {entry.actor.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-medium">{entry.actor.name}</span>
            {" "}
            <span className="text-muted-foreground">
              {ACTION_LABELS[entry.action] ?? entry.action}
            </span>
            {entry.action === "STAGE_CHANGE" &&
            entry.before != null &&
            entry.after != null &&
            typeof entry.before === "object" &&
            typeof entry.after === "object" ? (
              <span className="text-muted-foreground">
                {" "}
                from{" "}
                <span className="font-mono text-xs">
                  {(entry.before as Record<string, unknown>).stage as string}
                </span>{" "}
                →{" "}
                <span className="font-mono text-xs">
                  {(entry.after as Record<string, unknown>).stage as string}
                </span>
              </span>
            ) : null}
          </div>
          <div className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(entry.createdAt))}
          </div>
        </div>
      ))}
    </div>
  );
}
