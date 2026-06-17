"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { markNotificationsRead } from "@/lib/db/notifications";

export async function markAllRead(): Promise<void> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  await markNotificationsRead(user.id);
  revalidatePath("/notifications");
}
