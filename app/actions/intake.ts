"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { assertCan } from "@/lib/authz";
import { getGoogleAccessToken } from "@/lib/google/auth";
import { getFile, type DriveFile } from "@/lib/google/drive";
import { STAGE_ORDER } from "@/lib/workflow";
import type { OrgType } from "@/app/generated/prisma/enums";

type TriageInput = {
  intakeId: string;
  googleFileId?: string;
} & (
  | { mode: "existing"; initiativeId: string }
  | {
      mode: "new";
      organizationId?: string;
      newOrg?: { name: string; country: string; type: OrgType };
      initiativeName: string;
      areaId: string;
      assignedAlId: string;
    }
);

type TriageResult = { error?: string; initiativeId?: string };

const APP_RECEIVED_IDX = STAGE_ORDER.indexOf("APPLICATION_RECEIVED");

export async function triageIntake(input: TriageInput): Promise<TriageResult> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "intake:triage");

  const intake = await prisma.applicationIntake.findUniqueOrThrow({
    where: { id: input.intakeId },
  });
  if (intake.status !== "NEEDS_TRIAGE") {
    return { error: "This submission has already been triaged." };
  }

  // Fetch Drive PDF metadata up front so a failure aborts before any writes.
  let driveFile: DriveFile | null = null;
  if (input.googleFileId) {
    const token = await getGoogleAccessToken();
    if (!token) return { error: "Your Google session expired — sign in again." };
    try {
      driveFile = await getFile(token, input.googleFileId);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Could not read the Drive file." };
    }
  }

  let initiativeId: string;
  let organizationId: string;
  let alId: string;
  let initiativeName: string;
  let currentStageIdx: number;

  if (input.mode === "existing") {
    const init = await prisma.initiative.findUniqueOrThrow({
      where: { id: input.initiativeId },
      select: {
        id: true,
        name: true,
        organizationId: true,
        assignedAlId: true,
        stage: true,
      },
    });
    if (!init.organizationId) {
      return {
        error:
          "That initiative has no organization. Add one before linking an application.",
      };
    }
    initiativeId = init.id;
    organizationId = init.organizationId;
    alId = init.assignedAlId;
    initiativeName = init.name;
    currentStageIdx = STAGE_ORDER.indexOf(init.stage);
  } else {
    // Inbound: resolve or create the organization.
    let orgId = input.organizationId ?? null;
    let orgCountry = "";
    if (orgId) {
      const org = await prisma.organization.findUniqueOrThrow({
        where: { id: orgId },
        select: { country: true },
      });
      orgCountry = org.country;
    } else if (input.newOrg?.name?.trim()) {
      const org = await prisma.organization.create({
        data: {
          name: input.newOrg.name.trim(),
          country: input.newOrg.country,
          type: input.newOrg.type,
        },
      });
      orgId = org.id;
      orgCountry = org.country;
    } else {
      return { error: "Choose or create an organization." };
    }

    if (!input.initiativeName?.trim()) return { error: "Initiative name is required." };
    if (!input.areaId) return { error: "Area is required." };
    if (!input.assignedAlId) return { error: "Assigned AL is required." };

    const created = await prisma.initiative.create({
      data: {
        name: input.initiativeName.trim(),
        organizationId: orgId,
        areaId: input.areaId,
        assignedAlId: input.assignedAlId,
        country: orgCountry || "—",
        summary: `Application received via Jotform${
          intake.submittedByName ? ` from ${intake.submittedByName}` : ""
        }.`,
        source: "Jotform",
        stage: "APPLICATION_RECEIVED",
      },
    });
    initiativeId = created.id;
    organizationId = orgId;
    alId = input.assignedAlId;
    initiativeName = created.name;
    currentStageIdx = APP_RECEIVED_IDX; // created directly at this stage

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "CREATE",
        entityType: "INITIATIVE",
        entityId: created.id,
        after: {
          name: created.name,
          stage: "APPLICATION_RECEIVED",
          source: "Jotform intake",
        },
      },
    });
  }

  // Upsert the Application (idempotent — a later move to APPLICATION_REVIEW only flips status).
  const app = await prisma.application.upsert({
    where: { initiativeId },
    create: {
      initiativeId,
      organizationId,
      alId,
      status: "RECEIVED",
      submittedDate: intake.submittedAt,
    },
    update: { status: "RECEIVED", submittedDate: intake.submittedAt },
  });

  // Attach the PDF as the FULL_APPLICATION document.
  if (driveFile) {
    await prisma.document.create({
      data: {
        type: "FULL_APPLICATION",
        applicationId: app.id,
        uploadedById: user.id,
        source: "DRIVE_LINK",
        fileName: driveFile.name,
        googleFileId: driveFile.id,
        googleFileUrl: driveFile.webViewLink ?? null,
        googleFileName: driveFile.name,
        googleMimeType: driveFile.mimeType ?? null,
        googleModifiedTime: driveFile.modifiedTime
          ? new Date(driveFile.modifiedTime)
          : null,
        googleOwnerName: driveFile.owners?.[0]?.displayName ?? null,
        googleFileSize: driveFile.size ?? null,
        lastSyncedAt: new Date(),
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "DOCUMENT_UPLOADED",
        entityType: "APPLICATION",
        entityId: app.id,
        after: {
          fileName: driveFile.name,
          googleFileId: driveFile.id,
          type: "FULL_APPLICATION",
        },
      },
    });
  }

  // Advance the initiative to APPLICATION_RECEIVED if it is behind (never move backward).
  if (currentStageIdx < APP_RECEIVED_IDX) {
    await prisma.initiative.update({
      where: { id: initiativeId },
      data: { stage: "APPLICATION_RECEIVED" },
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "STAGE_CHANGE",
        entityType: "INITIATIVE",
        entityId: initiativeId,
        after: { stage: "APPLICATION_RECEIVED", via: "Jotform triage" },
      },
    });
  }

  // Mirror moveInitiativeStage's APPLICATION_RECEIVED alert to the AL.
  await prisma.notification.create({
    data: {
      userId: alId,
      type: "APPLICATION_RECEIVED",
      message: `Application received for "${initiativeName}"`,
      relatedType: "INITIATIVE",
      relatedId: initiativeId,
    },
  });

  // Close out the intake.
  await prisma.applicationIntake.update({
    where: { id: intake.id },
    data: { status: "LINKED", linkedInitiativeId: initiativeId },
  });

  revalidatePath("/intake");
  revalidatePath("/initiatives");
  revalidatePath(`/initiatives/${initiativeId}`);
  return { initiativeId };
}

export async function dismissIntake(id: string): Promise<{ error?: string }> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "intake:triage");

  await prisma.applicationIntake.update({
    where: { id },
    data: { status: "DISMISSED" },
  });
  revalidatePath("/intake");
  return {};
}
