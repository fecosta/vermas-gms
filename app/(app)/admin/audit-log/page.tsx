import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { prisma } from "@/lib/db/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/admin" />}
          className="mb-2 -ml-2"
        >
          <ChevronLeftIcon className="size-4 mr-1" />
          Back to admin
        </Button>
        <PageHeader
          title="Audit log"
          description="Last 50 system-wide events"
        />
      </div>

      {entries.length === 0 ? (
        <EmptyState title="No events yet" description="Activity will appear here as users take actions." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const after = entry.after as Record<string, unknown> | null;
              const detail =
                entry.action === "STAGE_CHANGE" && after?.stage
                  ? String(after.stage)
                  : null;

              return (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm">
                    <div>
                      <p className="font-medium">{entry.actor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.actor.role.replace("_", " ")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.entityType === "INITIATIVE" ? (
                      <Link
                        href={`/initiatives/${entry.entityId}`}
                        className="hover:underline text-primary"
                      >
                        Initiative
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">
                        {entry.entityType}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {detail ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
