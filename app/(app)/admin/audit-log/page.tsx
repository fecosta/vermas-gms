import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { prisma } from "@/lib/db/client";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ChevronLeftIcon } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  STAGE_CHANGE: "Stage change",
  DECISION_RECORDED: "Decision recorded",
  LEGAL_STATUS_CHANGE: "Legal status change",
  DOCUMENT_UPLOADED: "Document uploaded",
  USER_INVITED: "User invited",
  USER_DEACTIVATED: "User deactivated",
};

export default async function AuditLogPage() {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  if (!can(user, "users:manage")) redirect("/dashboard");

  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: { select: { id: true, name: true, role: true } } },
  });

  type Entry = (typeof entries)[number];
  const columns: DataTableColumn<Entry>[] = [
    {
      key: "actor",
      header: "Actor",
      cell: (e) => (
        <div>
          <p className="font-medium">{e.actor.name}</p>
          <p className="text-xs text-muted-foreground">{e.actor.role.replace("_", " ")}</p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (e) => <StatusChip tone="neutral">{ACTION_LABELS[e.action] ?? e.action}</StatusChip>,
    },
    {
      key: "entity",
      header: "Entity",
      cell: (e) =>
        e.entityType === "INITIATIVE" ? (
          <Link href={`/initiatives/${e.entityId}`} className="hover:underline">
            Initiative
          </Link>
        ) : (
          <span className="text-muted-foreground">{e.entityType}</span>
        ),
    },
    {
      key: "detail",
      header: "Detail",
      cell: (e) => {
        const after = e.after as Record<string, unknown> | null;
        const detail =
          e.action === "STAGE_CHANGE" && after?.stage ? String(after.stage) : null;
        return <span className="text-muted-foreground">{detail ?? "—"}</span>;
      },
    },
    {
      key: "date",
      header: "Date",
      cell: (e) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {new Date(e.createdAt).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/admin" />}
          className="mb-2 -ml-2"
        >
          <ChevronLeftIcon className="size-4" />
          Back to admin
        </Button>
        <PageHeader title="Audit log" description="Last 50 system-wide events" />
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Activity will appear here as users take actions."
        />
      ) : (
        <DataTable columns={columns} rows={entries} getRowKey={(e) => e.id} />
      )}
    </div>
  );
}
