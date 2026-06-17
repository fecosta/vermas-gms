"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { assertCan } from "@/lib/authz";
import { StrategyDocSchema } from "@/lib/validations";

type State = { errors?: Record<string, string[]>; message?: string } | null;

export async function createStrategyDoc(
  _prev: State,
  formData: FormData
): Promise<State> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "strategy:create");

  const areaIds = formData.getAll("areaIds") as string[];
  const parsed = StrategyDocSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    body: (formData.get("body") as string) || undefined,
    areaIds,
  });

  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const doc = await prisma.strategyDocument.create({
    data: {
      title: parsed.data.title,
      type: parsed.data.type,
      status: "DRAFT",
      version: 1,
      ownerId: user.id,
      body: parsed.data.body,
      areas: {
        create: parsed.data.areaIds.map((areaId) => ({ areaId })),
      },
    },
  });

  revalidatePath("/strategy");
  redirect(`/strategy/${doc.id}`);
}

export async function updateStrategyDoc(
  docId: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "strategy:edit");

  const doc = await prisma.strategyDocument.findUniqueOrThrow({
    where: { id: docId },
    select: { status: true },
  });

  if (doc.status === "APPROVED") {
    return { errors: { _form: ["Approved documents cannot be edited"] } };
  }

  const areaIds = formData.getAll("areaIds") as string[];
  const parsed = StrategyDocSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    body: (formData.get("body") as string) || undefined,
    areaIds,
  });

  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  await prisma.$transaction([
    prisma.strategyDocumentArea.deleteMany({ where: { strategyDocumentId: docId } }),
    prisma.strategyDocument.update({
      where: { id: docId },
      data: {
        title: parsed.data.title,
        type: parsed.data.type,
        body: parsed.data.body,
        areas: {
          create: parsed.data.areaIds.map((areaId) => ({ areaId })),
        },
      },
    }),
  ]);

  revalidatePath(`/strategy/${docId}`);
  revalidatePath("/strategy");
  return { message: "Document saved." };
}

export async function submitStrategyDocForReview(
  docId: string
): Promise<{ error?: string }> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "strategy:edit");

  const doc = await prisma.strategyDocument.findUniqueOrThrow({
    where: { id: docId },
    select: { status: true },
  });

  if (doc.status !== "DRAFT") {
    return { error: "Only DRAFT documents can be submitted for review" };
  }

  await prisma.strategyDocument.update({
    where: { id: docId },
    data: { status: "IN_REVIEW" },
  });

  revalidatePath(`/strategy/${docId}`);
  revalidatePath("/strategy");
  return {};
}

export async function approveStrategyDoc(
  docId: string
): Promise<{ error?: string }> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "strategy:approve");

  const doc = await prisma.strategyDocument.findUniqueOrThrow({
    where: { id: docId },
    select: { status: true },
  });

  if (doc.status !== "IN_REVIEW") {
    return { error: "Only IN_REVIEW documents can be approved" };
  }

  await prisma.strategyDocument.update({
    where: { id: docId },
    data: {
      status: "APPROVED",
      approvedById: user.id,
      approvalDate: new Date(),
    },
  });

  revalidatePath(`/strategy/${docId}`);
  revalidatePath("/strategy");
  return {};
}
