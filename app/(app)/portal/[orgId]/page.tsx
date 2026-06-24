import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getOrganization } from "@/lib/db/organizations";
import { prisma } from "@/lib/db/client";
import { columnForStage, type PipelineColumn } from "@/lib/workflow";
import { StageBadge } from "@/components/shared/stage-badge";
import { StatusChip } from "@/components/ui/status-chip";
import { Avatar } from "@/components/ui/avatar";
import { ArrowLeftIcon, FileTextIcon } from "lucide-react";

// Grantee portal — STUB. Authenticated, internal-only preview of what an external
// organization would see: EXTERNAL-visibility documents + submission status + a
// contact. It never surfaces internal comments, memos, peer reviews, or
// assessments. Real external-user access is a separate, security-scoped task.

const NEXT_STEP: Record<PipelineColumn, string> = {
  Sourcing: "We're reviewing your initial materials — your area lead may reach out for more.",
  Screening: "Your concept is being reviewed by our team.",
  Application: "Your full application is being processed.",
  "Memo Review": "Your application is in our investment review.",
  "Legal Due Diligence": "Please share the requested legal documents when convenient.",
  Onboarding: "Let's set up your grant — your area lead will be in touch shortly.",
  "Active Grant Management": "Your grant is active. Reports will be requested per your agreement.",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  CONCEPT_NOTE: "Concept note",
  INSTITUTIONAL_DECK: "Institutional deck",
  FULL_APPLICATION: "Full application",
  LEGAL_DOCUMENT: "Legal document",
  KPI_REPORTING_AGREEMENT: "Reporting agreement",
  OTHER: "Document",
};

export default async function PortalPreviewPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const session = await auth();
  const user = session!.user as unknown as SessionUser;
  if (user.role === "PEER_REVIEWER") redirect("/dashboard");

  let org;
  try {
    org = await getOrganization(orgId);
  } catch {
    notFound();
  }

  // Only EXTERNAL documents are ever visible in the grantee portal.
  const externalDocs = await prisma.document.findMany({
    where: { organizationId: orgId, visibility: "EXTERNAL" },
    select: { id: true, fileName: true, type: true, googleFileUrl: true, uploadedAt: true },
    orderBy: { uploadedAt: "desc" },
  });

  const primary = org.initiatives[0] ?? null;
  const nextStep = primary ? NEXT_STEP[columnForStage(primary.stage)] : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/organizations/${org.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" /> Back to {org.name}
      </Link>

      <div className="rounded-xl border border-dotted border-border bg-cream-soft px-4 py-3 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Internal preview</span> — this is what{" "}
        {org.name} sees in their grantee portal. Real external access is a separate task.
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Your application
        </p>
        <h1 className="mt-1.5 font-serif text-3xl text-foreground">
          {primary?.name ?? org.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your submission and see what we need next. Your area lead is here to help.
        </p>
      </div>

      {/* Needs your attention */}
      {nextStep && (
        <section className="rounded-2xl bg-panel p-5 text-panel-foreground shadow-lg">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-yellow" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
              Where things stand
            </span>
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-white/85">{nextStep}</p>
          {primary && (
            <div className="mt-3">
              <StageBadge stage={primary.stage} />
            </div>
          )}
        </section>
      )}

      {/* Submission status — shared documents */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Shared documents
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {externalDocs.length === 0 ? (
            <div className="rounded-xl border border-dotted border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
              No documents shared with you yet. Your area lead will request anything needed here.
            </div>
          ) : (
            externalDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3.5 rounded-xl border border-dotted border-border bg-card p-4"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--purple)_16%,white)] text-purple-deep">
                  <FileTextIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{doc.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {DOC_TYPE_LABELS[doc.type] ?? "Document"} ·{" "}
                    {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <StatusChip tone="green">Shared</StatusChip>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contact */}
      {primary?.assignedAl && (
        <section className="flex items-center gap-3.5 rounded-2xl border border-dotted border-border bg-card p-5">
          <Avatar name={primary.assignedAl.name} className="size-11 text-sm" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your area lead
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {primary.assignedAl.name}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
