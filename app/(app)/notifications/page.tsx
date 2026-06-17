import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { getNotifications } from "@/lib/db/notifications";
import { markNotificationsRead } from "@/lib/db/notifications";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { NotificationType } from "@/app/generated/prisma/enums";

const TYPE_LABELS: Record<NotificationType, string> = {
  CONCEPT_NOTE_SENT_TO_CEO: "Concept note sent to CEO",
  CEO_DECISION_RECORDED: "CEO decision recorded",
  APPLICATION_RECEIVED: "Application received",
  PEER_REVIEWER_ASSIGNED: "Peer reviewer assigned",
  PEER_COMMENT_SUBMITTED: "Peer comment submitted",
  AL_RESPONSE_NEEDED: "AL response needed",
  MEMO_SENT_TO_CEO: "Memo sent to CEO",
  LEGAL_DD_STARTED: "Legal DD started",
  LEGAL_DOCUMENT_UPLOADED: "Legal document uploaded",
  LEGAL_REVISION_REQUESTED: "Legal revision requested",
  LEGAL_DD_COMPLETED: "Legal DD completed",
  ONBOARDING_STARTED: "Onboarding started",
};

export default async function NotificationsPage() {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const notifications = await getNotifications(user.id);
  await markNotificationsRead(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Your recent notifications"
      />

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You're all caught up."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Message</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.map((n) => (
              <TableRow key={n.id} className={n.isRead ? "" : "font-medium"}>
                <TableCell className="text-sm">{n.message}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {TYPE_LABELS[n.type] ?? n.type}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(n.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
