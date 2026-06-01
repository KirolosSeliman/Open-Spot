import { describe, expect, it } from "vitest";

import { normalizePhoneToE164 } from "@/lib/customers/phone";

describe("normalizePhoneToE164", () => {
  it("normalizes North American phone input to +1 E.164", () => {
    expect(normalizePhoneToE164("5142494425")).toEqual({
      ok: true,
      phoneE164: "+15142494425"
    });
    expect(normalizePhoneToE164("514-249-4425")).toEqual({
      ok: true,
      phoneE164: "+15142494425"
    });
    expect(normalizePhoneToE164("(514) 249-4425")).toEqual({
      ok: true,
      phoneE164: "+15142494425"
    });
    expect(normalizePhoneToE164("1-514-249-4425")).toEqual({
      ok: true,
      phoneE164: "+15142494425"
    });
    expect(normalizePhoneToE164("+15142494425")).toEqual({
      ok: true,
      phoneE164: "+15142494425"
    });
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
      error: "Enter a valid 10-digit Canadian or US phone number."
    });
    expect(normalizePhoneToE164("12345678901234567890")).toEqual({
      ok: false,
      error: "Enter a valid 10-digit Canadian or US phone number."
    });
  });
});
