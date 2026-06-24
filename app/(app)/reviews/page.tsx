import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";

const STATUS_LABELS: Record<string, string> = {
  NOT_ASSIGNED: "Not assigned",
  ASSIGNED: "Assigned",
  IN_REVIEW: "In review",
  QUESTIONS_SENT: "Questions sent",
  AL_RESPONSE_PENDING: "AL response pending",
  COMPLETE: "Complete",
};

const STATUS_TONE: Record<string, StatusTone> = {
  NOT_ASSIGNED: "neutral",
  ASSIGNED: "neutral",
  IN_REVIEW: "purple",
  QUESTIONS_SENT: "purple",
  AL_RESPONSE_PENDING: "purple",
  COMPLETE: "green",
};

export default async function MyReviewsPage() {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  if (user.role !== "PEER_REVIEWER") redirect("/dashboard");

  const reviews = await prisma.peerReview.findMany({
    where: { reviewerId: user.id },
    include: {
      memo: {
        include: {
          reviewReport: {
            include: {
              application: {
                include: {
                  initiative: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { assignedDate: "desc" },
  });

  const fmt = (d: Date | null) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  type ReviewRow = (typeof reviews)[number];
  const columns: DataTableColumn<ReviewRow>[] = [
    {
      key: "initiative",
      header: "Initiative",
      cell: (r) => (
        <Link href={`/memos/${r.memoId}/review`} className="font-medium hover:underline">
          {r.memo.reviewReport.application.initiative.name}
        </Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <StatusChip tone={STATUS_TONE[r.status] ?? "neutral"}>
          {STATUS_LABELS[r.status] ?? r.status}
        </StatusChip>
      ),
    },
    {
      key: "assigned",
      header: "Assigned",
      cell: (r) => <span className="text-muted-foreground">{fmt(r.assignedDate)}</span>,
    },
    {
      key: "completed",
      header: "Completed",
      cell: (r) => <span className="text-muted-foreground">{fmt(r.completedDate)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="My reviews" description="Peer review assignments" />
      {reviews.length === 0 ? (
        <EmptyState
          title="No reviews assigned"
          description="You have no peer reviews assigned yet."
        />
      ) : (
        <DataTable columns={columns} rows={reviews} getRowKey={(r) => r.id} />
      )}
    </div>
  );
}
