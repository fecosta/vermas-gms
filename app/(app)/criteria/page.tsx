import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { getCriteriaSets } from "@/lib/db/criteria";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { PlusIcon } from "lucide-react";

export default async function CriteriaPage() {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  if (!can(user, "criteria:manage")) redirect("/dashboard");

  const sets = await getCriteriaSets();

  type SetRow = (typeof sets)[number];
  const columns: DataTableColumn<SetRow>[] = [
    {
      key: "name",
      header: "Name",
      cell: (s) => (
        <Link href={`/criteria/${s.id}`} className="font-medium hover:underline">
          {s.name}
        </Link>
      ),
    },
    {
      key: "description",
      header: "Description",
      className: "max-w-xs",
      cell: (s) => (
        <span className="line-clamp-1 text-muted-foreground">{s.description ?? "—"}</span>
      ),
    },
    {
      key: "items",
      header: "Items",
      headerClassName: "text-center",
      className: "text-center",
      cell: (s) => s._count.items,
    },
    {
      key: "used",
      header: "Used by",
      headerClassName: "text-center",
      className: "text-center",
      cell: (s) => (
        <span className="text-muted-foreground">
          {s._count.initiatives} initiative{s._count.initiatives !== 1 ? "s" : ""}
        </span>
      ),
    },
    {
      key: "created",
      header: "Created",
      cell: (s) => (
        <span className="text-muted-foreground">
          {new Date(s.createdAt).toLocaleDateString("en-US", {
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
        title="Criteria sets"
        description="Manage evaluation criteria for initiatives"
        action={
          <Button size="sm" render={<Link href="/criteria/new" />}>
            <PlusIcon className="size-4" />
            New criteria set
          </Button>
        }
      />

      {sets.length === 0 ? (
        <EmptyState
          title="No criteria sets"
          description="Create the first criteria set to start evaluating initiatives."
        />
      ) : (
        <DataTable columns={columns} rows={sets} getRowKey={(s) => s.id} />
      )}
    </div>
  );
}
