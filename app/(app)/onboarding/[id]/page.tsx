import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/client";

export default async function OnboardingHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await auth();

  const initiative = await prisma.initiative.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!initiative) notFound();
  redirect(`/initiatives/${id}/onboarding`);
}
