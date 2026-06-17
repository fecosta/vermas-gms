"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { assertCan } from "@/lib/authz";
import { GrantSchema, KPISchema } from "@/lib/validations";

export type GrantFormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | null;

type KPIState = { errors?: Record<string, string[]>; message?: string } | null;

export async function createOrUpdateGrant(
  initiativeId: string,
  _prev: GrantFormState,
  formData: FormData
): Promise<GrantFormState> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const existing = await prisma.grant.findUnique({ where: { initiativeId }, select: { id: true } });
  assertCan(user, existing ? "grant:edit" : "grant:create");

  const supportTypeRaw = formData.getAll("supportType") as string[];

  const parsed = GrantSchema.safeParse({
    amount: formData.get("amount") || undefined,
    currency: formData.get("currency") || undefined,
    reportingCadence: formData.get("reportingCadence") || undefined,
    nextReportDue: formData.get("nextReportDue") || undefined,
    scope: formData.get("scope") || undefined,
    reportingConditions: formData.get("reportingConditions") || undefined,
    supportType: supportTypeRaw.filter(Boolean),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const initiative = await prisma.initiative.findUniqueOrThrow({
    where: { id: initiativeId },
    select: { organizationId: true, assignedAlId: true },
  });

  if (!initiative.organizationId) {
    return { errors: { amount: ["Initiative must have an organization to create a grant."] } };
  }

  await prisma.grant.upsert({
    where: { initiativeId },
    create: {
      initiativeId,
      organizationId: initiative.organizationId,
      areaLeadId: initiative.assignedAlId,
      onboardingStatus: "IN_PROGRESS",
      ...parsed.data,
    },
    update: parsed.data,
  });

  revalidatePath(`/initiatives/${initiativeId}/onboarding`);
  return { message: "Grant saved." };
}

export async function addKPI(
  grantId: string,
  _prev: KPIState,
  formData: FormData
): Promise<KPIState> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "grant:edit");

  const parsed = KPISchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    target: formData.get("target") || undefined,
    cadence: formData.get("cadence") || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.kPI.create({ data: { grantId, ...parsed.data } });

  const grant = await prisma.grant.findUniqueOrThrow({
    where: { id: grantId },
    select: { initiativeId: true },
  });

  revalidatePath(`/initiatives/${grant.initiativeId}/onboarding`);
  return { message: "KPI added." };
}

export async function deleteKPI(kpiId: string): Promise<void> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "grant:edit");

  const kpi = await prisma.kPI.findUniqueOrThrow({
    where: { id: kpiId },
    select: { grant: { select: { initiativeId: true } } },
  });

  await prisma.kPI.delete({ where: { id: kpiId } });

  revalidatePath(`/initiatives/${kpi.grant.initiativeId}/onboarding`);
}
