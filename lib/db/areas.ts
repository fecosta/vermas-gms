import { prisma } from "@/lib/db/client";

export async function getAreas() {
  return prisma.area.findMany({ orderBy: { name: "asc" } });
}
