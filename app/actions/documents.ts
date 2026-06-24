"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { assertCan } from "@/lib/authz";
import { getGoogleAccessToken } from "@/lib/google/auth";
import { getFile, type DriveFile } from "@/lib/google/drive";
import type { DocumentType } from "@/app/generated/prisma/enums";

type Result = { error?: string };

// Fetch authoritative metadata for a Drive file using the caller's server-held token.
async function fetchDriveFile(
  googleFileId: string
): Promise<{ file: DriveFile } | { error: string }> {
  const token = await getGoogleAccessToken();
  if (!token) return { error: "Your Google session expired — please sign in again." };
  try {
    return { file: await getFile(token, googleFileId) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not read that Drive file." };
  }
}

// Cached Document fields derived from Drive metadata (source = DRIVE_LINK).
function driveDocFields(file: DriveFile) {
  return {
    source: "DRIVE_LINK" as const,
    fileName: file.name,
    googleFileId: file.id,
    googleFileUrl: file.webViewLink ?? null,
    googleFileName: file.name,
    googleMimeType: file.mimeType ?? null,
    googleModifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : null,
    googleOwnerName: file.owners?.[0]?.displayName ?? null,
    googleFileSize: file.size ?? null,
    lastSyncedAt: new Date(),
  };
}

// ----------------------------------------------------------------
// Link a Drive file to an Organization / Initiative / Application
// ----------------------------------------------------------------
export async function linkDriveDocument(input: {
  googleFileId: string;
  type: DocumentType;
  organizationId?: string;
  initiativeId?: string;
  applicationId?: string;
  notes?: string;
}): Promise<Result> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "document:upload");

  if (!input.organizationId && !input.initiativeId && !input.applicationId) {
    return { error: "A document must be linked to a record." };
  }

  const meta = await fetchDriveFile(input.googleFileId);
  if ("error" in meta) return { error: meta.error };

  const doc = await prisma.document.create({
    data: {
      type: input.type,
      organizationId: input.organizationId ?? null,
      initiativeId: input.initiativeId ?? null,
      applicationId: input.applicationId ?? null,
      uploadedById: user.id,
      notes: input.notes ?? null,
      ...driveDocFields(meta.file),
    },
  });

  const entityType = input.applicationId
    ? "APPLICATION"
    : input.initiativeId
      ? "INITIATIVE"
      : "ORGANIZATION";
  const entityId =
    input.applicationId ?? input.initiativeId ?? input.organizationId!;

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "DOCUMENT_UPLOADED",
      entityType,
      entityId,
      after: { fileName: doc.fileName, googleFileId: doc.googleFileId, type: doc.type },
    },
  });

  await revalidateForTargets(input);
  return {};
}

// ----------------------------------------------------------------
// Link a Drive file to a Legal DD checklist item (AD-managed)
// ----------------------------------------------------------------
export async function linkChecklistItemDocument(input: {
  itemId: string;
  googleFileId: string;
}): Promise<Result> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "legal-dd:manage");

  const item = await prisma.legalChecklistItem.findUniqueOrThrow({
    where: { id: input.itemId },
    select: {
      caseId: true,
      case: {
        select: {
          initiativeId: true,
          organizationId: true,
          initiative: { select: { name: true, assignedAlId: true } },
        },
      },
    },
  });

  const meta = await fetchDriveFile(input.googleFileId);
  if ("error" in meta) return { error: meta.error };

  const doc = await prisma.document.create({
    data: {
      type: "LEGAL_DOCUMENT",
      initiativeId: item.case.initiativeId,
      organizationId: item.case.organizationId,
      uploadedById: user.id,
      ...driveDocFields(meta.file),
    },
  });

  await prisma.legalChecklistItem.update({
    where: { id: input.itemId },
    data: { documentId: doc.id, status: "SUBMITTED" },
  });

  // Mirror the existing checklist "document uploaded" alert to the AL.
  if (item.case.initiative.assignedAlId) {
    await prisma.notification.create({
      data: {
        userId: item.case.initiative.assignedAlId,
        type: "LEGAL_DOCUMENT_UPLOADED",
        message: `A legal document was linked for "${item.case.initiative.name}"`,
        relatedType: "INITIATIVE",
        relatedId: item.case.initiativeId,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "DOCUMENT_UPLOADED",
      entityType: "INITIATIVE",
      entityId: item.case.initiativeId,
      after: { fileName: doc.fileName, googleFileId: doc.googleFileId, checklistItemId: input.itemId },
    },
  });

  revalidatePath(`/legal/${item.caseId}`);
  revalidatePath(`/initiatives/${item.case.initiativeId}`);
  return {};
}

// ----------------------------------------------------------------
// Link / unlink a Drive folder on an Organization or Initiative
// ----------------------------------------------------------------
export async function linkDriveFolder(input: {
  kind: "organization" | "initiative";
  id: string;
  folderId: string;
}): Promise<Result> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "document:upload");

  const meta = await fetchDriveFile(input.folderId);
  if ("error" in meta) return { error: meta.error };

  const data = {
    googleDriveFolderId: meta.file.id,
    googleDriveFolderUrl: meta.file.webViewLink ?? null,
    googleDriveFolderName: meta.file.name,
    driveFolderLinkedAt: new Date(),
    driveFolderLinkedById: user.id,
  };

  if (input.kind === "organization") {
    await prisma.organization.update({ where: { id: input.id }, data });
    revalidatePath(`/organizations/${input.id}`);
  } else {
    await prisma.initiative.update({ where: { id: input.id }, data });
    revalidatePath(`/initiatives/${input.id}`);
  }
  return {};
}

export async function unlinkDriveFolder(
  kind: "organization" | "initiative",
  id: string
): Promise<Result> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "document:upload");

  const data = {
    googleDriveFolderId: null,
    googleDriveFolderUrl: null,
    googleDriveFolderName: null,
    driveFolderLinkedAt: null,
    driveFolderLinkedById: null,
  };

  if (kind === "organization") {
    await prisma.organization.update({ where: { id }, data });
    revalidatePath(`/organizations/${id}`);
  } else {
    await prisma.initiative.update({ where: { id }, data });
    revalidatePath(`/initiatives/${id}`);
  }
  return {};
}

// ----------------------------------------------------------------
// Remove a linked Document (clears any references first)
// ----------------------------------------------------------------
export async function unlinkDocument(id: string): Promise<Result> {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  assertCan(user, "document:upload");

  const doc = await prisma.document.findUniqueOrThrow({
    where: { id },
    select: { organizationId: true, initiativeId: true, applicationId: true },
  });

  // Detach optional references so the delete doesn't violate FKs.
  await prisma.legalChecklistItem.updateMany({
    where: { documentId: id },
    data: { documentId: null },
  });
  await prisma.decision.updateMany({
    where: { relatedDocumentId: id },
    data: { relatedDocumentId: null },
  });
  await prisma.document.delete({ where: { id } });

  await revalidateForTargets(doc);
  return {};
}

// Revalidate every page where a document for these targets is shown.
// Application docs store only applicationId, so resolve the initiative for its sub-pages.
async function revalidateForTargets(input: {
  organizationId?: string | null;
  initiativeId?: string | null;
  applicationId?: string | null;
}) {
  if (input.organizationId) revalidatePath(`/organizations/${input.organizationId}`);

  let initiativeId = input.initiativeId ?? null;
  if (!initiativeId && input.applicationId) {
    const app = await prisma.application.findUnique({
      where: { id: input.applicationId },
      select: { initiativeId: true },
    });
    initiativeId = app?.initiativeId ?? null;
  }
  if (initiativeId) {
    revalidatePath(`/initiatives/${initiativeId}`);
    revalidatePath(`/initiatives/${initiativeId}/application-review`);
    revalidatePath(`/initiatives/${initiativeId}/memo`);
  }
}
