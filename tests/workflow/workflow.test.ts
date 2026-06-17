import { describe, it, expect } from "vitest";
import { canTransition } from "@/lib/workflow";
import type { TransitionContext } from "@/lib/workflow";
import type { SessionUser } from "@/lib/auth";

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function makeAl(id = "al-1"): SessionUser {
  return { id, name: "AL", email: "al@test.com", role: "AL", areaId: null };
}
function makeAt(): SessionUser {
  return { id: "at-1", name: "AT", email: "at@test.com", role: "AT", areaId: null };
}
function makeCeo(): SessionUser {
  return { id: "ceo-1", name: "CEO", email: "ceo@test.com", role: "CEO", areaId: null };
}
function makeAd(): SessionUser {
  return { id: "ad-1", name: "AD", email: "ad@test.com", role: "AD", areaId: null };
}
function makeKmd(): SessionUser {
  return { id: "kmd-1", name: "KMD", email: "kmd@test.com", role: "KMD", areaId: null };
}

function ctx(
  stage: TransitionContext["initiative"]["stage"],
  actor: SessionUser,
  overrides: Partial<TransitionContext> = {}
): TransitionContext {
  return {
    initiative: { id: "init-1", stage, assignedAlId: "al-1" },
    actor,
    ...overrides,
  };
}

// ----------------------------------------------------------------
// AT cannot move any stage
// ----------------------------------------------------------------

describe("AT stage transition block", () => {
  it("blocks AT from moving SOURCED→SCOPING", () => {
    const result = canTransition(ctx("SOURCED", makeAt()), "SCOPING");
    expect(result.allowed).toBe(false);
    expect("reason" in result && result.reason).toMatch(/Area Team/i);
  });
});

// ----------------------------------------------------------------
// Early pipeline (AL-owned)
// ----------------------------------------------------------------

describe("Early pipeline transitions", () => {
  it("allows AL to move SOURCED→SCOPING", () => {
    expect(canTransition(ctx("SOURCED", makeAl()), "SCOPING").allowed).toBe(true);
  });

  it("blocks non-AL from moving SOURCED→SCOPING", () => {
    expect(canTransition(ctx("SOURCED", makeCeo()), "SCOPING").allowed).toBe(false);
  });

  it("allows AL to move SCOPING→SCREENING_MATERIALS_REQUESTED", () => {
    expect(
      canTransition(ctx("SCOPING", makeAl()), "SCREENING_MATERIALS_REQUESTED").allowed
    ).toBe(true);
  });

  it("allows AL to move SCREENING_MATERIALS_REQUESTED→CONCEPT_REVIEW", () => {
    expect(
      canTransition(
        ctx("SCREENING_MATERIALS_REQUESTED", makeAl()),
        "CONCEPT_REVIEW"
      ).allowed
    ).toBe(true);
  });
});

// ----------------------------------------------------------------
// CEO decision gates
// ----------------------------------------------------------------

describe("CEO concept decision gate", () => {
  it("allows CEO to move CONCEPT_REVIEW→CONCEPT_DECISION", () => {
    expect(
      canTransition(ctx("CONCEPT_REVIEW", makeCeo()), "CONCEPT_DECISION").allowed
    ).toBe(true);
  });

  it("blocks AL from moving CONCEPT_REVIEW→CONCEPT_DECISION", () => {
    expect(
      canTransition(ctx("CONCEPT_REVIEW", makeAl()), "CONCEPT_DECISION").allowed
    ).toBe(false);
  });

  it("allows AL to move forward after approved concept decision", () => {
    const result = canTransition(
      ctx("CONCEPT_DECISION", makeAl(), { lastConceptDecision: "APPROVED" }),
      "APPLICATION_REQUESTED"
    );
    expect(result.allowed).toBe(true);
  });

  it("blocks AL from moving forward after rejected concept decision", () => {
    const result = canTransition(
      ctx("CONCEPT_DECISION", makeAl(), { lastConceptDecision: "REJECTED" }),
      "APPLICATION_REQUESTED"
    );
    expect(result.allowed).toBe(false);
  });

  it("allows conditional approval to move forward", () => {
    const result = canTransition(
      ctx("CONCEPT_DECISION", makeAl(), {
        lastConceptDecision: "CONDITIONALLY_APPROVED",
      }),
      "APPLICATION_REQUESTED"
    );
    expect(result.allowed).toBe(true);
  });
});

// ----------------------------------------------------------------
// KMD sign-off gate before memo drafting
// ----------------------------------------------------------------

describe("KMD review report sign-off gate", () => {
  it("blocks AL from moving APPLICATION_REVIEW→MEMO_DRAFTING without KMD sign-off", () => {
    const result = canTransition(
      ctx("APPLICATION_REVIEW", makeAl(), { reviewReportStatus: "IN_PROGRESS" }),
      "MEMO_DRAFTING"
    );
    expect(result.allowed).toBe(false);
    expect("reason" in result && result.reason).toMatch(/KMD/i);
  });

  it("allows AL to move APPLICATION_REVIEW→MEMO_DRAFTING after KMD_SIGNED", () => {
    const result = canTransition(
      ctx("APPLICATION_REVIEW", makeAl(), { reviewReportStatus: "KMD_SIGNED" }),
      "MEMO_DRAFTING"
    );
    expect(result.allowed).toBe(true);
  });

  it("allows move after COMPLETE", () => {
    const result = canTransition(
      ctx("APPLICATION_REVIEW", makeAl(), { reviewReportStatus: "COMPLETE" }),
      "MEMO_DRAFTING"
    );
    expect(result.allowed).toBe(true);
  });
});

// ----------------------------------------------------------------
// Peer review nomination gate
// ----------------------------------------------------------------

describe("Peer reviewer nomination gate", () => {
  it("blocks MEMO_DRAFTING→PEER_REVIEW without nominees", () => {
    const result = canTransition(
      ctx("MEMO_DRAFTING", makeAl(), { peerReviewerNominated: false }),
      "PEER_REVIEW"
    );
    expect(result.allowed).toBe(false);
  });

  it("allows MEMO_DRAFTING→PEER_REVIEW with nominees", () => {
    const result = canTransition(
      ctx("MEMO_DRAFTING", makeAl(), { peerReviewerNominated: true }),
      "PEER_REVIEW"
    );
    expect(result.allowed).toBe(true);
  });
});

// ----------------------------------------------------------------
// AD blocks onboarding if legal DD not complete
// ----------------------------------------------------------------

describe("AD legal DD gate before onboarding", () => {
  it("blocks LEGAL_DD_COMPLETE→ONBOARDING if case not COMPLETE", () => {
    const result = canTransition(
      ctx("LEGAL_DD_COMPLETE", makeAl(), { legalDdCaseStatus: "VALIDATED" }),
      "ONBOARDING"
    );
    expect(result.allowed).toBe(false);
  });

  it("allows LEGAL_DD_COMPLETE→ONBOARDING after case COMPLETE", () => {
    const result = canTransition(
      ctx("LEGAL_DD_COMPLETE", makeAl(), { legalDdCaseStatus: "COMPLETE" }),
      "ONBOARDING"
    );
    expect(result.allowed).toBe(true);
  });

  it("blocks non-AD from marking LEGAL_DUE_DILIGENCE→LEGAL_DD_COMPLETE", () => {
    expect(
      canTransition(
        ctx("LEGAL_DUE_DILIGENCE", makeAl(), { legalDdCaseStatus: "VALIDATED" }),
        "LEGAL_DD_COMPLETE"
      ).allowed
    ).toBe(false);
  });

  it("allows AD to mark LEGAL_DUE_DILIGENCE→LEGAL_DD_COMPLETE when validated", () => {
    const adCtx = ctx("LEGAL_DUE_DILIGENCE", makeAd(), {
      legalDdCaseStatus: "VALIDATED",
    });
    expect(canTransition(adCtx, "LEGAL_DD_COMPLETE").allowed).toBe(true);
  });
});

// ----------------------------------------------------------------
// Invalid transitions
// ----------------------------------------------------------------

describe("Invalid transitions", () => {
  it("blocks undefined transitions", () => {
    const result = canTransition(ctx("SOURCED", makeAl()), "LEGAL_DUE_DILIGENCE");
    expect(result.allowed).toBe(false);
  });

  it("allows KMD to start application review", () => {
    expect(
      canTransition(ctx("APPLICATION_RECEIVED", makeKmd()), "APPLICATION_REVIEW").allowed
    ).toBe(true);
  });
});
