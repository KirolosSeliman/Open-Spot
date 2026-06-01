import { describe, expect, it } from "vitest";

import {
  getNextResponseRank,
  isManualValidationRequired,
  normalizeSimulatedReply
} from "@/lib/sms/simulation";

describe("SMS simulation workflow", () => {
  it("orders replies after the current highest rank", () => {
    expect(getNextResponseRank([null, 1, 3, 2])).toBe(4);
  });

  it("does not auto-select the first positive reply", () => {
    expect(isManualValidationRequired("oui")).toBe(true);
    expect(isManualValidationRequired("YES")).toBe(true);
  });

  it("keeps raw simulated reply text visible and trimmed", () => {
    expect(normalizeSimulatedReply("  Oui, dispo  ")).toBe("Oui, dispo");
  });
});
