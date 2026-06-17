"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { assertCan } from "@/lib/authz";
import { MeetingSchema } from "@/lib/validations";

type State = { errors?: Record<string, string[]>; message?: string } | null;

export async function createMeeting(
  initiativeId: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "meeting:create");

  const parsed = MeetingSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    dateTime: formData.get("dateTime"),
    externalParticipants: formData.get("externalParticipants") || undefined,
    agenda: formData.get("agenda") || undefined,
    minutes: formData.get("minutes") || undefined,
    decisions: formData.get("decisions") || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.meeting.create({
    data: { initiativeId, ...parsed.data },
  });

  revalidatePath(`/initiatives/${initiativeId}`);
  return { message: "Meeting logged." };
}

export async function updateMeeting(
  meetingId: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "meeting:create");

  const parsed = MeetingSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    dateTime: formData.get("dateTime"),
    externalParticipants: formData.get("externalParticipants") || undefined,
    agenda: formData.get("agenda") || undefined,
    minutes: formData.get("minutes") || undefined,
    decisions: formData.get("decisions") || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const meeting = await prisma.meeting.findUniqueOrThrow({
    where: { id: meetingId },
    select: { initiativeId: true },
  });

  await prisma.meeting.update({
    where: { id: meetingId },
    data: parsed.data,
  });

  revalidatePath(`/initiatives/${meeting.initiativeId}`);
  return { message: "Meeting updated." };
}

export async function addMeetingParticipant(
  meetingId: string,
  userId: string
): Promise<void> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "meeting:select-participants");

  const meeting = await prisma.meeting.findUniqueOrThrow({
    where: { id: meetingId },
    select: { initiativeId: true },
  });

  await prisma.meetingParticipant.create({ data: { meetingId, userId } });

  revalidatePath(`/initiatives/${meeting.initiativeId}`);
}

export async function removeMeetingParticipant(
  meetingId: string,
  userId: string
): Promise<void> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "meeting:select-participants");

  const meeting = await prisma.meeting.findUniqueOrThrow({
    where: { id: meetingId },
    select: { initiativeId: true },
  });

  await prisma.meetingParticipant.delete({
    where: { meetingId_userId: { meetingId, userId } },
  });

  revalidatePath(`/initiatives/${meeting.initiativeId}`);
}
