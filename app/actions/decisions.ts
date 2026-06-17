"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { assertCan } from "@/lib/authz";
import { DecisionSchema } from "@/lib/validations";
import type { Stage } from "@/app/generated/prisma/enums";

export type DecisionFormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | null;

export async function recordDecision(
  initiativeId: string,
  _prev: DecisionFormState,
  formData: FormData
): Promise<DecisionFormState> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "decision:record");

  const parsed = DecisionSchema.safeParse({
    type: formData.get("type"),
    decision: formData.get("decision"),
    rationale: formData.get("rationale") || undefined,
    conditions: formData.get("conditions") || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const initiative = await prisma.initiative.findUniqueOrThrow({
    where: { id: initiativeId },
    select: { id: true, stage: true },
  });

  await prisma.decision.create({
    data: {
      initiativeId,
      type: parsed.data.type,
      decision: parsed.data.decision,
      rationale: parsed.data.rationale,
      conditions: parsed.data.conditions,
      decidedById: user.id,
      decidedAt: new Date(),
    },
  });

  // Advance stage: CONCEPT_REVIEW → CONCEPT_DECISION, CEO_COMMITTEE_REVIEW → MEMO_DECISION
  const stageMap: Partial<Record<Stage, Stage>> = {
    CONCEPT_REVIEW: "CONCEPT_DECISION",
    CEO_COMMITTEE_REVIEW: "MEMO_DECISION",
  };
  const nextStage = stageMap[initiative.stage];

  if (nextStage) {
    await prisma.initiative.update({
      where: { id: initiativeId },
      data: {
        stage: nextStage,
        ceoDecisionStatus: parsed.data.decision,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "STAGE_CHANGE",
        entityType: "INITIATIVE",
        entityId: initiativeId,
        before: { stage: initiative.stage },
        after: { stage: nextStage },
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "DECISION_RECORDED",
      entityType: "INITIATIVE",
      entityId: initiativeId,
      after: {
        type: parsed.data.type,
        decision: parsed.data.decision,
        rationale: parsed.data.rationale,
      },
    },
  });

  revalidatePath(`/initiatives/${initiativeId}`);
  revalidatePath(`/initiatives/${initiativeId}/concept-review`);
  revalidatePath("/initiatives");
  return { message: "Decision recorded." };
}
