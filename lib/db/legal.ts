import { prisma } from "@/lib/db/client";
import { linkedDocumentSelect } from "@/lib/db/documents";

export async function getLegalCases() {
  return prisma.legalDueDiligenceCase.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      initiative: { select: { id: true, name: true, stage: true } },
      organization: { select: { id: true, name: true } },
      ad: { select: { id: true, name: true } },
      _count: { select: { checklistItems: true } },
    },
  });
}

export async function getLegalCase(id: string) {
  return prisma.legalDueDiligenceCase.findUniqueOrThrow({
    where: { id },
    include: {
      initiative: { select: { id: true, name: true, stage: true } },
      organization: { select: { id: true, name: true } },
      ad: { select: { id: true, name: true } },
      checklistItems: {
        orderBy: { createdAt: "asc" },
        include: {
          document: { select: linkedDocumentSelect },
          reviewedBy: { select: { id: true, name: true } },
          revisions: {
            orderBy: { requestedAt: "desc" },
            take: 1,
            include: { requestedBy: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });
}

export type LegalCaseRow = Awaited<ReturnType<typeof getLegalCases>>[number];
export type LegalCaseDetail = Awaited<ReturnType<typeof getLegalCase>>;
