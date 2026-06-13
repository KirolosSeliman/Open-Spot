import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getWaitlistSmsEligibility } from "@/lib/waitlist/eligibility";
import {
  filterWaitlistEntries,
  type FilterableWaitlistEntry
} from "@/lib/waitlist/filters";

const baseEntry: FilterableWaitlistEntry = {
  organization_id: "org-1",
  status: "active",
  service_id: "service-1",
  serviceInterestIds: ["service-1"],
  consentStatus: "opted_in",
  source: "manual",
  customerSource: "manual",
  customerLanguage: "fr",
  customerName: "Maya Tremblay",
  customerPhone: "+15145551001",
  discount_interest: false,
  smsEligibility: "Eligible"
};

const entries: FilterableWaitlistEntry[] = [
  baseEntry,
  {
    ...baseEntry,
    organization_id: "org-1",
    service_id: "service-2",
    serviceInterestIds: ["service-2"],
    consentStatus: "needs_consent",
    source: "copy_paste",
    customerSource: "copy_paste",
    customerLanguage: "en",
    customerName: "Sarah Lee",
    customerPhone: "+15145551002",
    discount_interest: true,
    smsEligibility: "Needs consent"
  },
  {
    ...baseEntry,
    organization_id: "org-2",
    service_id: null,
    serviceInterestIds: ["service-1", "service-3"],
    consentStatus: "opted_out",
    source: "qr_code",
    customerSource: "qr_code",
    customerName: "Lina Nguyen",
    customerPhone: "+15145551003",
    smsEligibility: "Opted out"
  }
];

describe("filterWaitlistEntries", () => {
  it("filters by service", () => {
    expect(filterWaitlistEntries(entries, { serviceId: "service-2" })).toEqual([
      entries[1]
    ]);
  });

  it("filters by selected service interests when legacy service_id is empty", () => {
    expect(filterWaitlistEntries(entries, { serviceId: "service-3" })).toEqual([
      entries[2]
    ]);
  });

  it("filters by consent", () => {
    expect(filterWaitlistEntries(entries, { consent: "opted_out" })).toEqual([
      entries[2]
    ]);
  });

  it("filters by source from waitlist or customer acquisition", () => {
    expect(filterWaitlistEntries(entries, { source: "copy_paste" })).toEqual([
      entries[1]
    ]);
  });

  it("searches by name or phone", () => {
    expect(filterWaitlistEntries(entries, { search: "sarah" })).toEqual([
      entries[1]
    ]);
    expect(filterWaitlistEntries(entries, { search: "1003" })).toEqual([
      entries[2]
    ]);
  });

  it("filters discount interest", () => {
    expect(
      filterWaitlistEntries(entries, { discountInterest: "yes" })
    ).toEqual([entries[1]]);
  });

  it("keeps organization scope intact by never changing organization ids", () => {
    const filtered = filterWaitlistEntries(entries, { source: "qr_code" });

    expect(filtered).toEqual([entries[2]]);
    expect(filtered[0].organization_id).toBe("org-2");
  });
});

describe("getWaitlistSmsEligibility", () => {
  it("labels eligibility conservatively", () => {
    expect(
      getWaitlistSmsEligibility({
        consentStatus: "opted_in",
        phone: "+15145551001"
      })
    ).toBe("Eligible");
    expect(
      getWaitlistSmsEligibility({
        consentStatus: "needs_consent",
        phone: "+15145551001"
      })
    ).toBe("Needs consent");
    expect(
      getWaitlistSmsEligibility({
        consentStatus: "opted_out",
        phone: "+15145551001"
      })
    ).toBe("Opted out");
    expect(
      getWaitlistSmsEligibility({
        consentStatus: "opted_in",
        phone: "555"
      })
    ).toBe("Invalid phone");
    expect(
      getWaitlistSmsEligibility({
        consentStatus: "opted_in",
        phone: "+15145551001",
        deletedAt: "2026-06-13T10:00:00.000Z"
      })
    ).toBe("Deleted");
  });
});

describe("waitlist server-side consent safety", () => {
  it("verifies consent, organization scope, active service, and duplicates before insert", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "lib", "dashboard", "actions.ts"),
      "utf8"
    );

    expect(source).toContain('select("status")');
    expect(source).toContain('consent?.status !== "opted_in"');
    expect(source).toContain("Only clients with opted-in SMS consent");
    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).toContain('.eq("active", true)');
    expect(source).toContain("already active on the waitlist");
  });
});
