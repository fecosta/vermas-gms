import { prisma } from "@/lib/db/client";
import { linkedDocumentSelect } from "@/lib/db/documents";

export async function getApplication(initiativeId: string) {
  const application = await prisma.application.findUnique({
    where: { initiativeId },
    include: {
      documents: { select: linkedDocumentSelect, orderBy: { uploadedAt: "desc" } },
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
    documents: application.documents,
    reviewReport: application.reviewReport ?? null,
    memo: application.reviewReport?.memo ?? null,
    peerReviews: application.reviewReport?.memo?.peerReviews ?? [],
  };
}

export type ApplicationDetail = NonNullable<
  Awaited<ReturnType<typeof getApplication>>
>;
