-- CreateEnum
CREATE TYPE "DocumentSource" AS ENUM ('UPLOAD', 'DRIVE_LINK');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "googleFileId" TEXT,
ADD COLUMN     "googleFileName" TEXT,
ADD COLUMN     "googleFileSize" TEXT,
ADD COLUMN     "googleFileUrl" TEXT,
ADD COLUMN     "googleMimeType" TEXT,
ADD COLUMN     "googleModifiedTime" TIMESTAMP(3),
ADD COLUMN     "googleOwnerName" TEXT,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "source" "DocumentSource" NOT NULL DEFAULT 'DRIVE_LINK',
ALTER COLUMN "storageKey" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Initiative" ADD COLUMN     "driveFolderLinkedAt" TIMESTAMP(3),
ADD COLUMN     "driveFolderLinkedById" TEXT,
ADD COLUMN     "googleDriveFolderId" TEXT,
ADD COLUMN     "googleDriveFolderName" TEXT,
ADD COLUMN     "googleDriveFolderUrl" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "driveFolderLinkedAt" TIMESTAMP(3),
ADD COLUMN     "driveFolderLinkedById" TEXT,
ADD COLUMN     "googleDriveFolderId" TEXT,
ADD COLUMN     "googleDriveFolderName" TEXT,
ADD COLUMN     "googleDriveFolderUrl" TEXT;
