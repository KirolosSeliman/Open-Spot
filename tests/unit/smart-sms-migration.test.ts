import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260706093000_smart_sms_recipient_controls.sql"
);

describe("smart SMS recipient controls migration", () => {
  it("adds recipient controls additively with RLS and no data destruction", () => {
    expect(existsSync(migrationPath)).toBe(true);

    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("alter table public.organization_settings");
    expect(sql).toContain("add column if not exists smart_sending_enabled");
    expect(sql).toContain("create table if not exists public.customer_sms_preferences");
    expect(sql).toContain("create table if not exists public.customer_activity_events");
    expect(sql).toContain("create table if not exists public.alert_recipient_decisions");
    expect(sql).toContain("alert_recipient_decisions_alert_customer_unique");
    expect(sql).toContain("alter table public.customer_sms_preferences enable row level security");
    expect(sql).toContain("alter table public.customer_activity_events enable row level security");
    expect(sql).toContain("alter table public.alert_recipient_decisions enable row level security");
    expect(sql).toContain("private.is_org_member(organization_id)");
    expect(sql).toContain("array['owner', 'manager', 'staff']::public.organization_role[]");
    expect(sql).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
    expect(sql).not.toMatch(
      /\bgrant\s+(?:select|insert|update|delete|all privileges)\s+on\s+(?:table\s+)?public\.(?:customer_sms_preferences|customer_activity_events|alert_recipient_decisions)\s+to\s+anon/i
    );
  });
});
