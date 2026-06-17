import { prisma } from "@/lib/db/client";

export async function getMeetings(initiativeId: string) {
  return prisma.meeting.findMany({
    where: { initiativeId },
    orderBy: { dateTime: "desc" },
  });
}

export type MeetingRow = Awaited<ReturnType<typeof getMeetings>>[number];
