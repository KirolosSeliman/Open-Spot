import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertDashboardOrganizationId,
  buildDashboardOverview,
  calculateRecoveredRevenueCents
} from "@/lib/dashboard/real-data";

describe("real dashboard data", () => {
  it("requires an organization id before querying organization data", () => {
    expect(() => assertDashboardOrganizationId("")).toThrow(
      "Organization id is required for dashboard data."
    );
    expect(assertDashboardOrganizationId("org_123")).toBe("org_123");
  });

  it("builds zero-data dashboard state for a new organization", () => {
    expect(
      buildDashboardOverview({
        organizationName: "KiroClipz",
        customersCount: 0,
        waitlistEntriesCount: 0,
        servicesCount: 0,
        openingsCount: 0,
        pendingRepliesCount: 0,
        recoveredBookingsCount: 0,
        recoveredRevenueCents: 0,
        smsSentCount: 0
      })
    ).toEqual({
      organizationName: "KiroClipz",
      customersCount: 0,
      waitlistEntriesCount: 0,
      servicesCount: 0,
      openingsCount: 0,
      pendingRepliesCount: 0,
      recoveredBookingsCount: 0,
      recoveredRevenueCents: 0,
      smsSentCount: 0,
      setup: {
        hasServices: false,
        hasCustomers: false,
        hasWaitlistEntries: false,
        hasOpenings: false
      }
    });
  });

  it("calculates recovered revenue from confirmed booking rows only", () => {
    expect(
      calculateRecoveredRevenueCents([
        { recovered_value_cents: 5500 },
        { recovered_value_cents: null },
        { recovered_value_cents: 12000 }
      ])
    ).toBe(17500);
  });

  it("keeps dashboard queries scoped to organization_id", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "lib", "dashboard", "real-data.ts"),
      "utf8"
    );

    expect(source).toContain(".eq(\"organization_id\", organizationId)");
    expect(source).toContain("select(\"id\", { count: \"exact\", head: true })");
    expect(source).not.toContain("createSupabaseServiceClient");
  });
});
