import type { Prisma } from "@/app/generated/prisma/client";

// Cached Drive metadata shown in the linked-document list (see components/documents/document-list.tsx).
export const linkedDocumentSelect = {
  id: true,
  type: true,
  fileName: true,
  googleFileUrl: true,
  googleMimeType: true,
  googleModifiedTime: true,
  googleOwnerName: true,
  googleFileSize: true,
} satisfies Prisma.DocumentSelect;
