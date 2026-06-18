import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StageTransitionButton } from "@/components/initiatives/stage-transition-button";
import { ChevronLeftIcon } from "lucide-react";
import type { Stage } from "@/app/generated/prisma/enums";

const STATUS_MESSAGE: Partial<Record<Stage, (orgName: string) => string>> = {
  APPLICATION_REQUESTED: (orgName) =>
    `An application has been requested from ${orgName}. Advance once the application is received.`,
  APPLICATION_RECEIVED: () =>
    "The application has been received. Advance to begin formal review.",
};

export default async function ApplicationRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const initiative = await prisma.initiative.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      stage: true,
      assignedAlId: true,
      organization: { select: { id: true, name: true } },
    },
  });

  if (!initiative) notFound();

  const orgName = initiative.organization?.name ?? "the organization";
  const statusMessage = STATUS_MESSAGE[initiative.stage]?.(orgName);

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href={`/initiatives/${id}`} />}
          className="mb-2 -ml-2"
        >
          <ChevronLeftIcon className="size-4 mr-1" />
          Back to initiative
        </Button>
        <PageHeader title="Application Tracking" description={initiative.name} />
      </div>

      <StageTransitionButton
        initiative={{
          id: initiative.id,
          stage: initiative.stage,
          assignedAlId: initiative.assignedAlId ?? "",
        }}
        user={user}
      />

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {statusMessage && (
            <p className="text-muted-foreground">{statusMessage}</p>
          )}
          {initiative.organization && (
            <p>
              <span className="font-medium">Organization: </span>
              <Link
                href={`/organizations/${initiative.organization.id}`}
                className="hover:underline"
              >
                {initiative.organization.name}
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
