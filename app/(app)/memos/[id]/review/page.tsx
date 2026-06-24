import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { PeerReviewForm } from "@/components/initiatives/peer-review-form";
import { ChevronLeftIcon } from "lucide-react";

export default async function MemoReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: memoId } = await params;
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  if (user.role !== "PEER_REVIEWER" && !["CEO", "AL", "KMD", "ADMIN"].includes(user.role)) {
    redirect("/dashboard");
  }

  const memo = await prisma.investmentMemo.findUnique({
    where: { id: memoId },
    include: {
      reviewReport: {
        include: {
          application: {
            include: { initiative: { select: { id: true, name: true } } },
          },
        },
      },
      peerReviews: {
        include: { reviewer: { select: { id: true, name: true } } },
      },
    },
  });

  if (!memo) notFound();

  const userReview = user.role === "PEER_REVIEWER"
    ? memo.peerReviews.find((pr) => pr.reviewerId === user.id)
    : null;

  const initiativeName = memo.reviewReport.application.initiative.name;
  const initiativeId = memo.reviewReport.application.initiative.id;

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href={`/initiatives/${initiativeId}/memo`} />}
          className="mb-2 -ml-2"
        >
          <ChevronLeftIcon className="size-4 mr-1" />
          Back to initiative
        </Button>
        <PageHeader title="Peer Review" description={initiativeName} />
      </div>

      {user.role === "PEER_REVIEWER" && (
        <div className="rounded-xl border border-dotted border-border bg-cream-soft px-4 py-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Peer reviewer view</span> — you see
          only the assigned memo. Internal comments, other reviews, and assessments are hidden.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Memo content</CardTitle>
        </CardHeader>
        <CardContent>
          {memo.body ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{memo.body}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Memo content has not been added yet.</p>
          )}
        </CardContent>
      </Card>

      {userReview ? (
        <Card>
          <CardHeader>
            <CardTitle>Your review</CardTitle>
          </CardHeader>
          <CardContent>
            {userReview.status === "COMPLETE" ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-green-deep">Review submitted ✓</p>
                {userReview.reviewText && (
                  <p className="text-sm whitespace-pre-wrap">{userReview.reviewText}</p>
                )}
                {userReview.completedDate && (
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(userReview.completedDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <PeerReviewForm reviewId={userReview.id} />
            )}
          </CardContent>
        </Card>
      ) : user.role === "PEER_REVIEWER" ? (
        <Card>
          <CardHeader><CardTitle>Your review</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You are not assigned to review this memo.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {["CEO", "AL", "KMD", "ADMIN"].includes(user.role) && (
        <Card>
          <CardHeader><CardTitle>All peer reviews</CardTitle></CardHeader>
          <CardContent>
            {memo.peerReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviewers assigned yet.</p>
            ) : (
              <div className="space-y-4">
                {memo.peerReviews.map((pr) => (
                  <div key={pr.id} className="space-y-1 rounded-xl border border-dotted border-border p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{pr.reviewer.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {pr.status.toLowerCase().replace("_", " ")}
                      </span>
                    </div>
                    {pr.reviewText && (
                      <p className="text-sm whitespace-pre-wrap">{pr.reviewText}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
