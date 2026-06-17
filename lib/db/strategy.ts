import { prisma } from "@/lib/db/client";

export async function getStrategyDocs() {
  return prisma.strategyDocument.findMany({
    include: {
      owner: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
      areas: { include: { area: { select: { id: true, name: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getStrategyDoc(id: string) {
  return prisma.strategyDocument.findUniqueOrThrow({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
      areas: { include: { area: { select: { id: true, name: true } } } },
    },
  });
}

export type StrategyDocRow = Awaited<ReturnType<typeof getStrategyDocs>>[number];
export type StrategyDocDetail = Awaited<ReturnType<typeof getStrategyDoc>>;
