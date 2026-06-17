import { prisma } from "@/lib/db/client";

export async function getPeerReviewers() {
  return prisma.user.findMany({
    where: { role: "PEER_REVIEWER", isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}
