import { prisma } from "@/lib/db/client";
import type { CommentRelatedType } from "@/app/generated/prisma/enums";

export async function getComments(relatedType: CommentRelatedType, relatedId: string) {
  return prisma.comment.findMany({
    where: { relatedType, relatedId },
    include: {
      author: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export type CommentWithAuthor = Awaited<ReturnType<typeof getComments>>[number];
