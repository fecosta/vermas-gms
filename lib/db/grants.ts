import { prisma } from "@/lib/db/client";

export async function getGrant(initiativeId: string) {
  return prisma.grant.findUnique({
    where: { initiativeId },
    include: {
      kpis: { orderBy: { createdAt: "asc" } },
      areaLead: { select: { id: true, name: true } },
      organization: { select: { id: true, name: true } },
    },
  });
}

export type GrantDetail = NonNullable<Awaited<ReturnType<typeof getGrant>>>;
