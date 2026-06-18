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

const STAGE_GUIDE: Partial<Record<Stage, string>> = {
  SOURCED:
    "This initiative has been identified and entered the pipeline. Assign a lead and schedule a scoping call.",
  SCOPING:
    "A scoping call is underway. Gather information to determine fit before requesting a concept note.",
  SCREENING_MATERIALS_REQUESTED:
    "Screening materials have been requested from the organization. Advance to Concept Review once materials are received.",
};

export default async function ScopingPage({
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
      summary: true,
      assignedAlId: true,
      country: true,
      organization: { select: { id: true, name: true } },
    },
  });

  if (!initiative) notFound();

  const stageGuide = STAGE_GUIDE[initiative.stage];

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
        <PageHeader title="Pipeline Entry" description={initiative.name} />
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
          <CardTitle>Initiative overview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {initiative.summary && <p>{initiative.summary}</p>}
          <p>
            <span className="font-medium">Organization: </span>
            {initiative.organization ? (
              <Link
                href={`/organizations/${initiative.organization.id}`}
                className="hover:underline"
              >
                {initiative.organization.name}
              </Link>
            ) : (
              <span className="text-muted-foreground">None assigned</span>
            )}
          </p>
          <p>
            <span className="font-medium">Country: </span>
            {initiative.country}
          </p>
        </CardContent>
      </Card>

      {stageGuide && (
        <Card>
          <CardHeader>
            <CardTitle>Stage guide</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{stageGuide}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
