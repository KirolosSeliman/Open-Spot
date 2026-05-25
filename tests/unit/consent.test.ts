import { describe, expect, it } from "vitest";

import { mapConsentStatus } from "@/lib/customers/consent";

describe("mapConsentStatus", () => {
  it("maps explicit opt-in values only when consent proof is present", () => {
    expect(mapConsentStatus("opted_in", true)).toBe("opted_in");
    expect(mapConsentStatus("yes", true)).toBe("opted_in");
    expect(mapConsentStatus("yes", false)).toBe("needs_consent");
  });

  it("maps opt-out values conservatively", () => {
    expect(mapConsentStatus("stop", false)).toBe("opted_out");
    expect(mapConsentStatus("unsubscribed", true)).toBe("opted_out");
  });

  it("defaults blanks and unknown values to needs_consent", () => {
    expect(mapConsentStatus("", false)).toBe("needs_consent");
    expect(mapConsentStatus("maybe", true)).toBe("needs_consent");
  });
});
