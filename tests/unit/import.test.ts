import { describe, expect, it } from "vitest";

import {
  mapCsvToCustomerImportRows,
  validateCustomerImportRows
} from "@/lib/import/customer-import";
import { mapPastedTextToCustomerImportRows } from "@/lib/import/paste";

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

describe("mapCsvToCustomerImportRows", () => {
  it("maps common English and French CSV headers safely", () => {
    expect(
      mapCsvToCustomerImportRows(
        "nom,téléphone,courriel,langue,consentement,notes\nMaya,5142494425,maya@example.com,fr,oui,VIP"
      )
    ).toEqual([
      {
        fullName: "Maya",
        phone: "5142494425",
        email: "maya@example.com",
        preferredLanguage: "fr",
        consentStatus: "oui",
        hasConsentProof: true,
        notes: "VIP"
      }
    ]);
  });

  it("supports broader aliases and requires proof for opted_in status imports", () => {
    const [row] = mapCsvToCustomerImportRows(
      "customer name,phone number,language,service interest,consent status,consent source,consent date,source\nMaya,5142494425,French,Coupe,opted_in,,2026-05-29,legacy_sheet"
    );

    expect(row).toMatchObject({
      fullName: "Maya",
      phone: "5142494425",
      preferredLanguage: "French",
      service: "Coupe",
      consentStatus: "opted_in",
      consentDate: "2026-05-29",
      source: "legacy_sheet",
      hasConsentProof: true
    });

    const [unsafeOptIn] = mapCsvToCustomerImportRows(
      "full_name,phone,consent_status\nMaya,5142494425,opted_in"
    );

    expect(unsafeOptIn.hasConsentProof).toBe(false);
    expect(validateCustomerImportRows([unsafeOptIn]).rows[0].consentStatus).toBe(
      "needs_consent"
    );
  });

  it("rejects invalid languages, formula-like text, empty files, and malformed CSV", () => {
    const validation = validateCustomerImportRows([
      {
        fullName: "=cmd",
        phone: "5142494425",
        preferredLanguage: "es",
        consentStatus: "oui",
        hasConsentProof: true
      }
    ]);

    expect(validation.rows[0].status).toBe("invalid");
    expect(validation.rows[0].errors).toContain(
      "Preferred language must be fr, en, or blank."
    );
    expect(validation.rows[0].errors).toContain(
      "Spreadsheet formulas are not allowed in imported text fields."
    );
    expect(() => mapCsvToCustomerImportRows("")).toThrow("CSV file is empty.");
    expect(() => mapCsvToCustomerImportRows('name,phone\n"Maya,514')).toThrow(
      "Malformed CSV"
    );
  });
});

describe("mapPastedTextToCustomerImportRows", () => {
  it("extracts names and phones from simple pasted lines", () => {
    expect(
      mapPastedTextToCustomerImportRows(
        "Maya 5145551001\nSarah 514-555-1002\nLina Nguyen (514) 555-1003"
      )
    ).toMatchObject([
      {
        fullName: "Maya",
        phone: "5145551001",
        hasConsentProof: false
      },
      {
        fullName: "Sarah",
        phone: "514-555-1002",
        hasConsentProof: false
      },
      {
        fullName: "Lina Nguyen",
        phone: "(514) 555-1003",
        hasConsentProof: false
      }
    ]);
  });

  it("flags invalid pasted lines through shared validation", () => {
    const result = validateCustomerImportRows(
      mapPastedTextToCustomerImportRows("No phone here\n5145551001")
    );

    expect(result.summary.invalidPhoneRows).toBe(1);
    expect(result.rows[0].status).toBe("invalid");
    expect(result.rows[1].errors).toContain("Customer name is required.");
  });

  it("detects pasted duplicate phones and defaults consent safely", () => {
    const result = validateCustomerImportRows(
      mapPastedTextToCustomerImportRows(
        "Maya 5145551001\nSarah 514-555-1001"
      )
    );

    expect(result.summary.duplicateRows).toBe(1);
    expect(result.summary.needsConsentRows).toBe(1);
    expect(result.rows[0].consentStatus).toBe("needs_consent");
  });

  it("allows an explicit bulk consent proof only when selected", () => {
    const result = validateCustomerImportRows(
      mapPastedTextToCustomerImportRows("Maya 5145551001", {
        hasConsentProof: true
      })
    );

    expect(result.rows[0].consentStatus).toBe("opted_in");
    expect(result.summary.optedInRows).toBe(1);
  });
});
