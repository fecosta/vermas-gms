-- CreateEnum
CREATE TYPE "IntakeStatus" AS ENUM ('NEEDS_TRIAGE', 'LINKED', 'DISMISSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ApplicationStatus" ADD VALUE 'LINK_SENT';
ALTER TYPE "ApplicationStatus" ADD VALUE 'REVISION_REQUESTED';

-- CreateTable
CREATE TABLE "ApplicationIntake" (
    "id" TEXT NOT NULL,
    "jotformFormId" TEXT,
    "jotformSubmissionId" TEXT NOT NULL,
    "submissionUrl" TEXT,
    "pdfUrl" TEXT,
    "submittedByName" TEXT,
    "submittedByEmail" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawJson" JSONB,
    "status" "IntakeStatus" NOT NULL DEFAULT 'NEEDS_TRIAGE',
    "linkedInitiativeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationIntake_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationIntake_jotformSubmissionId_key" ON "ApplicationIntake"("jotformSubmissionId");

-- CreateIndex
CREATE INDEX "ApplicationIntake_status_idx" ON "ApplicationIntake"("status");
