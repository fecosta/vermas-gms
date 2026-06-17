import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { getCriteriaSets } from "@/lib/db/criteria";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon } from "lucide-react";

export default async function CriteriaPage() {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  if (!can(user, "criteria:manage")) redirect("/dashboard");

  const sets = await getCriteriaSets();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Criteria sets"
        description="Manage evaluation criteria for initiatives"
        action={
          <Button size="sm" render={<Link href="/criteria/new" />}>
            <PlusIcon className="size-4 mr-1" />
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead className="text-center">Used by</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sets.map((s) => (
              <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link href={`/criteria/${s.id}`} className="font-medium hover:underline">
                    {s.name}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                  {s.description ?? "—"}
                </TableCell>
                <TableCell className="text-center text-sm">{s._count.items}</TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {s._count.initiatives} initiative{s._count.initiatives !== 1 ? "s" : ""}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(s.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
