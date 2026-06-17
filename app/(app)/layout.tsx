import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Nav } from "@/components/shared/nav";
import type { SessionUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as unknown as SessionUser;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav user={user} />
      <main className="flex-1 mx-auto w-full max-w-screen-xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
