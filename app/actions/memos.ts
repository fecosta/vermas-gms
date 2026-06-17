"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { assertCan } from "@/lib/authz";
import { PeerReviewSchema } from "@/lib/validations";

type State = { errors?: Record<string, string[]>; message?: string } | null;

async function getInitiativeIdForMemo(memoId: string): Promise<{ initiativeId: string; assignedAlId: string; initiativeName: string }> {
  const memo = await prisma.investmentMemo.findUniqueOrThrow({
    where: { id: memoId },
    include: {
      reviewReport: {
        include: { application: { select: { initiativeId: true, initiative: { select: { assignedAlId: true, name: true } } } } },
      },
    },
  });
  return {
    initiativeId: memo.reviewReport.application.initiativeId,
    assignedAlId: memo.reviewReport.application.initiative.assignedAlId,
    initiativeName: memo.reviewReport.application.initiative.name,
  };
}

export async function updateMemo(
  memoId: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const { initiativeId, assignedAlId } = await getInitiativeIdForMemo(memoId);

  assertCan(user, "memo:draft", {
    type: "initiative",
    assignedAlId,
    supportingAtIds: [],
  });

  const body = (formData.get("body") as string) ?? "";

  await prisma.investmentMemo.update({
    where: { id: memoId },
    data: { body },
  });

  revalidatePath(`/initiatives/${initiativeId}/memo`);
  return { message: "Memo saved." };
}

export async function nominatePeerReviewers(
  memoId: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const { initiativeId, assignedAlId, initiativeName } = await getInitiativeIdForMemo(memoId);

  assertCan(user, "peer-review:nominate", {
    type: "initiative",
    assignedAlId,
    supportingAtIds: [],
  });

  const reviewer1Id = formData.get("reviewer1Id") as string;
  const reviewer2Id = formData.get("reviewer2Id") as string;

  if (!reviewer1Id || !reviewer2Id) {
    return { errors: { reviewer1Id: ["Two reviewers are required"] } };
  }
  if (reviewer1Id === reviewer2Id) {
    return { errors: { reviewer2Id: ["Select two different reviewers"] } };
  }

  for (const reviewerId of [reviewer1Id, reviewer2Id]) {
    const existing = await prisma.peerReview.findFirst({
      where: { memoId, reviewerId },
    });
    if (!existing) {
      await prisma.peerReview.create({
        data: { memoId, reviewerId, status: "ASSIGNED", assignedDate: new Date() },
      });
    } else if (existing.status === "NOT_ASSIGNED" || existing.status === "ASSIGNED") {
      await prisma.peerReview.update({
        where: { id: existing.id },
        data: { reviewerId, status: "ASSIGNED", assignedDate: new Date() },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "UPDATE",
      entityType: "INITIATIVE",
      entityId: initiativeId,
      after: { peerReviewersNominated: [reviewer1Id, reviewer2Id] },
    },
  });

  for (const reviewerId of [reviewer1Id, reviewer2Id]) {
    await prisma.notification.create({
      data: {
        userId: reviewerId,
        type: "PEER_REVIEWER_ASSIGNED",
        message: `You have been assigned to peer review "${initiativeName}"`,
        relatedType: "INITIATIVE",
        relatedId: initiativeId,
      },
    });
  }

  revalidatePath(`/initiatives/${initiativeId}/memo`);
  revalidatePath(`/initiatives/${initiativeId}`);
  return { message: "Peer reviewers nominated." };
}

export async function submitPeerReview(
  reviewId: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "peer-review:submit");

  const review = await prisma.peerReview.findUniqueOrThrow({
    where: { id: reviewId },
    include: {
      memo: {
        include: {
          reviewReport: {
            include: {
              application: {
                select: {
                  initiativeId: true,
                  initiative: { select: { assignedAlId: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (review.reviewerId !== user.id) {
    return { message: "You are not assigned to this review." };
  }

  const parsed = PeerReviewSchema.safeParse({
    reviewText: formData.get("reviewText"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.peerReview.update({
    where: { id: reviewId },
    data: {
      status: "COMPLETE",
      reviewText: parsed.data.reviewText,
      completedDate: new Date(),
    },
  });

  const initiativeId = review.memo.reviewReport.application.initiativeId;
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "UPDATE",
      entityType: "INITIATIVE",
      entityId: initiativeId,
      after: { peerReviewId: reviewId, status: "COMPLETE" },
    },
  });

  await prisma.notification.create({
    data: {
      userId: review.memo.reviewReport.application.initiative.assignedAlId,
      type: "PEER_COMMENT_SUBMITTED",
      message: `A peer reviewer submitted their review for "${review.memo.reviewReport.application.initiative.name}"`,
      relatedType: "INITIATIVE",
      relatedId: initiativeId,
    },
  });

  revalidatePath(`/memos/${review.memoId}/review`);
  revalidatePath(`/initiatives/${initiativeId}/memo`);
  revalidatePath(`/initiatives/${initiativeId}`);
  return { message: "Review submitted." };
}
