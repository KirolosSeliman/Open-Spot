import { describe, expect, it } from "vitest";

import { formatNorthAmericanPhoneForDisplay } from "@/lib/customers/phone-format";

describe("formatNorthAmericanPhoneForDisplay", () => {
  it.each([
    ["", ""],
    ["5", "5"],
    ["514", "514"],
    ["5142", "514-2"],
    ["514249", "514-249"],
    ["5142494425", "514-249-4425"],
    ["514-249-4425", "514-249-4425"],
    ["(514) 249-4425", "514-249-4425"],
    ["+15142494425", "514-249-4425"],
    ["1-514-249-4425", "514-249-4425"]
  ])("formats %s as %s", (input, expected) => {
    expect(formatNorthAmericanPhoneForDisplay(input)).toBe(expected);
  });
});
