"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { assertCan } from "@/lib/authz";
import { canTransition } from "@/lib/workflow";
import type { Stage } from "@/app/generated/prisma/enums";
import { InitiativeSchema } from "@/lib/validations";

type State = { errors?: Record<string, string[]>; message?: string } | null;

function parseInitiativeForm(formData: FormData) {
  return InitiativeSchema.safeParse({
    name: formData.get("name"),
    organizationId: formData.get("organizationId") || undefined,
    individualName: formData.get("individualName") || undefined,
    primaryContactId: formData.get("primaryContactId") || undefined,
    areaId: formData.get("areaId"),
    country: formData.get("country"),
    summary: formData.get("summary"),
    source: formData.get("source") || undefined,
    needsTechReview: formData.get("needsTechReview") === "true",
    fitScore: formData.get("fitScore") || undefined,
    thematicAlignment: formData.get("thematicAlignment") || undefined,
    strategicFitNotes: formData.get("strategicFitNotes") || undefined,
    solutionStrengthNotes: formData.get("solutionStrengthNotes") || undefined,
    executionCapacityNotes: formData.get("executionCapacityNotes") || undefined,
    scopingCallStatus: formData.get("scopingCallStatus") || undefined,
    scopingCallNotes: formData.get("scopingCallNotes") || undefined,
    scopingCallDate: formData.get("scopingCallDate") || undefined,
  });
}

export async function createInitiative(
  _prev: State,
  formData: FormData
): Promise<State> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "initiative:create");

  const parsed = parseInitiativeForm(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const initiative = await prisma.initiative.create({
    data: { ...parsed.data, assignedAlId: user.id },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "CREATE",
      entityType: "INITIATIVE",
      entityId: initiative.id,
      after: { name: parsed.data.name, stage: "SOURCED" },
    },
  });

  revalidatePath("/initiatives");
  redirect(`/initiatives/${initiative.id}`);
}

export async function updateInitiative(
  id: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const existing = await prisma.initiative.findUniqueOrThrow({
    where: { id },
    select: { assignedAlId: true, name: true, stage: true },
  });

  assertCan(user, "initiative:edit", {
    type: "initiative",
    assignedAlId: existing.assignedAlId,
    supportingAtIds: [],
  });

  const parsed = parseInitiativeForm(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.initiative.update({ where: { id }, data: parsed.data });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "UPDATE",
      entityType: "INITIATIVE",
      entityId: id,
      before: { name: existing.name },
      after: { name: parsed.data.name },
    },
  });

  revalidatePath(`/initiatives/${id}`);
  revalidatePath("/initiatives");
  return { message: "Initiative updated." };
}

export async function moveInitiativeStage(
  id: string,
  toStage: Stage
): Promise<{ error?: string }> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const initiative = await prisma.initiative.findUniqueOrThrow({
    where: { id },
    select: { id: true, stage: true, assignedAlId: true },
  });

  assertCan(user, "initiative:move-stage", {
    type: "initiative",
    assignedAlId: initiative.assignedAlId,
    supportingAtIds: [],
  });

  // Fetch gate prerequisites
  const [reviewReport, legalCase, lastConceptDecision, lastMemoDecision, peerReviews] =
    await Promise.all([
      prisma.applicationReviewReport.findFirst({
        where: { application: { initiativeId: id } },
        select: { status: true },
      }),
      prisma.legalDueDiligenceCase.findFirst({
        where: { initiativeId: id },
        select: { status: true },
      }),
      prisma.decision.findFirst({
        where: { initiativeId: id, type: "CONCEPT" },
        orderBy: { decidedAt: "desc" },
        select: { decision: true },
      }),
      prisma.decision.findFirst({
        where: { initiativeId: id, type: "MEMO" },
        orderBy: { decidedAt: "desc" },
        select: { decision: true },
      }),
      prisma.peerReview.findMany({
        where: { memo: { reviewReport: { application: { initiativeId: id } } } },
        select: { status: true, reviewerId: true },
      }),
    ]);

  const result = canTransition(
    {
      initiative,
      actor: user,
      reviewReportStatus: reviewReport?.status ?? null,
      legalDdCaseStatus: legalCase?.status ?? null,
      lastConceptDecision: lastConceptDecision?.decision ?? null,
      lastMemoDecision: lastMemoDecision?.decision ?? null,
      peerReviewsComplete:
        peerReviews.length >= 2 &&
        peerReviews.every((pr) => pr.status === "COMPLETE"),
      peerReviewerNominated: peerReviews.length >= 2,
    },
    toStage
  );

  if (!result.allowed) {
    return { error: result.reason };
  }

  const fullInitiative = await prisma.initiative.findUniqueOrThrow({
    where: { id },
    select: { organizationId: true, assignedAlId: true, name: true },
  });

  await prisma.initiative.update({ where: { id }, data: { stage: toStage } });

  // Auto-provision dependent records on key stage entries
  if (toStage === "APPLICATION_REVIEW" && fullInitiative.organizationId) {
    const app = await prisma.application.upsert({
      where: { initiativeId: id },
      create: {
        initiativeId: id,
        organizationId: fullInitiative.organizationId,
        alId: user.id,
        status: "IN_REVIEW",
      },
      update: { status: "IN_REVIEW" },
    });
    await prisma.applicationReviewReport.upsert({
      where: { applicationId: app.id },
      create: { applicationId: app.id, status: "IN_PROGRESS" },
      update: {},
    });
  }

  if (toStage === "MEMO_DRAFTING") {
    const app = await prisma.application.findUnique({ where: { initiativeId: id } });
    if (app) {
      const report = await prisma.applicationReviewReport.findUnique({
        where: { applicationId: app.id },
      });
      if (report) {
        await prisma.investmentMemo.upsert({
          where: { reviewReportId: report.id },
          create: { reviewReportId: report.id, authorAlId: user.id, reviewStatus: "DRAFT" },
          update: {},
        });
      }
    }
  }

  if (toStage === "LEGAL_DUE_DILIGENCE" && fullInitiative.organizationId) {
    const firstAD = await prisma.user.findFirst({
      where: { role: "AD", isActive: true },
      select: { id: true },
    });
    if (firstAD) {
      await prisma.legalDueDiligenceCase.upsert({
        where: { initiativeId: id },
        create: {
          initiativeId: id,
          organizationId: fullInitiative.organizationId,
          adId: firstAD.id,
          status: "DOCUMENTS_PENDING",
        },
        update: {},
      });
      await prisma.notification.create({
        data: {
          userId: firstAD.id,
          type: "LEGAL_DD_STARTED",
          message: `Legal due diligence started for "${fullInitiative.name}"`,
          relatedType: "INITIATIVE",
          relatedId: id,
        },
      });
    }
  }

  if (toStage === "ONBOARDING" && fullInitiative.organizationId) {
    await prisma.grant.upsert({
      where: { initiativeId: id },
      create: {
        initiativeId: id,
        organizationId: fullInitiative.organizationId,
        areaLeadId: fullInitiative.assignedAlId,
        status: "ACTIVE",
        onboardingStatus: "IN_PROGRESS",
      },
      update: {},
    });
    await prisma.notification.create({
      data: {
        userId: fullInitiative.assignedAlId,
        type: "ONBOARDING_STARTED",
        message: `"${fullInitiative.name}" has entered onboarding`,
        relatedType: "INITIATIVE",
        relatedId: id,
      },
    });
  }

  if (toStage === "APPLICATION_RECEIVED" && fullInitiative.assignedAlId) {
    await prisma.notification.create({
      data: {
        userId: fullInitiative.assignedAlId,
        type: "APPLICATION_RECEIVED",
        message: `Application received for "${fullInitiative.name}"`,
        relatedType: "INITIATIVE",
        relatedId: id,
      },
    });
  }

  if (toStage === "APPLICATION_REVIEW" && fullInitiative.assignedAlId) {
    await prisma.notification.create({
      data: {
        userId: fullInitiative.assignedAlId,
        type: "AL_RESPONSE_NEEDED",
        message: `Application review started for "${fullInitiative.name}". Your response is needed.`,
        relatedType: "INITIATIVE",
        relatedId: id,
      },
    });
  }

  if (toStage === "CONCEPT_REVIEW" || toStage === "CEO_COMMITTEE_REVIEW") {
    const ceoUsers = await prisma.user.findMany({
      where: { role: "CEO", isActive: true },
      select: { id: true },
    });
    if (ceoUsers.length > 0) {
      const notifType =
        toStage === "CONCEPT_REVIEW" ? "CONCEPT_NOTE_SENT_TO_CEO" : "MEMO_SENT_TO_CEO";
      const label = toStage === "CONCEPT_REVIEW" ? "concept" : "memo";
      await prisma.notification.createMany({
        data: ceoUsers.map((u) => ({
          userId: u.id,
          type: notifType,
          message: `"${fullInitiative.name}" is ready for CEO ${label} review`,
          relatedType: "INITIATIVE",
          relatedId: id,
        })),
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "STAGE_CHANGE",
      entityType: "INITIATIVE",
      entityId: id,
      before: { stage: initiative.stage },
      after: { stage: toStage },
    },
  });

  revalidatePath(`/initiatives/${id}`);
  revalidatePath("/initiatives");
  return {};
}

export async function assignCriteriaSet(
  initiativeId: string,
  criteriaSetId: string | null
): Promise<{ error?: string }> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const initiative = await prisma.initiative.findUniqueOrThrow({
    where: { id: initiativeId },
    select: {
      assignedAlId: true,
      supportingAt: { select: { userId: true } },
    },
  });

  assertCan(user, "initiative:edit", {
    type: "initiative",
    assignedAlId: initiative.assignedAlId,
    supportingAtIds: initiative.supportingAt.map((s) => s.userId),
  });

  await prisma.initiative.update({
    where: { id: initiativeId },
    data: { criteriaSetId },
  });

  revalidatePath(`/initiatives/${initiativeId}`);
  return {};
}

export async function addSupportingAt(
  initiativeId: string,
  userId: string
): Promise<{ error?: string }> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const initiative = await prisma.initiative.findUniqueOrThrow({
    where: { id: initiativeId },
    select: { assignedAlId: true, supportingAt: { select: { userId: true } } },
  });

  assertCan(user, "initiative:edit", {
    type: "initiative",
    assignedAlId: initiative.assignedAlId,
    supportingAtIds: initiative.supportingAt.map((s) => s.userId),
  });

  await prisma.initiativeSupport.upsert({
    where: { initiativeId_userId: { initiativeId, userId } },
    create: { initiativeId, userId },
    update: {},
  });

  revalidatePath(`/initiatives/${initiativeId}`);
  return {};
}

export async function removeSupportingAt(
  initiativeId: string,
  userId: string
): Promise<void> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const initiative = await prisma.initiative.findUniqueOrThrow({
    where: { id: initiativeId },
    select: { assignedAlId: true, supportingAt: { select: { userId: true } } },
  });

  assertCan(user, "initiative:edit", {
    type: "initiative",
    assignedAlId: initiative.assignedAlId,
    supportingAtIds: initiative.supportingAt.map((s) => s.userId),
  });

  await prisma.initiativeSupport.delete({
    where: { initiativeId_userId: { initiativeId, userId } },
  });

  revalidatePath(`/initiatives/${initiativeId}`);
}
