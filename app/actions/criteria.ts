"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { assertCan } from "@/lib/authz";
import { CriteriaSetSchema, CriteriaItemSchema } from "@/lib/validations";

type State = { errors?: Record<string, string[]>; message?: string } | null;

export async function createCriteriaSet(
  _prev: State,
  formData: FormData
): Promise<State> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "criteria:manage");

  const parsed = CriteriaSetSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const set = await prisma.criteriaSet.create({ data: parsed.data });
  redirect(`/criteria/${set.id}`);
}

export async function updateCriteriaSet(
  setId: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "criteria:manage");

  const parsed = CriteriaSetSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.criteriaSet.update({ where: { id: setId }, data: parsed.data });
  revalidatePath(`/criteria/${setId}`);
  revalidatePath("/criteria");
  return { message: "Saved." };
}

export async function addCriteriaItem(
  setId: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "criteria:manage");

  const parsed = CriteriaItemSchema.safeParse({
    label: formData.get("label"),
    guidance: formData.get("guidance") || undefined,
    order: formData.get("order") || 0,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.criteriaItem.create({
    data: { setId, label: parsed.data.label, guidance: parsed.data.guidance, order: parsed.data.order },
  });

  revalidatePath(`/criteria/${setId}`);
  return { message: "Item added." };
}

export async function deleteCriteriaItem(itemId: string): Promise<{ error?: string }> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "criteria:manage");

  const item = await prisma.criteriaItem.findUniqueOrThrow({
    where: { id: itemId },
    select: { setId: true },
  });

  await prisma.criteriaItem.delete({ where: { id: itemId } });
  revalidatePath(`/criteria/${item.setId}`);
  return {};
}
