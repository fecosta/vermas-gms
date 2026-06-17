import { prisma } from "@/lib/db/client";

export async function getCriteriaSets() {
  return prisma.criteriaSet.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true, initiatives: true } } },
  });
}

export async function getCriteriaSet(id: string) {
  return prisma.criteriaSet.findUniqueOrThrow({
    where: { id },
    include: {
      items: { orderBy: { order: "asc" } },
      _count: { select: { initiatives: true } },
    },
  });
}

export type CriteriaSetRow = Awaited<ReturnType<typeof getCriteriaSets>>[number];
export type CriteriaSetDetail = Awaited<ReturnType<typeof getCriteriaSet>>;
