"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { assertCan } from "@/lib/authz";
import { ChecklistItemSchema } from "@/lib/validations";
import type { ChecklistItemStatus } from "@/app/generated/prisma/enums";

type State = { errors?: Record<string, string[]>; message?: string } | null;

export async function addChecklistItem(
  caseId: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "legal-dd:manage");

  const parsed = ChecklistItemSchema.safeParse({
    requiredDocName: formData.get("requiredDocName"),
    description: formData.get("description") || undefined,
    isRequired: formData.get("isRequired") ?? "true",
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.legalChecklistItem.create({
    data: {
      caseId,
      requiredDocName: parsed.data.requiredDocName,
      description: parsed.data.description,
      isRequired: parsed.data.isRequired,
    },
  });

  revalidatePath(`/legal/${caseId}`);
  return { message: "Item added." };
}

export async function updateChecklistItemStatus(
  itemId: string,
  status: ChecklistItemStatus
): Promise<{ error?: string }> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "legal-dd:manage");

  await prisma.legalChecklistItem.update({
    where: { id: itemId },
    data: { status, reviewedById: user.id, reviewedDate: new Date() },
  });

  const item = await prisma.legalChecklistItem.findUniqueOrThrow({
    where: { id: itemId },
    select: { caseId: true },
  });

  if (status === "SUBMITTED") {
    const caseData = await prisma.legalDueDiligenceCase.findUniqueOrThrow({
      where: { id: item.caseId },
      select: {
        initiativeId: true,
        initiative: { select: { assignedAlId: true, name: true } },
      },
    });
    if (caseData.initiative.assignedAlId) {
      await prisma.notification.create({
        data: {
          userId: caseData.initiative.assignedAlId,
          type: "LEGAL_DOCUMENT_UPLOADED",
          message: `A legal document was uploaded for "${caseData.initiative.name}"`,
          relatedType: "INITIATIVE",
          relatedId: caseData.initiativeId,
        },
      });
    }
  }

  revalidatePath(`/legal/${item.caseId}`);
  return {};
}

export async function validateWithTrust(caseId: string): Promise<{ error?: string }> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "legal-dd:manage");

  await prisma.legalDueDiligenceCase.update({
    where: { id: caseId },
    data: { trustValidationStatus: "VALIDATED", status: "VALIDATED" },
  });

  const legalCase = await prisma.legalDueDiligenceCase.findUniqueOrThrow({
    where: { id: caseId },
    select: { initiativeId: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "LEGAL_STATUS_CHANGE",
      entityType: "INITIATIVE",
      entityId: legalCase.initiativeId,
      after: { legalCaseStatus: "VALIDATED", trustValidation: "VALIDATED" },
    },
  });

  revalidatePath(`/legal/${caseId}`);
  revalidatePath(`/initiatives/${legalCase.initiativeId}`);
  return {};
}

export async function completeLegalCase(caseId: string): Promise<{ error?: string }> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "legal-dd:complete");

  const legalCase = await prisma.legalDueDiligenceCase.findUniqueOrThrow({
    where: { id: caseId },
    select: {
      initiativeId: true,
      status: true,
      initiative: { select: { assignedAlId: true, name: true } },
    },
  });

  if (legalCase.status !== "VALIDATED") {
    return { error: "Case must be validated with trust before completing." };
  }

  await prisma.legalDueDiligenceCase.update({
    where: { id: caseId },
    data: { status: "COMPLETE", completedDate: new Date() },
  });

  await prisma.notification.create({
    data: {
      userId: legalCase.initiative.assignedAlId,
      type: "LEGAL_DD_COMPLETED",
      message: `Legal due diligence completed for "${legalCase.initiative.name}"`,
      relatedType: "INITIATIVE",
      relatedId: legalCase.initiativeId,
    },
  });

  await prisma.initiative.update({
    where: { id: legalCase.initiativeId },
    data: { stage: "LEGAL_DD_COMPLETE", legalDdStatus: "COMPLETE" },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "STAGE_CHANGE",
      entityType: "INITIATIVE",
      entityId: legalCase.initiativeId,
      before: { stage: "LEGAL_DUE_DILIGENCE" },
      after: { stage: "LEGAL_DD_COMPLETE" },
    },
  });

  revalidatePath(`/legal/${caseId}`);
  revalidatePath(`/legal`);
  revalidatePath(`/initiatives/${legalCase.initiativeId}`);
  return {};
}

export async function requestRevision(
  checklistItemId: string,
  notes: string
): Promise<{ error?: string }> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "legal-dd:manage");

  if (!notes.trim()) {
    return { error: "Notes are required." };
  }

  const item = await prisma.legalChecklistItem.findUniqueOrThrow({
    where: { id: checklistItemId },
    select: { caseId: true },
  });

  await prisma.$transaction([
    prisma.revisionRequest.create({
      data: { caseId: item.caseId, checklistItemId, notes: notes.trim(), requestedById: user.id },
    }),
    prisma.legalChecklistItem.update({
      where: { id: checklistItemId },
      data: { status: "REVISION_REQUESTED" },
    }),
  ]);

  const ddCase = await prisma.legalDueDiligenceCase.findUniqueOrThrow({
    where: { id: item.caseId },
    select: {
      initiativeId: true,
      initiative: { select: { assignedAlId: true, name: true } },
    },
  });

  await prisma.notification.create({
    data: {
      userId: ddCase.initiative.assignedAlId,
      type: "LEGAL_REVISION_REQUESTED",
      message: `Revisions were requested on a legal DD document for "${ddCase.initiative.name}"`,
      relatedType: "INITIATIVE",
      relatedId: ddCase.initiativeId,
    },
  });

  revalidatePath(`/legal/${item.caseId}`);
  return {};
}

export async function resolveRevision(
  revisionId: string
): Promise<{ error?: string }> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "legal-dd:manage");

  const revision = await prisma.revisionRequest.update({
    where: { id: revisionId },
    data: { resolvedAt: new Date() },
    select: { caseId: true },
  });

  revalidatePath(`/legal/${revision.caseId}`);
  return {};
}
