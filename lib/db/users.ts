import { prisma } from "@/lib/db/client";

export async function getPeerReviewers() {
  return prisma.user.findMany({
    where: { role: "PEER_REVIEWER", isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

export async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      areaId: true,
      isActive: true,
      createdAt: true,
      area: { select: { id: true, name: true } },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export type UserRow = Awaited<ReturnType<typeof getUsers>>[number];
