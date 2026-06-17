import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { prisma } from "@/lib/db/client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon } from "lucide-react";
import { AreaList } from "@/components/admin/area-list";
import { CreateAreaForm } from "@/components/admin/create-area-form";
import { createArea } from "@/app/actions/areas";

export default async function AreasPage() {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  if (!can(user, "users:manage")) redirect("/dashboard");

  const areas = await prisma.area.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true, initiatives: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/admin" />}
          className="mb-2 -ml-2"
        >
          <ChevronLeftIcon className="size-4 mr-1" />
          Back to admin
        </Button>
        <PageHeader
          title="Areas"
          description="Manage thematic areas used across the system"
        />
      </div>

      <AreaList areas={areas} />

      <div className="border-t pt-6">
        <h2 className="text-sm font-semibold mb-4">Add area</h2>
        <CreateAreaForm action={createArea} />
      </div>
    </div>
  );
}
