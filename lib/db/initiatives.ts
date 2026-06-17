import { prisma } from "@/lib/db/client";
import type { SessionUser } from "@/lib/auth";

export async function getInitiatives(user: SessionUser) {
  const viewAll = ["CEO", "KMD", "ADMIN", "AD"].includes(user.role);

  const where = viewAll
    ? {}
    : {
        OR: [
          { assignedAlId: user.id },
          { supportingAt: { some: { userId: user.id } } },
        ],
      };

  return prisma.initiative.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      area: { select: { id: true, name: true } },
      organization: { select: { id: true, name: true } },
      assignedAl: { select: { id: true, name: true } },
      _count: { select: { decisions: true } },
    },
  });
}

export async function getInitiative(id: string) {
  const initiative = await prisma.initiative.findUniqueOrThrow({
    where: { id },
    include: {
      area: true,
      organization: true,
      primaryContact: true,
      assignedAl: { select: { id: true, name: true, email: true } },
      criteriaSet: { include: { items: { orderBy: { order: "asc" } } } },
      supportingAt: { include: { user: { select: { id: true, name: true, role: true } } } },
      contacts: { include: { contact: true } },
      decisions: {
        include: { decidedBy: { select: { id: true, name: true } } },
        orderBy: { decidedAt: "desc" },
      },
      application: {
        include: {
          reviewReport: {
            include: {
              memo: {
                include: {
                  peerReviews: { select: { id: true, status: true, reviewerId: true } },
                },
              },
            },
          },
        },
      },
      legalDdCase: { select: { id: true, status: true } },
    },
  });

  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: "INITIATIVE", entityId: id },
    include: { actor: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return { initiative, auditLogs };
}

export type InitiativeRow = Awaited<ReturnType<typeof getInitiatives>>[number];
export type InitiativeDetail = Awaited<ReturnType<typeof getInitiative>>;
