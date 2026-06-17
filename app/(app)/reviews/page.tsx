import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<string, string> = {
  NOT_ASSIGNED: "Not assigned",
  ASSIGNED: "Assigned",
  IN_REVIEW: "In review",
  QUESTIONS_SENT: "Questions sent",
  AL_RESPONSE_PENDING: "AL response pending",
  COMPLETE: "Complete",
};

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-amber-100 text-amber-700",
  QUESTIONS_SENT: "bg-purple-100 text-purple-700",
  AL_RESPONSE_PENDING: "bg-orange-100 text-orange-700",
  COMPLETE: "bg-green-100 text-green-700",
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="My reviews"
        description="Peer review assignments"
      />

      {reviews.length === 0 ? (
        <EmptyState
          title="No reviews assigned"
          description="You have no peer reviews assigned yet."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Initiative</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Completed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => {
              const initiative =
                review.memo.reviewReport.application.initiative;
              const color = STATUS_COLORS[review.status] ?? "bg-slate-100 text-slate-700";
              return (
                <TableRow key={review.id}>
                  <TableCell>
                    <Link
                      href={`/memos/${review.memoId}/review`}
                      className="font-medium hover:underline"
                    >
                      {initiative.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${color} border-0 text-xs`}>
                      {STATUS_LABELS[review.status] ?? review.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(review.assignedDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {review.completedDate
                      ? new Date(review.completedDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
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
