import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { getUsers } from "@/lib/db/users";
import { prisma } from "@/lib/db/client";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import Link from "next/link";
import { InviteUserDialog } from "@/components/admin/invite-user-dialog";
import { UserActionsCell } from "@/components/admin/user-actions-cell";

export default async function AdminPage() {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  if (!can(user, "users:manage")) redirect("/dashboard");

  const [users, areas] = await Promise.all([
    getUsers(),
    prisma.area.findMany({ orderBy: { name: "asc" } }),
  ]);

  type UserRow = (typeof users)[number];
  const columns: DataTableColumn<UserRow>[] = [
    {
      key: "name",
      header: "Name",
      cell: (u) => (
        <span className={cn("font-medium", !u.isActive && "opacity-60")}>{u.name}</span>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (u) => <span className="text-muted-foreground">{u.email}</span>,
    },
    {
      key: "role",
      header: "Role",
      cell: (u) => <StatusChip tone="neutral">{u.role.replace("_", " ")}</StatusChip>,
    },
    {
      key: "area",
      header: "Area",
      cell: (u) => <span className="text-muted-foreground">{u.area?.name ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (u) =>
        u.isActive ? (
          <StatusChip tone="green">Active</StatusChip>
        ) : (
          <StatusChip tone="neutral">Inactive</StatusChip>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (u) => (
        <UserActionsCell
          userId={u.id}
          currentUserId={user.id}
          isActive={u.isActive}
          currentRole={u.role}
          currentAreaId={u.areaId}
          areas={areas}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin"
        description="Manage users and system settings"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" render={<Link href="/admin/areas" />}>
              Manage areas
            </Button>
            <Button variant="outline" size="sm" render={<Link href="/admin/audit-log" />}>
              View audit log
            </Button>
            <InviteUserDialog areas={areas} />
          </div>
        }
      />

      <DataTable columns={columns} rows={users} getRowKey={(u) => u.id} />
    </div>
  );
}
