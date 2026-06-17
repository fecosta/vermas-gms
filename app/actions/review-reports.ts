"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { assertCan } from "@/lib/authz";
import { ReviewNoteSchema } from "@/lib/validations";

type State = { errors?: Record<string, string[]>; message?: string } | null;

async function getInitiativeIdForReport(reportId: string): Promise<string> {
  const report = await prisma.applicationReviewReport.findUniqueOrThrow({
    where: { id: reportId },
    include: { application: { select: { initiativeId: true, initiative: { select: { assignedAlId: true } } } } },
  });
  return report.application.initiativeId;
}

export async function alSignOff(reportId: string): Promise<{ error?: string }> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const report = await prisma.applicationReviewReport.findUniqueOrThrow({
    where: { id: reportId },
    include: { application: { include: { initiative: { select: { assignedAlId: true } } } } },
  });

  assertCan(user, "review-report:sign-al", {
    type: "initiative",
    assignedAlId: report.application.initiative.assignedAlId,
    supportingAtIds: [],
  });

  if (report.status !== "IN_PROGRESS") {
    return { error: "Report has already been signed off." };
  }

  await prisma.applicationReviewReport.update({
    where: { id: reportId },
    data: { status: "AL_SIGNED", alSignOffAt: new Date() },
  });

  const initiativeId = report.application.initiativeId;
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "UPDATE",
      entityType: "INITIATIVE",
      entityId: initiativeId,
      after: { reviewReportStatus: "AL_SIGNED" },
    },
  });

  revalidatePath(`/initiatives/${initiativeId}/application-review`);
  revalidatePath(`/initiatives/${initiativeId}`);
  return {};
}

export async function kmdSignOff(
  reportId: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "review-report:sign-kmd");

  const report = await prisma.applicationReviewReport.findUniqueOrThrow({
    where: { id: reportId },
    select: { status: true, application: { select: { initiativeId: true } } },
  });

  if (report.status !== "AL_SIGNED") {
    return { message: "Report must be AL-signed before KMD can sign off." };
  }

  const parsed = ReviewNoteSchema.safeParse({
    protocolNotes: formData.get("protocolNotes") || undefined,
    reviewComments: formData.get("reviewComments") || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.applicationReviewReport.update({
    where: { id: reportId },
    data: {
      status: "KMD_SIGNED",
      kmdSignOffAt: new Date(),
      kmdReviewerId: user.id,
      protocolNotes: parsed.data.protocolNotes,
      reviewComments: parsed.data.reviewComments,
    },
  });

  const initiativeId = report.application.initiativeId;
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "UPDATE",
      entityType: "INITIATIVE",
      entityId: initiativeId,
      after: { reviewReportStatus: "KMD_SIGNED" },
    },
  });

  revalidatePath(`/initiatives/${initiativeId}/application-review`);
  revalidatePath(`/initiatives/${initiativeId}`);
  return { message: "KMD sign-off recorded." };
}
