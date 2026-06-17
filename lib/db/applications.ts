import { prisma } from "@/lib/db/client";

export async function getApplication(initiativeId: string) {
  const application = await prisma.application.findUnique({
    where: { initiativeId },
    include: {
      reviewReport: {
        include: {
          kmdReviewer: { select: { id: true, name: true } },
          memo: {
            include: {
              peerReviews: {
                include: { reviewer: { select: { id: true, name: true } } },
                orderBy: { assignedDate: "asc" },
              },
            },
          },
        },
      },
      al: { select: { id: true, name: true } },
    },
  });

  if (!application) return null;

  return {
    application,
    reviewReport: application.reviewReport ?? null,
    memo: application.reviewReport?.memo ?? null,
    peerReviews: application.reviewReport?.memo?.peerReviews ?? [],
  };
}

export type ApplicationDetail = NonNullable<
  Awaited<ReturnType<typeof getApplication>>
>;
