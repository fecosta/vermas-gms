"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { assertCan, can } from "@/lib/authz";
import type { CommentRelatedType } from "@/app/generated/prisma/enums";

type State = { errors?: Record<string, string[]>; message?: string } | null;

export async function addComment(
  relatedType: CommentRelatedType,
  relatedId: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "comment:create");

  const body = (formData.get("body") as string)?.trim();
  if (!body || body.length < 1) {
    return { errors: { body: ["Comment cannot be empty"] } };
  }
  if (body.length > 5000) {
    return { errors: { body: ["Comment must be under 5000 characters"] } };
  }

  const isInternalRaw = formData.get("isInternal");
  const canSetInternal = can(user, "comment:view-internal");
  const isInternal = canSetInternal && isInternalRaw === "on";

  await prisma.comment.create({
    data: {
      body,
      authorId: user.id,
      relatedType,
      relatedId,
      isInternal,
    },
  });

  if (relatedType === "INITIATIVE") {
    revalidatePath(`/initiatives/${relatedId}`);
  } else if (relatedType === "MEMO") {
    revalidatePath(`/memos/${relatedId}/review`);
  }

  return { message: "Comment added." };
}
