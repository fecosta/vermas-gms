import Link from "next/link";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { getIntakes, getTriageOptions } from "@/lib/db/intake";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TriageDialog } from "@/components/intake/triage-dialog";
import { DismissIntakeButton } from "@/components/intake/dismiss-intake-button";

export default async function IntakePage() {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  if (!can(user, "intake:view")) {
    return (
      <EmptyState
        title="Access restricted"
        description="You don't have permission to view application intake."
      />
    );
  }

  const [intakes, options] = await Promise.all([getIntakes(), getTriageOptions()]);
  const pending = intakes.filter((i) => i.status === "NEEDS_TRIAGE");
  const resolved = intakes.filter((i) => i.status !== "NEEDS_TRIAGE");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Application intake"
        description={`${pending.length} awaiting triage`}
      />

      {pending.length === 0 ? (
        <EmptyState
          title="Nothing to triage"
          description="New Jotform submissions will appear here automatically."
        />
      ) : (
        <div className="space-y-3">
          {pending.map((i) => (
            <Card key={i.id}>
              <CardContent className="flex items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {i.submittedByName ?? "Unknown applicant"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {i.submittedByEmail ?? "no email"} ·{" "}
                    {new Date(i.submittedAt).toLocaleDateString()}
                    {i.submissionUrl && (
                      <>
                        {" · "}
                        <a
                          href={i.submissionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          Jotform ↗
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <DismissIntakeButton id={i.id} />
                  <TriageDialog
                    intake={{
                      id: i.id,
                      submittedByName: i.submittedByName,
                      submittedByEmail: i.submittedByEmail,
                      submittedAt: i.submittedAt,
                      submissionUrl: i.submissionUrl,
                    }}
                    options={options}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Resolved</h2>
          <div className="divide-y rounded-lg border">
            {resolved.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between px-4 py-2 text-sm"
              >
                <span>
                  {i.submittedByName ?? "Unknown"}
                  <span className="ml-1 text-xs text-muted-foreground">
                    · {new Date(i.submittedAt).toLocaleDateString()}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {i.status === "LINKED" ? "Linked" : "Dismissed"}
                  </Badge>
                  {i.linkedInitiativeId && (
                    <Link
                      href={`/initiatives/${i.linkedInitiativeId}`}
                      className="text-xs text-primary hover:underline"
                    >
                      View initiative
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
