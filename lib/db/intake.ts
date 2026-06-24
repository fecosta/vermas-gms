import { prisma } from "@/lib/db/client";

export async function getIntakes() {
  // NEEDS_TRIAGE sorts first (enum definition order), newest submission first.
  return prisma.applicationIntake.findMany({
    orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
  });
}

export async function getPendingIntakeCount() {
  return prisma.applicationIntake.count({ where: { status: "NEEDS_TRIAGE" } });
}

// Options for the triage form.
export async function getTriageOptions() {
  const [initiatives, organizations, areas, alUsers] = await Promise.all([
    prisma.initiative.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, stage: true, organizationId: true },
    }),
    prisma.organization.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, country: true },
    }),
    prisma.area.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { role: "AL", isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return { initiatives, organizations, areas, alUsers };
}

export type IntakeRow = Awaited<ReturnType<typeof getIntakes>>[number];
export type TriageOptions = Awaited<ReturnType<typeof getTriageOptions>>;
