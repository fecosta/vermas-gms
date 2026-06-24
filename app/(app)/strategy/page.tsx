import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { getStrategyDocs } from "@/lib/db/strategy";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { PlusIcon } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  PROCESS_MAP: "Process Map",
  INVESTMENT_CRITERIA: "Investment Criteria",
  TOC: "Theory of Change",
  THESIS: "Thesis",
  LEARNING_AGENDA: "Learning Agenda",
};

const STATUS_TONE: Record<string, StatusTone> = {
  DRAFT: "neutral",
  IN_REVIEW: "purple",
  APPROVED: "green",
};

export default async function StrategyPage() {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  if (!["CEO", "KMD", "ADMIN"].includes(user.role)) redirect("/dashboard");

  const docs = await getStrategyDocs();
  const canCreate = can(user, "strategy:create");

  type DocRow = (typeof docs)[number];
  const columns: DataTableColumn<DocRow>[] = [
    {
      key: "title",
      header: "Title",
      cell: (doc) => (
        <div>
          <Link href={`/strategy/${doc.id}`} className="font-medium hover:underline">
            {doc.title}
          </Link>
          <p className="text-xs text-muted-foreground">v{doc.version}</p>
        </div>
      ),
    },
    { key: "type", header: "Type", cell: (doc) => TYPE_LABELS[doc.type] ?? doc.type },
    {
      key: "status",
      header: "Status",
      cell: (doc) => (
        <StatusChip tone={STATUS_TONE[doc.status] ?? "neutral"}>
          {doc.status.replace("_", " ")}
        </StatusChip>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      cell: (doc) => <span className="text-muted-foreground">{doc.owner.name}</span>,
    },
    {
      key: "areas",
      header: "Areas",
      cell: (doc) => (
        <span className="text-muted-foreground">
          {doc.areas.map((a) => a.area.name).join(", ") || "—"}
        </span>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      cell: (doc) => (
        <span className="text-muted-foreground">
          {new Date(doc.updatedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Strategy"
        description="Strategy documents and investment criteria"
        action={
          canCreate ? (
            <Button size="sm" render={<Link href="/strategy/new" />}>
              <PlusIcon className="size-4" />
              New document
            </Button>
          ) : undefined
        }
      />

      {docs.length === 0 ? (
        <EmptyState
          title="No strategy documents"
          description={
            canCreate
              ? "Create the first strategy document."
              : "No strategy documents have been created yet."
          }
        />
      ) : (
        <DataTable columns={columns} rows={docs} getRowKey={(d) => d.id} />
      )}
    </div>
  );
}
