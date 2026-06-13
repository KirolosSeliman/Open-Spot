import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  appendCustomerActionMessage,
  buildSafeCustomerReturnPath,
  hasActivePhoneConflict,
  isDeletedCustomer,
  normalizeCustomerListTab,
  validateCustomerDeleteForm
} from "@/lib/customers/soft-delete";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260613234500_soft_delete_customers.sql"
  ),
  "utf8"
);

describe("customer soft delete helpers", () => {
  it("normalizes active/deleted tabs conservatively", () => {
    expect(normalizeCustomerListTab("deleted")).toBe("deleted");
    expect(normalizeCustomerListTab("active")).toBe("active");
    expect(normalizeCustomerListTab("anything")).toBe("active");
  });

  it("detects deleted customers and active phone conflicts", () => {
    expect(isDeletedCustomer({ deleted_at: "2026-06-13T10:00:00.000Z" })).toBe(
      true
    );
    expect(isDeletedCustomer({ deleted_at: null })).toBe(false);
    expect(
      hasActivePhoneConflict({
        restoringCustomerId: "deleted",
        phoneE164: "+15142494425",
        customers: [
          {
            id: "deleted",
            phone_e164: "+15142494425",
            deleted_at: "2026-06-13T10:00:00.000Z"
          },
          {
            id: "active",
            phone_e164: "+15142494425",
            deleted_at: null
          }
        ]
      })
    ).toBe(true);
  });

  it("keeps return paths inside the clients dashboard", () => {
    expect(buildSafeCustomerReturnPath("/dashboard/clients?tab=deleted")).toBe(
      "/dashboard/clients?tab=deleted"
    );
    expect(buildSafeCustomerReturnPath("https://evil.example")).toBe(
      "/dashboard/clients"
    );
    expect(buildSafeCustomerReturnPath("/dashboard/responses")).toBe(
      "/dashboard/clients"
    );
    expect(
      appendCustomerActionMessage(
        "/dashboard/clients?tab=deleted",
        "message",
        "Client restored."
      )
    ).toBe("/dashboard/clients?tab=deleted&message=Client+restored.");
  });

  it("requires customer id, reason, and explicit confirmation", () => {
    expect(
      validateCustomerDeleteForm({
        customerId: "customer-1",
        reason: "Moved away",
        confirm: "on",
        returnTo: "/dashboard/clients"
      })
    ).toMatchObject({ ok: true });
    expect(
      validateCustomerDeleteForm({
        customerId: "customer-1",
        reason: "no",
        confirm: "on",
        returnTo: "/dashboard/clients"
      })
    ).toMatchObject({ ok: false });
    expect(
      validateCustomerDeleteForm({
        customerId: "customer-1",
        reason: "Moved away",
        confirm: null,
        returnTo: "/dashboard/clients"
      })
    ).toMatchObject({ ok: false });
  });
});

describe("customer soft delete migration", () => {
  it("adds soft-delete columns and active-only phone uniqueness without hard deletes", () => {
    expect(migration).toContain("add column if not exists deleted_at");
    expect(migration).toContain("deleted_by_profile_id");
    expect(migration).toContain("restored_by_profile_id");
    expect(migration).toContain("deletion_metadata jsonb");
    expect(migration).toContain("customers_org_phone_active_unique");
    expect(migration).toContain("where deleted_at is null");
    expect(migration).toContain("drop constraint unique_customer_phone_per_org");
    expect(migration).not.toMatch(/\bdelete\s+from\s+public\.customers\b/i);
    expect(migration).not.toMatch(/\bdrop\s+table\s+public\.customers\b/i);
  });

  it("updates public signup to target active customers instead of reviving deleted rows", () => {
    expect(migration).toContain(
      "on conflict (organization_id, phone_e164) where deleted_at is null"
    );
    expect(migration).toContain("sms_consents_phone_unique");
    expect(migration).toContain("sms_consents_org_phone_idx");
    expect(migration).toContain("and c.deleted_at is null");
    expect(migration).toContain("create or replace function public.validate_opening_offer");
    expect(migration).toContain("for update of oo");
  });
});
