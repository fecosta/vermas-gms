import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { prisma } from "@/lib/db/client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { StrategyDocForm } from "@/components/strategy/strategy-doc-form";
import { createStrategyDoc } from "@/app/actions/strategy";
import { ChevronLeftIcon } from "lucide-react";

export default async function NewStrategyDocPage() {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  if (!can(user, "strategy:create")) redirect("/strategy");

  const areas = await prisma.area.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/strategy" />}
          className="mb-2 -ml-2"
        >
          <ChevronLeftIcon className="size-4 mr-1" />
          Back to strategy
        </Button>
        <PageHeader title="New strategy document" />
      </div>

      <StrategyDocForm action={createStrategyDoc} areas={areas} />
    </div>
  );
}
