import { describe, it, expect } from "vitest";
import { can } from "@/lib/authz";
import type { SessionUser } from "@/lib/auth";

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function user(
  role: SessionUser["role"],
  id = "user-1",
  areaId: string | null = null
): SessionUser {
  return { id, name: "Test", email: "test@test.com", role, areaId };
}

const ownedInitiative = {
  type: "initiative" as const,
  assignedAlId: "user-1",
  supportingAtIds: [],
};

const unownedInitiative = {
  type: "initiative" as const,
  assignedAlId: "other-al",
  supportingAtIds: [],
};

const supportedInitiative = {
  type: "initiative" as const,
  assignedAlId: "other-al",
  supportingAtIds: ["user-1"],
};

// ----------------------------------------------------------------
// CEO
// ----------------------------------------------------------------

describe("CEO", () => {
  const ceo = user("CEO");

  it("can record decisions", () => {
    expect(can(ceo, "decision:record")).toBe(true);
  });

  it("can select meeting participants", () => {
    expect(can(ceo, "meeting:select-participants")).toBe(true);
  });

  it("cannot move stages", () => {
    expect(can(ceo, "initiative:move-stage", ownedInitiative)).toBe(false);
  });

  it("cannot manage users", () => {
    expect(can(ceo, "users:manage")).toBe(false);
  });

  it("can view internal comments", () => {
    expect(can(ceo, "comment:view-internal")).toBe(true);
  });
});

// ----------------------------------------------------------------
// AL — Area Lead
// ----------------------------------------------------------------

describe("AL", () => {
  const al = user("AL");

  it("can move stages on owned initiative", () => {
    expect(can(al, "initiative:move-stage", ownedInitiative)).toBe(true);
  });

  it("cannot move stages on unowned initiative", () => {
    expect(can(al, "initiative:move-stage", unownedInitiative)).toBe(false);
  });

  it("can draft memos for owned initiative", () => {
    expect(can(al, "memo:draft", ownedInitiative)).toBe(true);
  });

  it("cannot draft memos for unowned initiative", () => {
    expect(can(al, "memo:draft", unownedInitiative)).toBe(false);
  });

  it("cannot record CEO decisions", () => {
    expect(can(al, "decision:record")).toBe(false);
  });

  it("cannot manage legal DD", () => {
    expect(can(al, "legal-dd:manage")).toBe(false);
  });

  it("cannot manage users", () => {
    expect(can(al, "users:manage")).toBe(false);
  });
});

// ----------------------------------------------------------------
// AT — Area Team
// ----------------------------------------------------------------

describe("AT", () => {
  const at = user("AT");

  it("can edit supported initiative", () => {
    expect(can(at, "initiative:edit", supportedInitiative)).toBe(true);
  });

  it("cannot move stages (ever)", () => {
    expect(can(at, "initiative:move-stage", supportedInitiative)).toBe(false);
    expect(can(at, "initiative:move-stage", ownedInitiative)).toBe(false);
  });

  it("cannot record decisions", () => {
    expect(can(at, "decision:record")).toBe(false);
  });

  it("cannot manage legal DD", () => {
    expect(can(at, "legal-dd:manage")).toBe(false);
  });
});

// ----------------------------------------------------------------
// AD — Administrative Director
// ----------------------------------------------------------------

describe("AD", () => {
  const ad = user("AD");

  it("can manage legal DD", () => {
    expect(can(ad, "legal-dd:manage")).toBe(true);
  });

  it("can mark legal DD complete", () => {
    expect(can(ad, "legal-dd:complete")).toBe(true);
  });

  it("cannot approve investments (record decisions)", () => {
    expect(can(ad, "decision:record")).toBe(false);
  });

  it("cannot move stages", () => {
    expect(can(ad, "initiative:move-stage", ownedInitiative)).toBe(false);
  });
});

// ----------------------------------------------------------------
// Peer Reviewer — scoped access
// ----------------------------------------------------------------

describe("Peer Reviewer", () => {
  const reviewer = user("PEER_REVIEWER");
  const assignedMemo = { type: "memo" as const, assignedMemoIds: ["user-1"] };
  const unassignedMemo = { type: "memo" as const, assignedMemoIds: ["memo-other"] };

  it("can view assigned memo", () => {
    expect(can(reviewer, "memo:view-assigned", assignedMemo)).toBe(true);
  });

  it("cannot view unassigned memo", () => {
    expect(can(reviewer, "memo:view-assigned", unassignedMemo)).toBe(false);
  });

  it("can submit peer review", () => {
    expect(can(reviewer, "peer-review:submit")).toBe(true);
  });

  it("cannot view internal comments", () => {
    expect(can(reviewer, "comment:view-internal")).toBe(false);
  });

  it("cannot record decisions", () => {
    expect(can(reviewer, "decision:record")).toBe(false);
  });

  it("cannot move stages", () => {
    expect(can(reviewer, "initiative:move-stage", ownedInitiative)).toBe(false);
  });

  it("cannot see all initiatives", () => {
    expect(can(reviewer, "initiative:view-all")).toBe(false);
  });
});

// ----------------------------------------------------------------
// KMD
// ----------------------------------------------------------------

describe("KMD", () => {
  const kmd = user("KMD");

  it("can create strategy docs", () => {
    expect(can(kmd, "strategy:create")).toBe(true);
  });

  it("can sign off review report", () => {
    expect(can(kmd, "review-report:sign-kmd")).toBe(true);
  });

  it("cannot approve strategy docs (CEO only)", () => {
    expect(can(kmd, "strategy:approve")).toBe(false);
  });

  it("cannot manage legal DD", () => {
    expect(can(kmd, "legal-dd:manage")).toBe(false);
  });
});

// ----------------------------------------------------------------
// Admin
// ----------------------------------------------------------------

describe("Admin", () => {
  const admin = user("ADMIN");

  it("can manage users", () => {
    expect(can(admin, "users:manage")).toBe(true);
  });

  it("can view audit log", () => {
    expect(can(admin, "audit-log:view")).toBe(true);
  });

  it("cannot record decisions", () => {
    expect(can(admin, "decision:record")).toBe(false);
  });
});
