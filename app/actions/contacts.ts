"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { assertCan } from "@/lib/authz";
import { ContactSchema } from "@/lib/validations";

export type ContactFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  id?: string;
} | null;

function parseContactForm(formData: FormData) {
  return ContactSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    title: formData.get("title") || undefined,
    organizationId: formData.get("organizationId") || undefined,
  });
}

export async function createContact(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const parsed = parseContactForm(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const contact = await prisma.contact.create({ data: parsed.data });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "CREATE",
      entityType: "CONTACT",
      entityId: contact.id,
      after: parsed.data,
    },
  });

  revalidatePath("/contacts");
  if (parsed.data.organizationId) {
    revalidatePath(`/organizations/${parsed.data.organizationId}`);
  }
  return { message: "Contact created.", id: contact.id };
}

export async function updateContact(
  id: string,
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const parsed = parseContactForm(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const before = await prisma.contact.findUniqueOrThrow({
    where: { id },
    select: { fullName: true, email: true },
  });

  await prisma.contact.update({ where: { id }, data: parsed.data });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "UPDATE",
      entityType: "CONTACT",
      entityId: id,
      before,
      after: parsed.data,
    },
  });

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  return { message: "Contact updated." };
}

export async function linkContactToInitiative(
  initiativeId: string,
  contactId: string
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

  await prisma.initiativeContact.upsert({
    where: { initiativeId_contactId: { initiativeId, contactId } },
    create: { initiativeId, contactId },
    update: {},
  });

  revalidatePath(`/initiatives/${initiativeId}`);
  return {};
}

export async function unlinkContactFromInitiative(
  initiativeId: string,
  contactId: string
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

  await prisma.initiativeContact.delete({
    where: { initiativeId_contactId: { initiativeId, contactId } },
  });

  revalidatePath(`/initiatives/${initiativeId}`);
}
