import { prisma } from "@/lib/db/client";

export async function getOrganizations() {
  return prisma.organization.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { initiatives: true, contacts: true } },
    },
  });
}

export async function getOrganization(id: string) {
  return prisma.organization.findUniqueOrThrow({
    where: { id },
    include: {
      contacts: { orderBy: { fullName: "asc" } },
      initiatives: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          stage: true,
          country: true,
          assignedAl: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export type OrgWithCounts = Awaited<ReturnType<typeof getOrganizations>>[number];
export type OrgDetail = Awaited<ReturnType<typeof getOrganization>>;
