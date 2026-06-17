import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {user.name} — {user.role.replace("_", " ")}
        </p>
      </div>

      <div className="rounded-lg border bg-muted/40 p-12 text-center">
        <p className="text-muted-foreground text-sm">
          Role-specific dashboard tiles are coming in Sprint 5.
        </p>
        <p className="text-muted-foreground text-xs mt-1">
          Use the navigation above to explore the pipeline, organizations, and more.
        </p>
      </div>
    </div>
  );
}
