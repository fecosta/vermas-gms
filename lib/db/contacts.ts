import { prisma } from "@/lib/db/client";

export async function getContacts(orgId?: string) {
  return prisma.contact.findMany({
    where: orgId ? { organizationId: orgId } : undefined,
    orderBy: { fullName: "asc" },
    include: {
      organization: { select: { id: true, name: true } },
    },
  });
}

export async function getContact(id: string) {
  return prisma.contact.findUniqueOrThrow({
    where: { id },
    include: {
      organization: true,
      primaryForInitiatives: {
        select: { id: true, name: true, stage: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
}

export type ContactWithOrg = Awaited<ReturnType<typeof getContacts>>[number];
export type ContactDetail = Awaited<ReturnType<typeof getContact>>;
