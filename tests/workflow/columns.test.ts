import { describe, it, expect } from "vitest";
import {
  STAGE_ORDER,
  COLUMN_ORDER,
  STAGES_BY_COLUMN,
  columnForStage,
} from "@/lib/workflow";

describe("columnForStage / board grouping", () => {
  it("maps every one of the 16 stages to exactly one of the 7 columns", () => {
    expect(STAGE_ORDER).toHaveLength(16);
    for (const stage of STAGE_ORDER) {
      expect(COLUMN_ORDER).toContain(columnForStage(stage));
    }
  });

  it("has exactly 7 columns that together cover all 16 stages once", () => {
    expect(COLUMN_ORDER).toHaveLength(7);
    const grouped = COLUMN_ORDER.flatMap((c) => STAGES_BY_COLUMN[c]);
    expect(grouped).toHaveLength(STAGE_ORDER.length);
    // every stage appears exactly once across columns
    expect(new Set(grouped).size).toBe(STAGE_ORDER.length);
  });

  it("places representative stages in the expected column", () => {
    expect(columnForStage("SOURCED")).toBe("Sourcing");
    expect(columnForStage("SCOPING")).toBe("Sourcing");
    expect(columnForStage("CONCEPT_DECISION")).toBe("Screening");
    expect(columnForStage("APPLICATION_REVIEW")).toBe("Application");
    expect(columnForStage("MEMO_DECISION")).toBe("Memo Review");
    expect(columnForStage("LEGAL_DD_COMPLETE")).toBe("Legal Due Diligence");
    expect(columnForStage("ONBOARDING")).toBe("Onboarding");
    expect(columnForStage("ACTIVE")).toBe("Active Grant Management");
  });
});
