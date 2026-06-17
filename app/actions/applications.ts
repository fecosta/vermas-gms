"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { assertCan } from "@/lib/authz";
import { ApplicationEditSchema } from "@/lib/validations";

export type ApplicationEditState = {
  errors?: Record<string, string[]>;
  message?: string;
} | null;

export async function updateApplication(
  applicationId: string,
  _prev: ApplicationEditState,
  formData: FormData
): Promise<ApplicationEditState> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "application:edit");

  const parsed = ApplicationEditSchema.safeParse({
    type: formData.get("type") || undefined,
    whyYes: formData.get("whyYes") || undefined,
    whyNot: formData.get("whyNot") || undefined,
    submittedDate: formData.get("submittedDate") || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const app = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    select: { initiativeId: true },
  });

  await prisma.application.update({ where: { id: applicationId }, data: parsed.data });

  revalidatePath(`/initiatives/${app.initiativeId}/application-review`);
  return { message: "Application updated." };
}
