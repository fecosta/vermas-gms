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
import { can } from "@/lib/authz";
import { ApplicationEditForm } from "@/components/initiatives/application-edit-form";
import { ApplicationStatusControls } from "@/components/initiatives/application-status-controls";
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
  const canEditApp = can(user, "application:edit");

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
            <CardContent className="text-sm space-y-3">
              <div className="space-y-1">
                {canEditApp ? (
                  <ApplicationStatusControls
                    applicationId={data.application.id}
                    currentStatus={data.application.status}
                  />
                ) : (
                  <p>
                    <span className="font-medium">Status: </span>
                    {data.application.status.replace("_", " ")}
                  </p>
                )}
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
              </div>

              {canEditApp ? (
                <ApplicationEditForm
                  applicationId={data.application.id}
                  initial={{
                    type: data.application.type,
                    whyYes: data.application.whyYes,
                    whyNot: data.application.whyNot,
                    submittedDate: data.application.submittedDate,
                  }}
                />
              ) : (
                <>
                  {data.application.whyYes && (
                    <div>
                      <p className="font-medium mb-0.5">Why proceed?</p>
                      <p className="text-muted-foreground">{data.application.whyYes}</p>
                    </div>
                  )}
                  {data.application.whyNot && (
                    <div>
                      <p className="font-medium mb-0.5">Concerns</p>
                      <p className="text-muted-foreground">{data.application.whyNot}</p>
                    </div>
                  )}
                </>
              )}
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
