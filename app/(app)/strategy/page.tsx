import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { getStrategyDocs } from "@/lib/db/strategy";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
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
import { PlusIcon } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  PROCESS_MAP: "Process Map",
  INVESTMENT_CRITERIA: "Investment Criteria",
  TOC: "Theory of Change",
  THESIS: "Thesis",
  LEARNING_AGENDA: "Learning Agenda",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  IN_REVIEW: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
};

export default async function StrategyPage() {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  if (!["CEO", "KMD", "ADMIN"].includes(user.role)) redirect("/dashboard");

  const docs = await getStrategyDocs();
  const canCreate = can(user, "strategy:create");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Strategy"
        description="Strategy documents and investment criteria"
        action={
          canCreate ? (
            <Button size="sm" render={<Link href="/strategy/new" />}>
              <PlusIcon className="size-4 mr-1" />
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Areas</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.map((doc) => (
              <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link
                    href={`/strategy/${doc.id}`}
                    className="font-medium hover:underline"
                  >
                    {doc.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">v{doc.version}</p>
                </TableCell>
                <TableCell className="text-sm">
                  {TYPE_LABELS[doc.type] ?? doc.type}
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${STATUS_COLORS[doc.status] ?? ""} border-0 text-xs`}
                  >
                    {doc.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {doc.owner.name}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {doc.areas.map((a) => a.area.name).join(", ") || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(doc.updatedAt).toLocaleDateString("en-US", {
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
