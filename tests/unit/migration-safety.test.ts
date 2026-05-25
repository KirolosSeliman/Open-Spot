import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260525180000_phase_2_multi_tenant_foundation.sql"
  ),
  "utf8"
);

const organizationScopedTables = [
  "organizations",
  "organization_members",
  "services",
  "customers",
  "sms_consents",
  "waitlist_entries",
  "import_batches",
  "openings",
  "opening_offers",
  "booking_requests",
  "sms_messages",
  "audit_logs"
];

describe("phase 2 migration safety", () => {
  it("enables RLS on every business table", () => {
    for (const table of organizationScopedTables) {
      expect(migration).toContain(
        `alter table public.${table} enable row level security;`
      );
    }
  });

  it("does not allow anonymous public waitlist table access", () => {
    expect(migration).toContain(
      "-- Public waitlist writes must go through a server route"
    );
    expect(migration).not.toContain("to anon");
  });

  it("contains tenant isolation and consent constraints", () => {
    expect(migration).toContain("private.is_org_member");
    expect(migration).toContain("unique_customer_phone_per_org");
    expect(migration).toContain("sms_consent_status");
    expect(migration).toContain("opening_offers_opening_customer_unique");
  });
});
