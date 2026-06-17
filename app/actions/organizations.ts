"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { OrgSchema } from "@/lib/validations";

export type OrgFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  id?: string;
} | null;

function parseOrgForm(formData: FormData) {
  return OrgSchema.safeParse({
    name: formData.get("name"),
    legalName: formData.get("legalName") || undefined,
    country: formData.get("country"),
    website: formData.get("website") || undefined,
    type: formData.get("type"),
    description: formData.get("description") || undefined,
  });
}

export async function createOrganization(
  _prev: OrgFormState,
  formData: FormData
): Promise<OrgFormState> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const parsed = parseOrgForm(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const org = await prisma.organization.create({ data: parsed.data });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "CREATE",
      entityType: "ORGANIZATION",
      entityId: org.id,
      after: parsed.data,
    },
  });

  revalidatePath("/organizations");
  return { message: "Organization created.", id: org.id };
}

export async function updateOrganization(
  id: string,
  _prev: OrgFormState,
  formData: FormData
): Promise<OrgFormState> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const parsed = parseOrgForm(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const before = await prisma.organization.findUniqueOrThrow({
    where: { id },
    select: { name: true, type: true, country: true },
  });

  await prisma.organization.update({ where: { id }, data: parsed.data });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "UPDATE",
      entityType: "ORGANIZATION",
      entityId: id,
      before,
      after: parsed.data,
    },
  });

  revalidatePath("/organizations");
  revalidatePath(`/organizations/${id}`);
  return { message: "Organization updated." };
}
