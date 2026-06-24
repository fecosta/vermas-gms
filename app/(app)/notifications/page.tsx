import Link from "next/link";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { getNotifications, markNotificationsRead } from "@/lib/db/notifications";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/app/generated/prisma/enums";
import {
  BellIcon,
  GavelIcon,
  InboxIcon,
  RocketIcon,
  ScaleIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

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

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  CONCEPT_NOTE_SENT_TO_CEO: GavelIcon,
  CEO_DECISION_RECORDED: GavelIcon,
  MEMO_SENT_TO_CEO: GavelIcon,
  APPLICATION_RECEIVED: InboxIcon,
  PEER_REVIEWER_ASSIGNED: UsersIcon,
  PEER_COMMENT_SUBMITTED: UsersIcon,
  AL_RESPONSE_NEEDED: UsersIcon,
  LEGAL_DD_STARTED: ScaleIcon,
  LEGAL_DOCUMENT_UPLOADED: ScaleIcon,
  LEGAL_REVISION_REQUESTED: ScaleIcon,
  LEGAL_DD_COMPLETED: ScaleIcon,
  ONBOARDING_STARTED: RocketIcon,
};

export default async function NotificationsPage() {
  const session = await auth();
  const user = session!.user as unknown as SessionUser;

  const notifications = await getNotifications(user.id);
  await markNotificationsRead(user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Your recent notifications" />

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-dotted border-border bg-card">
          <div className="divide-y divide-dotted divide-border">
            {notifications.map((n) => {
              const href =
                n.relatedType === "INITIATIVE" && n.relatedId
                  ? `/initiatives/${n.relatedId}`
                  : n.relatedType === "INTAKE"
                  ? "/intake"
                  : null;
              const Icon = TYPE_ICON[n.type] ?? BellIcon;
              const date = new Date(n.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              const body = (
                <>
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      n.isRead
                        ? "bg-cream-soft text-faint"
                        : "bg-[color-mix(in_srgb,var(--purple)_16%,white)] text-purple-deep"
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm text-foreground",
                        !n.isRead && "font-semibold"
                      )}
                    >
                      {n.message}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {TYPE_LABELS[n.type] ?? n.type} · {date}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="size-2 shrink-0 rounded-full bg-purple" aria-label="Unread" />
                  )}
                </>
              );

              const className =
                "flex items-center gap-3.5 px-4 py-3.5 transition-colors";

              return href ? (
                <Link key={n.id} href={href} className={cn(className, "hover:bg-cream-soft")}>
                  {body}
                </Link>
              ) : (
                <div key={n.id} className={className}>
                  {body}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
