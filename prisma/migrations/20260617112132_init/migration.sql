-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CEO', 'KMD', 'AL', 'AT', 'AD', 'TL', 'PEER_REVIEWER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('SOURCED', 'SCOPING', 'SCREENING_MATERIALS_REQUESTED', 'CONCEPT_REVIEW', 'CONCEPT_DECISION', 'APPLICATION_REQUESTED', 'APPLICATION_RECEIVED', 'APPLICATION_REVIEW', 'MEMO_DRAFTING', 'PEER_REVIEW', 'CEO_COMMITTEE_REVIEW', 'MEMO_DECISION', 'LEGAL_DUE_DILIGENCE', 'LEGAL_DD_COMPLETE', 'ONBOARDING', 'ACTIVE');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('NGO', 'COMPANY', 'INDIVIDUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ScopingCallStatus" AS ENUM ('NOT_SCHEDULED', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DecisionOutcome" AS ENUM ('APPROVED', 'REJECTED', 'REVISION_REQUESTED', 'CONDITIONALLY_APPROVED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "DecisionType" AS ENUM ('CONCEPT', 'MEMO', 'STRATEGY');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('REQUESTED', 'RECEIVED', 'IN_REVIEW', 'COMPLETE', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReviewReportStatus" AS ENUM ('IN_PROGRESS', 'AL_SIGNED', 'KMD_SIGNED', 'COMPLETE');

-- CreateEnum
CREATE TYPE "MemoStatus" AS ENUM ('DRAFT', 'IN_PEER_REVIEW', 'IN_CEO_REVIEW', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED');

-- CreateEnum
CREATE TYPE "PeerReviewStatus" AS ENUM ('NOT_ASSIGNED', 'ASSIGNED', 'IN_REVIEW', 'QUESTIONS_SENT', 'AL_RESPONSE_PENDING', 'COMPLETE');

-- CreateEnum
CREATE TYPE "LegalDDCaseStatus" AS ENUM ('NOT_STARTED', 'REQUESTED', 'DOCUMENTS_PENDING', 'SUBMITTED', 'UNDER_AD_REVIEW', 'REVISIONS_REQUESTED', 'RESUBMITTED', 'TRUST_VALIDATION', 'VALIDATED', 'REJECTED', 'COMPLETE');

-- CreateEnum
CREATE TYPE "TrustValidationStatus" AS ENUM ('NOT_SENT', 'SENT', 'VALIDATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ChecklistItemStatus" AS ENUM ('PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'REVISION_REQUESTED');

-- CreateEnum
CREATE TYPE "GrantStatus" AS ENUM ('ACTIVE', 'CLOSED', 'PAUSED');

-- CreateEnum
CREATE TYPE "GrantOnboardingStatus" AS ENUM ('NOT_STARTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SupportType" AS ENUM ('MEL', 'TECH', 'STRATEGIC');

-- CreateEnum
CREATE TYPE "StrategyDocType" AS ENUM ('PROCESS_MAP', 'INVESTMENT_CRITERIA', 'TOC', 'THESIS', 'LEARNING_AGENDA');

-- CreateEnum
CREATE TYPE "StrategyDocStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('STRATEGY', 'CONCEPT_NOTE', 'INSTITUTIONAL_DECK', 'FULL_APPLICATION', 'APPLICATION_REVIEW_REPORT', 'INVESTMENT_MEMO', 'PEER_REVIEW_COMMENTS', 'CEO_NOTES', 'LEGAL_DOCUMENT', 'TRUST_VALIDATION', 'KICKOFF_MINUTES', 'KPI_REPORTING_AGREEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "CommentRelatedType" AS ENUM ('INITIATIVE', 'CONCEPT_NOTE', 'APPLICATION', 'MEMO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('CONCEPT_REVIEW', 'MEMO_REVIEW', 'KICKOFF');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CONCEPT_NOTE_SENT_TO_CEO', 'CEO_DECISION_RECORDED', 'APPLICATION_RECEIVED', 'PEER_REVIEWER_ASSIGNED', 'PEER_COMMENT_SUBMITTED', 'AL_RESPONSE_NEEDED', 'MEMO_SENT_TO_CEO', 'LEGAL_DD_STARTED', 'LEGAL_DOCUMENT_UPLOADED', 'LEGAL_REVISION_REQUESTED', 'LEGAL_DD_COMPLETED', 'ONBOARDING_STARTED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'STAGE_CHANGE', 'DECISION_RECORDED', 'LEGAL_STATUS_CHANGE', 'DOCUMENT_UPLOADED', 'USER_INVITED', 'USER_DEACTIVATED');

-- CreateEnum
CREATE TYPE "InitiativeLegalDDStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE', 'REJECTED');

-- CreateEnum
CREATE TYPE "InitiativeOnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "areaId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "country" TEXT NOT NULL,
    "website" TEXT,
    "type" "OrgType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "title" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InitiativeContact" (
    "initiativeId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,

    CONSTRAINT "InitiativeContact_pkey" PRIMARY KEY ("initiativeId","contactId")
);

-- CreateTable
CREATE TABLE "InitiativeSupport" (
    "initiativeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "InitiativeSupport_pkey" PRIMARY KEY ("initiativeId","userId")
);

-- CreateTable
CREATE TABLE "Initiative" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT,
    "individualName" TEXT,
    "primaryContactId" TEXT,
    "areaId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "source" TEXT,
    "stage" "Stage" NOT NULL DEFAULT 'SOURCED',
    "assignedAlId" TEXT NOT NULL,
    "fitScore" DOUBLE PRECISION,
    "thematicAlignment" TEXT,
    "scopingCallStatus" "ScopingCallStatus",
    "scopingCallNotes" TEXT,
    "scopingCallDate" TIMESTAMP(3),
    "strategicFitNotes" TEXT,
    "solutionStrengthNotes" TEXT,
    "executionCapacityNotes" TEXT,
    "criteriaSetId" TEXT,
    "needsTechReview" BOOLEAN NOT NULL DEFAULT false,
    "ceoDecisionStatus" "DecisionOutcome",
    "legalDdStatus" "InitiativeLegalDDStatus",
    "onboardingStatus" "InitiativeOnboardingStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Initiative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'REQUESTED',
    "criteriaSetId" TEXT,
    "whyYes" TEXT,
    "whyNot" TEXT,
    "submittedDate" TIMESTAMP(3),
    "alId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationReviewReport" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "ReviewReportStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "alSignOffAt" TIMESTAMP(3),
    "kmdSignOffAt" TIMESTAMP(3),
    "kmdReviewerId" TEXT,
    "protocolNotes" TEXT,
    "reviewComments" TEXT,
    "completedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationReviewReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentMemo" (
    "id" TEXT NOT NULL,
    "reviewReportId" TEXT NOT NULL,
    "authorAlId" TEXT NOT NULL,
    "reviewStatus" "MemoStatus" NOT NULL DEFAULT 'DRAFT',
    "ceoQuestions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentMemo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeerReview" (
    "id" TEXT NOT NULL,
    "memoId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" "PeerReviewStatus" NOT NULL DEFAULT 'NOT_ASSIGNED',
    "assignedDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeerReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "type" "DecisionType" NOT NULL,
    "decision" "DecisionOutcome" NOT NULL,
    "rationale" TEXT,
    "conditions" TEXT,
    "decidedById" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL,
    "relatedDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "relatedType" "CommentRelatedType" NOT NULL,
    "relatedId" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "type" "MeetingType" NOT NULL,
    "title" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "externalParticipants" TEXT,
    "agenda" TEXT,
    "minutes" TEXT,
    "decisions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("meetingId","userId")
);

-- CreateTable
CREATE TABLE "LegalDueDiligenceCase" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "LegalDDCaseStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "adId" TEXT NOT NULL,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "trustValidationStatus" "TrustValidationStatus",
    "complianceNotes" TEXT,
    "completedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDueDiligenceCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalChecklistItem" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "requiredDocName" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "documentId" TEXT,
    "status" "ChecklistItemStatus" NOT NULL DEFAULT 'PENDING',
    "revisionNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisionRequest" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "checklistItemId" TEXT,
    "notes" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "RevisionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grant" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "GrantStatus" NOT NULL DEFAULT 'ACTIVE',
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "supportType" "SupportType"[],
    "reportingCadence" TEXT,
    "nextReportDue" TIMESTAMP(3),
    "areaLeadId" TEXT NOT NULL,
    "onboardingStatus" "GrantOnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "kickoffMeetingId" TEXT,
    "scope" TEXT,
    "reportingConditions" TEXT,
    "onboardingMinutes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KPI" (
    "id" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target" TEXT,
    "cadence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KPI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "StrategyDocType" NOT NULL,
    "status" "StrategyDocStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "ownerId" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvalDate" TIMESTAMP(3),
    "fileUrl" TEXT,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyDocumentArea" (
    "strategyDocumentId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "StrategyDocumentArea_pkey" PRIMARY KEY ("strategyDocumentId","areaId")
);

-- CreateTable
CREATE TABLE "CriteriaSet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriteriaSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriteriaItem" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "guidance" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriteriaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT,
    "organizationId" TEXT,
    "applicationId" TEXT,
    "type" "DocumentType" NOT NULL,
    "stage" "Stage",
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT,
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'INTERNAL',
    "notes" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Initiative_stage_idx" ON "Initiative"("stage");

-- CreateIndex
CREATE INDEX "Initiative_assignedAlId_idx" ON "Initiative"("assignedAlId");

-- CreateIndex
CREATE INDEX "Initiative_areaId_idx" ON "Initiative"("areaId");

-- CreateIndex
CREATE INDEX "Initiative_country_idx" ON "Initiative"("country");

-- CreateIndex
CREATE UNIQUE INDEX "Application_initiativeId_key" ON "Application"("initiativeId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationReviewReport_applicationId_key" ON "ApplicationReviewReport"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentMemo_reviewReportId_key" ON "InvestmentMemo"("reviewReportId");

-- CreateIndex
CREATE INDEX "PeerReview_memoId_idx" ON "PeerReview"("memoId");

-- CreateIndex
CREATE INDEX "Decision_initiativeId_idx" ON "Decision"("initiativeId");

-- CreateIndex
CREATE INDEX "Comment_relatedType_relatedId_idx" ON "Comment"("relatedType", "relatedId");

-- CreateIndex
CREATE INDEX "Meeting_initiativeId_idx" ON "Meeting"("initiativeId");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDueDiligenceCase_initiativeId_key" ON "LegalDueDiligenceCase"("initiativeId");

-- CreateIndex
CREATE INDEX "LegalChecklistItem_caseId_idx" ON "LegalChecklistItem"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "Grant_initiativeId_key" ON "Grant"("initiativeId");

-- CreateIndex
CREATE UNIQUE INDEX "Grant_kickoffMeetingId_key" ON "Grant"("kickoffMeetingId");

-- CreateIndex
CREATE INDEX "Document_initiativeId_idx" ON "Document"("initiativeId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeContact" ADD CONSTRAINT "InitiativeContact_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeContact" ADD CONSTRAINT "InitiativeContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeSupport" ADD CONSTRAINT "InitiativeSupport_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeSupport" ADD CONSTRAINT "InitiativeSupport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_assignedAlId_fkey" FOREIGN KEY ("assignedAlId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_criteriaSetId_fkey" FOREIGN KEY ("criteriaSetId") REFERENCES "CriteriaSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_criteriaSetId_fkey" FOREIGN KEY ("criteriaSetId") REFERENCES "CriteriaSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_alId_fkey" FOREIGN KEY ("alId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationReviewReport" ADD CONSTRAINT "ApplicationReviewReport_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationReviewReport" ADD CONSTRAINT "ApplicationReviewReport_kmdReviewerId_fkey" FOREIGN KEY ("kmdReviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentMemo" ADD CONSTRAINT "InvestmentMemo_reviewReportId_fkey" FOREIGN KEY ("reviewReportId") REFERENCES "ApplicationReviewReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentMemo" ADD CONSTRAINT "InvestmentMemo_authorAlId_fkey" FOREIGN KEY ("authorAlId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerReview" ADD CONSTRAINT "PeerReview_memoId_fkey" FOREIGN KEY ("memoId") REFERENCES "InvestmentMemo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerReview" ADD CONSTRAINT "PeerReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_relatedDocumentId_fkey" FOREIGN KEY ("relatedDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalDueDiligenceCase" ADD CONSTRAINT "LegalDueDiligenceCase_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalDueDiligenceCase" ADD CONSTRAINT "LegalDueDiligenceCase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalDueDiligenceCase" ADD CONSTRAINT "LegalDueDiligenceCase_adId_fkey" FOREIGN KEY ("adId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalChecklistItem" ADD CONSTRAINT "LegalChecklistItem_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "LegalDueDiligenceCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalChecklistItem" ADD CONSTRAINT "LegalChecklistItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalChecklistItem" ADD CONSTRAINT "LegalChecklistItem_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionRequest" ADD CONSTRAINT "RevisionRequest_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "LegalDueDiligenceCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionRequest" ADD CONSTRAINT "RevisionRequest_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "LegalChecklistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionRequest" ADD CONSTRAINT "RevisionRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_areaLeadId_fkey" FOREIGN KEY ("areaLeadId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_kickoffMeetingId_fkey" FOREIGN KEY ("kickoffMeetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KPI" ADD CONSTRAINT "KPI_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyDocument" ADD CONSTRAINT "StrategyDocument_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyDocument" ADD CONSTRAINT "StrategyDocument_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyDocumentArea" ADD CONSTRAINT "StrategyDocumentArea_strategyDocumentId_fkey" FOREIGN KEY ("strategyDocumentId") REFERENCES "StrategyDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyDocumentArea" ADD CONSTRAINT "StrategyDocumentArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriteriaItem" ADD CONSTRAINT "CriteriaItem_setId_fkey" FOREIGN KEY ("setId") REFERENCES "CriteriaSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
