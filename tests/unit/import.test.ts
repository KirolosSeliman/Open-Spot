import { describe, expect, it } from "vitest";

import { validateCustomerImportRows } from "@/lib/import/customer-import";

describe("validateCustomerImportRows", () => {
  it("detects invalid phones and duplicate phones within the file", () => {
    const result = validateCustomerImportRows([
      { fullName: "Ada", phone: "5145550199", consentStatus: "yes", hasConsentProof: true },
      { fullName: "Grace", phone: "5145550199", consentStatus: "", hasConsentProof: false },
      { fullName: "Bad", phone: "555", consentStatus: "yes", hasConsentProof: true }
    ]);

    expect(result.summary).toEqual({
      totalRows: 3,
      validRows: 1,
      duplicateRows: 1,
      invalidPhoneRows: 1,
      needsConsentRows: 0,
      optedInRows: 1,
      optedOutRows: 0
    });
    expect(result.rows[1].status).toBe("duplicate");
    expect(result.rows[2].status).toBe("invalid");
  });
});
