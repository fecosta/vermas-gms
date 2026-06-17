import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { getUsers } from "@/lib/db/users";
import { prisma } from "@/lib/db/client";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
            <InviteUserDialog areas={areas} />
          </div>
        }
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Area</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id} className={!u.isActive ? "opacity-50" : ""}>
              <TableCell className="font-medium">{u.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {u.email}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {u.role.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {u.area?.name ?? "—"}
              </TableCell>
              <TableCell>
                {u.isActive ? (
                  <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-500 border-0 text-xs">
                    Inactive
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <UserActionsCell
                  userId={u.id}
                  currentUserId={user.id}
                  isActive={u.isActive}
                  currentRole={u.role}
                  currentAreaId={u.areaId}
                  areas={areas}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
