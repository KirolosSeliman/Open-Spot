import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260706093000_smart_sms_recipient_controls.sql"
);
const migrationsDir = join(process.cwd(), "supabase", "migrations");
const finalProductionChecksPath = join(
  process.cwd(),
  "supabase",
  "tests",
  "smart_sms_final_production_checks.sql"
);

function readMigrationBySuffix(suffix: string) {
  const file = readdirSync(migrationsDir).find((name) => name.endsWith(suffix));

  expect(file).toBeTruthy();

  return readFileSync(join(migrationsDir, file ?? ""), "utf8");
}

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
    expect(sql).toMatch(/on public\.alert_recipient_decisions for select to authenticated/i);
    expect(sql).toMatch(/on public\.alert_recipient_decisions for update to authenticated/i);
    expect(sql).toContain("with check (");
    expect(sql).not.toMatch(/\bfor\s+delete\b/i);
    expect(sql).not.toMatch(/\bgrant\s+delete\b/i);
    expect(sql).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
    expect(sql).not.toMatch(
      /\bgrant\s+(?:select|insert|update|delete|all privileges)\s+on\s+(?:table\s+)?public\.(?:customer_sms_preferences|customer_activity_events|alert_recipient_decisions)\s+to\s+anon/i
    );
  });

  it("does not add any automatic booking or first-reply-wins primitive", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).not.toMatch(/auto[_\s-]?(?:book|confirm)|first[_\s-]?reply[_\s-]?wins/i);
    expect(sql).not.toMatch(/confirmed[_\s-]?automatically/i);
  });

  it("adds multi-tenant FK and RLS hardening additively", () => {
    const sql = readMigrationBySuffix("_smart_sms_multi_tenant_hardening.sql");

    expect(sql).toContain("customers_id_organization_id_unique");
    expect(sql).toContain("openings_id_organization_id_unique");
    expect(sql).toContain("appointments_id_organization_id_unique");
    expect(sql).toContain("customer_sms_preferences_customer_org_fk");
    expect(sql).toContain("customer_activity_events_customer_org_fk");
    expect(sql).toContain("alert_recipient_decisions_customer_org_fk");
    expect(sql).toContain("alert_recipient_decisions_alert_org_fk");
    expect(sql).toContain("exists (");
    expect(sql).toContain("from public.customers c");
    expect(sql).toContain("from public.openings o");
    expect(sql).toContain("private.is_org_member(organization_id)");
    expect(sql).toContain("private.has_org_role(");
    expect(sql).not.toMatch(/\bgrant\s+.+\s+to\s+anon\b/i);
    expect(sql).not.toMatch(/\bfor\s+delete\b/i);
    expect(sql).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
  });

  it("prevents alert recipient decision audit regression at the database layer", () => {
    const sql = readMigrationBySuffix("_smart_sms_decision_audit_guard.sql");

    expect(sql).toContain("private.prevent_alert_recipient_decision_audit_regression");
    expect(sql).toContain("before update on public.alert_recipient_decisions");
    expect(sql).toContain("old.sent_at is not null and new.sent_at is null");
    expect(sql).toContain("old.twilio_message_sid is not null");
    expect(sql).toContain("old.delivery_status is not null and new.delivery_status is null");
    expect(sql).toContain("old.sent_at is not null");
    expect(sql).toContain("base_decision = 'locked_blocked'");
    expect(sql).toContain("final_decision = 'send'");
    expect(sql).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
  });

  it("adds final production guards for claimed decisions and recommendation ranking", () => {
    const sql = readMigrationBySuffix(
      "_smart_sms_final_production_guard.sql"
    );

    expect(sql).toContain("add column if not exists recommendation_rank integer");
    expect(sql).toContain("add column if not exists recommendation_bucket text");
    expect(sql).toContain("old.delivery_status in (");
    expect(sql).toContain("'pending_send'");
    expect(sql).toContain("new.final_decision is distinct from old.final_decision");
    expect(sql).toContain("new.manual_override is distinct from old.manual_override");
    expect(sql).toContain("new.warning_required is distinct from old.warning_required");
    expect(sql).toContain("new.override_reason is distinct from old.override_reason");
    expect(sql).toContain("old.delivery_status is not null and new.delivery_status is null");
    expect(sql).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
  });

  it("keeps an executable final-production database and RLS checklist", () => {
    expect(existsSync(finalProductionChecksPath)).toBe(true);

    const sql = readFileSync(finalProductionChecksPath, "utf8");

    expect(sql).toContain("begin;");
    expect(sql).toContain("rollback;");
    expect(sql).toContain("relrowsecurity");
    expect(sql).toContain("grantee = 'anon'");
    expect(sql).toContain("cmd = 'DELETE'");
    expect(sql).toContain("alert_recipient_decisions_customer_org_fk");
    expect(sql).toContain("alert_recipient_decisions_alert_org_fk");
    expect(sql).toContain("recommendation_rank");
    expect(sql).toContain("recommendation_bucket");
    expect(sql).toContain("opening_offer_status");
    expect(sql).toContain("invalid");
    expect(sql).toContain("pending_send");
    expect(sql).toContain("failed");
    expect(sql).toContain("new.final_decision is distinct from old.final_decision");
    expect(sql).toContain("new.manual_override is distinct from old.manual_override");
    expect(sql).toContain("old.delivery_status is not null and new.delivery_status is null");
    expect(sql).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
  });

  it("documents sms_consents as the consent source of truth", () => {
    const sql = readMigrationBySuffix("_smart_sms_consent_source_comments.sql");

    expect(sql).toContain("comment on column public.customer_sms_preferences.sms_consent_status");
    expect(sql).toContain("Source of truth is public.sms_consents");
    expect(sql).toContain("comment on column public.customer_sms_preferences.consented_at");
    expect(sql).toContain("comment on column public.customer_sms_preferences.opted_out_at");
    expect(sql).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
  });
});
