import type { Role } from "@/app/generated/prisma/enums";
import type { SessionUser } from "@/lib/auth";

// ----------------------------------------------------------------
// Actions — every operation in the system expressed as a string constant
// ----------------------------------------------------------------

export type Action =
  // Initiatives
  | "initiative:create"
  | "initiative:edit"
  | "initiative:view"
  | "initiative:move-stage"
  | "initiative:view-all" // see initiatives not assigned/supported
  // Documents
  | "document:upload"
  | "document:view-internal"
  // Decisions
  | "decision:record"
  // Comments
  | "comment:create"
  | "comment:view-internal"
  // Applications & review reports
  | "application:create"
  | "application:edit"
  | "review-report:sign-al"
  | "review-report:sign-kmd"
  | "review-report:view"
  // Memos
  | "memo:draft"
  | "memo:view-assigned" // peer reviewer: only their assigned memo
  // Peer review
  | "peer-review:nominate"
  | "peer-review:submit"
  // Legal DD
  | "legal-dd:manage" // AD only
  | "legal-dd:view"
  | "legal-dd:complete" // AD only
  // Onboarding / Grant
  | "grant:create"
  | "grant:edit"
  | "onboarding:manage"
  // Strategy
  | "strategy:create"
  | "strategy:edit"
  | "strategy:approve"
  // Criteria
  | "criteria:manage"
  // Meetings
  | "meeting:create"
  | "meeting:select-participants" // CEO only
  // Intake (Jotform triage)
  | "intake:view"
  | "intake:triage"
  // Admin
  | "users:manage"
  | "audit-log:view"
  // Technical review
  | "tech-review:submit";

// ----------------------------------------------------------------
// Resource context passed to can() for ownership-sensitive checks
// ----------------------------------------------------------------

export type Resource =
  | { type: "initiative"; assignedAlId: string; supportingAtIds: string[] }
  | { type: "memo"; assignedMemoIds: string[] } // peer reviewer: list of memo IDs they are assigned to
  | { type: "user" };

// ----------------------------------------------------------------
// can() — the single gate for every permission check
// Call this in server actions and route handlers before any mutation.
// ----------------------------------------------------------------

export function can(
  user: SessionUser,
  action: Action,
  resource?: Resource
): boolean {
  const { role, id } = user;

  switch (action) {
    // ------- Initiative -------
    case "initiative:create":
      return role === "AL" || role === "AT" || role === "ADMIN";

    case "initiative:edit":
      if (role === "ADMIN") return true;
      if (role === "AL") return ownsOrSupports(id, resource);
      if (role === "AT") return ownsOrSupports(id, resource);
      return false;

    case "initiative:view":
      // CEO, KMD, ADMIN see everything; AL/AT scoped to owned/supported
      if (["CEO", "KMD", "ADMIN", "AD"].includes(role)) return true;
      if (role === "AL" || role === "AT") return ownsOrSupports(id, resource);
      if (role === "TL") return true; // further scoped by needsTechReview in the query layer
      return false;

    case "initiative:view-all":
      return ["CEO", "KMD", "ADMIN", "AD"].includes(role);

    case "initiative:move-stage":
      // Only AL (for their own initiatives); AT cannot move stages
      return role === "AL" && ownsInitiative(id, resource);

    // ------- Documents -------
    case "document:upload":
      return ["AL", "AT", "AD", "KMD", "ADMIN"].includes(role);

    case "document:view-internal":
      return ["CEO", "AL", "AT", "KMD", "AD", "TL", "ADMIN"].includes(role);

    // ------- Decisions -------
    case "decision:record":
      return role === "CEO";

    // ------- Comments -------
    case "comment:create":
      return ["CEO", "AL", "AT", "KMD", "AD", "TL", "PEER_REVIEWER"].includes(role);

    case "comment:view-internal":
      // Peer reviewers never see internal comments
      return ["CEO", "AL", "AT", "KMD", "AD", "TL", "ADMIN"].includes(role);

    // ------- Application / Review Report -------
    case "application:create":
    case "application:edit":
      return role === "AL" || role === "KMD";

    case "review-report:sign-al":
      return role === "AL" && ownsInitiative(id, resource);

    case "review-report:sign-kmd":
      return role === "KMD";

    case "review-report:view":
      return ["AL", "KMD", "CEO", "ADMIN"].includes(role);

    // ------- Memo -------
    case "memo:draft":
      return role === "AL" && ownsInitiative(id, resource);

    case "memo:view-assigned":
      if (role === "PEER_REVIEWER") return assignedToMemo(id, resource);
      return ["CEO", "AL", "KMD", "ADMIN"].includes(role);

    // ------- Peer Review -------
    case "peer-review:nominate":
      return role === "AL" && ownsInitiative(id, resource);

    case "peer-review:submit":
      return role === "PEER_REVIEWER";

    // ------- Legal DD -------
    case "legal-dd:manage":
    case "legal-dd:complete":
      return role === "AD";

    case "legal-dd:view":
      return ["AD", "AL", "CEO", "ADMIN"].includes(role);

    // ------- Grant / Onboarding -------
    case "grant:create":
    case "grant:edit":
    case "onboarding:manage":
      return role === "AL" || role === "AT";

    // ------- Strategy -------
    case "strategy:create":
    case "strategy:edit":
      return role === "KMD" || role === "ADMIN";

    case "strategy:approve":
      return role === "CEO";

    case "criteria:manage":
      return role === "KMD" || role === "ADMIN";

    // ------- Meetings -------
    case "meeting:create":
      return ["AL", "AT", "CEO"].includes(role);

    case "meeting:select-participants":
      return role === "CEO";

    // ------- Intake (Jotform triage) -------
    case "intake:view":
    case "intake:triage":
      return ["AL", "AT", "ADMIN"].includes(role);

    // ------- Admin -------
    case "users:manage":
    case "audit-log:view":
      return role === "ADMIN";

    // ------- Technical review -------
    case "tech-review:submit":
      return role === "TL";

    default:
      return false;
  }
}

// ----------------------------------------------------------------
// Resource helpers
// ----------------------------------------------------------------

function ownsInitiative(userId: string, resource?: Resource): boolean {
  if (!resource || resource.type !== "initiative") return false;
  return resource.assignedAlId === userId;
}

function ownsOrSupports(userId: string, resource?: Resource): boolean {
  if (!resource || resource.type !== "initiative") return false;
  return (
    resource.assignedAlId === userId ||
    resource.supportingAtIds.includes(userId)
  );
}

function assignedToMemo(userId: string, resource?: Resource): boolean {
  if (!resource || resource.type !== "memo") return false;
  return resource.assignedMemoIds.includes(userId);
}

// ----------------------------------------------------------------
// Convenience: throw if not allowed (use in server actions)
// ----------------------------------------------------------------

export function assertCan(
  user: SessionUser,
  action: Action,
  resource?: Resource
): void {
  if (!can(user, action, resource)) {
    throw new Error(`Unauthorized: cannot perform "${action}"`);
  }
}
