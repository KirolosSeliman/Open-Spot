import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationDirectory = join(process.cwd(), "supabase", "migrations");
const secureManualValidationAuditRpcPath = join(
  migrationDirectory,
  "20260614002000_secure_manual_validation_audit_rpc.sql"
);
const openingConfirmationAuditRpcPath = join(
  migrationDirectory,
  "20260614007000_record_opening_confirmation_audit_rpc.sql"
);

describe("manual validation migrations", () => {
  it("keeps manual validation and audit writes inside a secure definer RPC", () => {
    expect(existsSync(secureManualValidationAuditRpcPath)).toBe(true);

    const sql = readFileSync(secureManualValidationAuditRpcPath, "utf8");

    expect(sql).toMatch(
      /create or replace function public\.validate_opening_offer\([\s\S]*?\)\s+returns uuid\s+language plpgsql\s+security definer\s+set search_path = ''/i
    );
    expect(sql).toContain("if auth.uid() is null then");
    expect(sql).toContain("private.has_org_role");
    expect(sql).toContain("array['owner', 'manager', 'staff']::public.organization_role[]");
    expect(sql).toContain("c.deleted_at is null");
    expect(sql).toContain("sc.status = 'opted_in'");
    expect(sql).toContain("status in ('confirmed', 'completed')");
    expect(sql).toContain("insert into public.audit_logs");
    expect(sql).toContain("'opening.offer.validated'");
    expect(sql).toMatch(
      /revoke insert, update, delete on table public\.audit_logs from authenticated;/i
    );
    expect(sql).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
  });

  it("records opening confirmation SMS audit through a scoped definer RPC", () => {
    expect(existsSync(openingConfirmationAuditRpcPath)).toBe(true);

    const sql = readFileSync(openingConfirmationAuditRpcPath, "utf8");

    expect(sql).toMatch(
      /create or replace function public\.record_opening_confirmation_audit\([\s\S]*?\)\s+returns void\s+language plpgsql\s+security definer\s+set search_path = ''/i
    );
    expect(sql).toContain("sm.message_type = 'opening_confirmation'");
    expect(sql).toContain("br.status in ('confirmed', 'completed')");
    expect(sql).toContain("o.status = 'filled'");
    expect(sql).toContain("oo.status = 'selected'");
    expect(sql).toContain("'sms.opening_confirmation.sent'");
    expect(sql).toMatch(
      /grant execute on function public\.record_opening_confirmation_audit\(uuid, uuid, uuid, uuid, text\)\s+to authenticated;/i
    );
    expect(sql).not.toMatch(
      /\bgrant\s+(?:insert|update|delete|all privileges)\s+on\s+(?:table\s+)?public\.audit_logs\s+to\s+(?:anon|authenticated|public)/i
    );
    expect(sql).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
  });
});
