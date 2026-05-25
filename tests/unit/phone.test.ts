import { describe, expect, it } from "vitest";

import { normalizePhoneToE164 } from "@/lib/customers/phone";

describe("normalizePhoneToE164", () => {
  it("normalizes Quebec-style 10 digit numbers to +1 E.164", () => {
    expect(normalizePhoneToE164("(514) 555-0199")).toEqual({
      ok: true,
      phoneE164: "+15145550199"
    });
  });

  it("preserves valid international E.164 numbers", () => {
    expect(normalizePhoneToE164("+14165550123")).toEqual({
      ok: true,
      phoneE164: "+14165550123"
    });
  });

  it("rejects unsafe or incomplete numbers", () => {
    expect(normalizePhoneToE164("555")).toEqual({
      ok: false,
      error: "Phone number must be a valid E.164 number."
    });
  });
});
