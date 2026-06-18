import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { getStrategyDoc } from "@/lib/db/strategy";
import { prisma } from "@/lib/db/client";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StrategyDocForm } from "@/components/strategy/strategy-doc-form";
import { SubmitForReviewButton } from "@/components/strategy/submit-for-review-button";
import { ApproveButton } from "@/components/strategy/approve-button";
import { RejectStrategyDocButton } from "@/components/strategy/reject-strategy-doc-button";
import { updateStrategyDoc } from "@/app/actions/strategy";
import { ChevronLeftIcon } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  PROCESS_MAP: "Process Map",
  INVESTMENT_CRITERIA: "Investment Criteria",
  TOC: "Theory of Change",
  THESIS: "Thesis",
  LEARNING_AGENDA: "Learning Agenda",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  IN_REVIEW: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StrategyDocPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  if (!["CEO", "KMD", "ADMIN"].includes(user.role)) redirect("/dashboard");

  let doc;
  try {
    doc = await getStrategyDoc(id);
  } catch {
    notFound();
  }

  const canEdit = can(user, "strategy:edit") && doc.status !== "APPROVED";
  const canSubmit = canEdit && doc.status === "DRAFT";
  const canApprove = can(user, "strategy:approve") && doc.status === "IN_REVIEW";

  const areas = canEdit
    ? await prisma.area.findMany({ orderBy: { name: "asc" } })
    : [];

  const boundUpdate = updateStrategyDoc.bind(null, id);
  const selectedAreaIds = doc.areas.map((a) => a.areaId);

  const statusColor = STATUS_COLORS[doc.status] ?? "bg-slate-100 text-slate-600";

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/strategy" />}
          className="mb-2 -ml-2"
        >
          <ChevronLeftIcon className="size-4 mr-1" />
          Back to strategy
        </Button>
        <PageHeader
          title={doc.title}
          description={TYPE_LABELS[doc.type] ?? doc.type}
          action={
            <div className="flex items-center gap-2">
              <Badge className={`${statusColor} border-0`}>
                {doc.status.replace("_", " ")}
              </Badge>
              {canSubmit && <SubmitForReviewButton docId={id} />}
              {canApprove && <RejectStrategyDocButton docId={id} />}
              {canApprove && <ApproveButton docId={id} />}
            </div>
          }
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {canEdit ? (
            <StrategyDocForm
              action={boundUpdate}
              areas={areas}
              defaultValues={{
                title: doc.title,
                type: doc.type,
                body: doc.body ?? "",
                selectedAreaIds,
              }}
            />
          ) : (
            <div className="space-y-3">
              {doc.body ? (
                <div className="rounded-md border bg-muted/30 p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                  {doc.body}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No content yet.</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Owner</span>
                <span>{doc.owner.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span>v{doc.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span>{TYPE_LABELS[doc.type] ?? doc.type}</span>
              </div>
              {doc.areas.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground mb-1">Areas</p>
                    <div className="flex flex-wrap gap-1">
                      {doc.areas.map((a) => (
                        <Badge key={a.areaId} variant="outline" className="text-xs">
                          {a.area.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {doc.status === "APPROVED" && doc.approvedBy && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approved by</span>
                    <span>{doc.approvedBy.name}</span>
                  </div>
                  {doc.approvalDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Approval date</span>
                      <span>
                        {new Date(doc.approvalDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
