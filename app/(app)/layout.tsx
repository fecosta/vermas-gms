import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppTopBar } from "@/components/shared/app-top-bar";
import { getUnreadCount } from "@/lib/db/notifications";
import type { SessionUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as unknown as SessionUser;
  const unreadCount = await getUnreadCount(user.id);

  return (
    <div className="min-h-screen flex flex-col">
      <AppTopBar user={user} unreadCount={unreadCount} />
      <main className="flex-1 mx-auto w-full max-w-screen-xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
