import { describe, expect, it } from "vitest";

import { normalizePhoneToE164 } from "@/lib/customers/phone";

describe("normalizePhoneToE164", () => {
  it.each([
    ["5142494425", "+15142494425"],
    ["514-249-4425", "+15142494425"],
    ["(514) 249-4425", "+15142494425"],
    ["+15142494425", "+15142494425"],
    ["1-514-249-4425", "+15142494425"]
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizePhoneToE164(input)).toEqual({
      ok: true,
      phoneE164: expected
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
    expect(normalizePhoneToE164("12345678901234567890")).toEqual({
      ok: false,
      error: "Phone number must be a valid E.164 number."
    });
  });
});
