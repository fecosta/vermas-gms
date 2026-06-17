import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { getAreas } from "@/lib/db/areas";
import { getOrganizations } from "@/lib/db/organizations";
import { PageHeader } from "@/components/shared/page-header";
import { InitiativeEditForm } from "@/components/initiatives/initiative-edit-form";
import { can } from "@/lib/authz";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InitiativeEditPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const initiative = await prisma.initiative
    .findUnique({
      where: { id },
      include: { supportingAt: true },
    })
    .catch(() => null);

  if (!initiative) notFound();

  const canEdit = can(user, "initiative:edit", {
    type: "initiative",
    assignedAlId: initiative.assignedAlId,
    supportingAtIds: initiative.supportingAt.map((s) => s.userId),
  });

  if (!canEdit) redirect(`/initiatives/${id}`);

  const [areas, orgs] = await Promise.all([getAreas(), getOrganizations()]);

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Edit initiative"
        description={initiative.name}
      />
      <InitiativeEditForm
        initiative={initiative}
        areas={areas}
        organizations={orgs.map((o) => ({ id: o.id, name: o.name }))}
      />
    </div>
  );
}
