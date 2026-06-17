import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { getApplication } from "@/lib/db/applications";
import { prisma } from "@/lib/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ReviewReportStatusCard } from "@/components/review/review-report-status-card";
import { ChevronLeftIcon } from "lucide-react";

export default async function ApplicationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const initiative = await prisma.initiative.findUnique({
    where: { id },
    select: { id: true, name: true, stage: true, assignedAlId: true },
  });
  if (!initiative) notFound();

  const data = await getApplication(id);

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href={`/initiatives/${id}`} />}
          className="mb-2 -ml-2"
        >
          <ChevronLeftIcon className="size-4 mr-1" />
          Back to initiative
        </Button>
        <PageHeader title="Application Review" description={initiative.name} />
      </div>

      {!data ? (
        <EmptyState
          title="No application yet"
          description="An application record is created automatically when this initiative enters Application Review stage."
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>
                <span className="font-medium">Status: </span>
                {data.application.status.replace("_", " ")}
              </p>
              {data.application.submittedDate && (
                <p>
                  <span className="font-medium">Submitted: </span>
                  {new Date(data.application.submittedDate).toLocaleDateString()}
                </p>
              )}
              <p>
                <span className="font-medium">AL: </span>
                {data.application.al.name}
              </p>
            </CardContent>
          </Card>

          {data.reviewReport ? (
            <Card>
              <CardHeader>
                <CardTitle>Review report</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewReportStatusCard
                  reportId={data.reviewReport.id}
                  status={data.reviewReport.status}
                  alSignOffAt={data.reviewReport.alSignOffAt}
                  kmdSignOffAt={data.reviewReport.kmdSignOffAt}
                  kmdReviewerName={data.reviewReport.kmdReviewer?.name}
                  protocolNotes={data.reviewReport.protocolNotes}
                  reviewComments={data.reviewReport.reviewComments}
                  userRole={user.role}
                  isAssignedAl={initiative.assignedAlId === user.id}
                />
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title="Review report not started"
              description="The review report is created automatically when the initiative enters Application Review."
            />
          )}
        </div>
      )}
    </div>
  );
}
