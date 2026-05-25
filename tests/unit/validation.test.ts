import { describe, expect, it } from "vitest";

import { planManualValidation } from "@/lib/openings/validation";

describe("planManualValidation", () => {
  it("prevents double validation when opening is already filled", () => {
    expect(() =>
      planManualValidation({
        openingStatus: "filled",
        selectedOfferId: "offer-1",
        offers: []
      })
    ).toThrow("Opening has already been filled.");
  });

  it("selects one offer and rejects the rest", () => {
    expect(
      planManualValidation({
        openingStatus: "awaiting_validation",
        selectedOfferId: "offer-1",
        offers: [
          { id: "offer-1", status: "responded" },
          { id: "offer-2", status: "responded" }
        ]
      })
    ).toEqual([
      { id: "offer-1", status: "selected" },
      { id: "offer-2", status: "rejected" }
    ]);
  });
});
