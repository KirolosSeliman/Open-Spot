import { describe, expect, it } from "vitest";

import {
  extractPhoneDigits,
  formatNorthAmericanPhoneForDisplay
} from "@/lib/customers/phone-format";

describe("phone display formatting", () => {
  it("extracts only digits from phone-like input", () => {
    expect(extractPhoneDigits("(514) 249-4425")).toBe("5142494425");
    expect(extractPhoneDigits("+1 514 249 4425")).toBe("15142494425");
  });

  it("formats North American phone input for progressive display", () => {
    expect(formatNorthAmericanPhoneForDisplay("")).toBe("");
    expect(formatNorthAmericanPhoneForDisplay("5")).toBe("5");
    expect(formatNorthAmericanPhoneForDisplay("514")).toBe("514");
    expect(formatNorthAmericanPhoneForDisplay("5142")).toBe("514-2");
    expect(formatNorthAmericanPhoneForDisplay("514249")).toBe("514-249");
    expect(formatNorthAmericanPhoneForDisplay("5142494425")).toBe("514-249-4425");
    expect(formatNorthAmericanPhoneForDisplay("514-249-4425")).toBe("514-249-4425");
    expect(formatNorthAmericanPhoneForDisplay("(514) 249-4425")).toBe("514-249-4425");
    expect(formatNorthAmericanPhoneForDisplay("+15142494425")).toBe("514-249-4425");
    expect(formatNorthAmericanPhoneForDisplay("1-514-249-4425")).toBe("514-249-4425");
  });
});
