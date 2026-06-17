"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { assertCan } from "@/lib/authz";
import { z } from "zod";

const AreaSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
});

type AreaState = { errors?: Record<string, string[]>; message?: string } | null;

export async function createArea(
  _prev: AreaState,
  formData: FormData
): Promise<AreaState> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "users:manage");

  const parsed = AreaSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.area.create({ data: parsed.data });

  revalidatePath("/admin/areas");
  return { message: "Area created." };
}

export async function updateArea(
  areaId: string,
  _prev: AreaState,
  formData: FormData
): Promise<AreaState> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "users:manage");

  const parsed = AreaSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.area.update({ where: { id: areaId }, data: parsed.data });

  revalidatePath("/admin/areas");
  return { message: "Area updated." };
}

export async function deleteArea(
  areaId: string
): Promise<{ error?: string }> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "users:manage");

  const area = await prisma.area.findUniqueOrThrow({
    where: { id: areaId },
    include: {
      _count: { select: { users: true, initiatives: true } },
    },
  });

  if (area._count.users > 0 || area._count.initiatives > 0) {
    return {
      error: `Cannot delete: area has ${area._count.users} user(s) and ${area._count.initiatives} initiative(s).`,
    };
  }

  await prisma.area.delete({ where: { id: areaId } });

  revalidatePath("/admin/areas");
  return {};
}
