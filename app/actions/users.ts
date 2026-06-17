"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { assertCan } from "@/lib/authz";
import bcrypt from "bcryptjs";
import type { Role } from "@/app/generated/prisma/enums";

type InviteState = {
  errors?: Record<string, string[]>;
  message?: string;
  tempPassword?: string;
} | null;

const VALID_ROLES: Role[] = [
  "CEO", "KMD", "AL", "AT", "AD", "TL", "PEER_REVIEWER", "ADMIN",
];

export async function inviteUser(
  _prev: InviteState,
  formData: FormData
): Promise<InviteState> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "users:manage");

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = formData.get("role") as Role;
  const areaId = (formData.get("areaId") as string) || null;

  if (!name || name.length < 1) {
    return { errors: { name: ["Name is required"] } };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { errors: { email: ["Valid email required"] } };
  }
  if (!VALID_ROLES.includes(role)) {
    return { errors: { role: ["Invalid role"] } };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["Email already registered"] } };
  }

  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const tempPassword = Array.from(
    { length: 12 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.create({
    data: { name, email, role, areaId, passwordHash, isActive: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "USER_INVITED",
      entityType: "USER",
      entityId: email,
      after: { name, email, role },
    },
  });

  revalidatePath("/admin");
  return { message: "User invited.", tempPassword };
}

export async function setUserActive(
  userId: string,
  isActive: boolean
): Promise<{ error?: string }> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "users:manage");

  if (userId === user.id) {
    return { error: "Cannot deactivate your own account" };
  }

  await prisma.user.update({ where: { id: userId }, data: { isActive } });

  if (!isActive) {
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "USER_DEACTIVATED",
        entityType: "USER",
        entityId: userId,
        after: { isActive: false },
      },
    });
  }

  revalidatePath("/admin");
  return {};
}

export async function updateUserRole(
  userId: string,
  role: Role,
  areaId: string | null
): Promise<{ error?: string }> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "users:manage");

  await prisma.user.update({ where: { id: userId }, data: { role, areaId } });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "UPDATE",
      entityType: "USER",
      entityId: userId,
      after: { role, areaId },
    },
  });

  revalidatePath("/admin");
  return {};
}
