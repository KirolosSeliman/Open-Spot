import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
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

const securityAdvisorMigration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260526001000_phase_2_security_advisor_hardening.sql"
  ),
  "utf8"
);

const organizationBootstrapMigration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260526002000_phase_4_organization_bootstrap_rpc.sql"
  ),
  "utf8"
);

const singleOrganizationMigration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260526003000_phase_5_single_org_until_switcher.sql"
  ),
  "utf8"
);

const organizationDataQualityMigration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260526004000_phase_6_org_data_quality_audit.sql"
  ),
  "utf8"
);

const rpcHardeningMigration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260526005000_phase_8_rpc_sql_hardening.sql"
  ),
  "utf8"
);

const rpcPermissionHotfixMigration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260526006000_phase_9_rpc_permission_hotfix.sql"
  ),
  "utf8"
);

const organizationActions = readFileSync(
  join(process.cwd(), "src", "lib", "organization", "actions.ts"),
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

  it("hardens functions reported by Supabase Security Advisor", () => {
    expect(securityAdvisorMigration).toContain(
      "set search_path = pg_catalog, private, public"
    );
    expect(securityAdvisorMigration).toContain("pg_catalog.now()");
    expect(securityAdvisorMigration).toContain(
      "revoke all on function public.rls_auto_enable() from public, anon, authenticated"
    );
    expect(securityAdvisorMigration).not.toContain("grant execute");
  });

  it("creates organizations through an authenticated transaction-safe RPC", () => {
    const publicRpcDefinition = organizationBootstrapMigration.slice(
      organizationBootstrapMigration.indexOf(
        "create or replace function public.create_organization_with_owner"
      ),
      organizationBootstrapMigration.indexOf(
        "revoke all on function public.create_organization_with_owner"
      )
    );

    expect(organizationBootstrapMigration).toContain(
      "create or replace function public.create_organization_with_owner"
    );
    expect(organizationBootstrapMigration).toContain(
      "create or replace function private.create_organization_with_owner"
    );
    expect(organizationBootstrapMigration).toContain("security definer");
    expect(organizationBootstrapMigration).toContain("security invoker");
    expect(organizationBootstrapMigration).toContain("set search_path = ''");
    expect(organizationBootstrapMigration).toContain(
      "request_user_id uuid := auth.uid()"
    );
    expect(organizationBootstrapMigration).toContain(
      "insert into public.organizations"
    );
    expect(organizationBootstrapMigration).toContain(
      "insert into public.organization_members"
    );
    expect(organizationBootstrapMigration).toContain(
      "insert into public.organization_billing_settings"
    );
    expect(organizationBootstrapMigration).toContain(
      "insert into public.audit_logs"
    );
    expect(organizationBootstrapMigration).toContain(
      ") from public, anon, authenticated;"
    );
    expect(organizationBootstrapMigration).toContain(") to authenticated;");
    expect(publicRpcDefinition).toContain("security invoker");
    expect(publicRpcDefinition).not.toContain("security definer");
  });

  it("does not use service-role manual rollback for organization bootstrap", () => {
    expect(organizationActions).toContain(
      'supabase.rpc("create_organization_with_owner"'
    );
    expect(organizationActions).not.toContain("createSupabaseServiceClient");
    expect(organizationActions).not.toContain(".delete()");
  });

  it("prevents accidental second organizations until a switcher exists", () => {
    expect(singleOrganizationMigration).toContain(
      "organization_members_single_org_per_user_idx"
    );
    expect(singleOrganizationMigration).toContain(
      "on public.organization_members(user_id)"
    );
    expect(singleOrganizationMigration).toContain(
      "having count(*) > 1"
    );
    expect(singleOrganizationMigration).toContain(
      "User already belongs to an organization."
    );
    expect(organizationActions).toContain('.from("organization_members")');
    expect(organizationActions).toContain('redirect("/dashboard")');
  });

  it("keeps organization creation auditable without storing contact PII in metadata", () => {
    expect(organizationDataQualityMigration).toContain(
      "Business email must be valid if provided."
    );
    expect(organizationDataQualityMigration).toContain(
      "Phone number must be a valid E.164 number."
    );
    expect(organizationDataQualityMigration).toContain(
      "Timezone is not supported yet."
    );
    expect(organizationDataQualityMigration).toContain("'organization.created'");
    expect(organizationDataQualityMigration).toContain("'single_org_mode', true");
    expect(organizationDataQualityMigration).not.toContain("'email', normalized_email");
    expect(organizationDataQualityMigration).not.toContain("'phone', normalized_phone");
  });

  it("keeps service-role waitlist RPC access explicit and hardens RPC search paths", () => {
    expect(rpcHardeningMigration).toContain("set search_path = ''");
    expect(rpcHardeningMigration).toContain(
      "create or replace function private.is_org_member"
    );
    expect(rpcHardeningMigration).toContain(
      "create or replace function private.has_org_role"
    );
    expect(rpcHardeningMigration).toContain(
      "revoke all on function public.register_waitlist_signup"
    );
    expect(rpcHardeningMigration).toContain("from public, anon, authenticated, service_role");
    expect(rpcHardeningMigration).toContain(") to service_role;");
    expect(rpcHardeningMigration).toContain(
      "grant execute on function public.validate_opening_offer"
    );
    expect(rpcHardeningMigration).toContain("to authenticated;");
    expect(rpcHardeningMigration).not.toContain("set search_path = public");
  });

  it("applies post-phase-8 RPC permission fixes in an additive hotfix migration", () => {
    const changedAppliedMigrations = execSync(
      "git diff --name-only -- supabase/migrations/20260525180000_phase_2_multi_tenant_foundation.sql supabase/migrations/20260525191500_phase_3_waitlist_signup_rpc.sql supabase/migrations/20260525203000_phase_4_manual_validation_rpc.sql supabase/migrations/20260526005000_phase_8_rpc_sql_hardening.sql",
      { encoding: "utf8" }
    ).trim();

    expect(changedAppliedMigrations).toBe("");
    expect(rpcPermissionHotfixMigration).toContain(
      "-- Phase 9: Additive RPC permission and conflict hotfix."
    );
  });

  it("does not grant private RLS helper execution to service_role by default", () => {
    expect(rpcPermissionHotfixMigration).toMatch(
      /revoke all on function private\.is_org_member\(uuid\)\s+from public, anon, authenticated, service_role;/i
    );
    expect(rpcPermissionHotfixMigration).toMatch(
      /revoke all on function private\.has_org_role\(uuid, public\.organization_role\[\]\)\s+from public, anon, authenticated, service_role;/i
    );
    expect(rpcPermissionHotfixMigration).toMatch(
      /grant usage on schema private to authenticated;/i
    );
    expect(rpcPermissionHotfixMigration).toMatch(
      /grant execute on function private\.is_org_member\(uuid\) to authenticated;/i
    );
    expect(rpcPermissionHotfixMigration).toMatch(
      /grant execute on function private\.has_org_role\(uuid, public\.organization_role\[\]\) to authenticated;/i
    );
    expect(rpcPermissionHotfixMigration).not.toMatch(
      /grant (usage on schema private|execute on function private\.(?:is_org_member|has_org_role)[^;]*) to [^;]*service_role/i
    );
  });

  it("keeps register_waitlist_signup executable only by service_role", () => {
    const waitlistGrantStatements =
      rpcPermissionHotfixMigration.match(
        /grant execute on function public\.register_waitlist_signup\([\s\S]*?\)\s+to [^;]+;/gi
      ) ?? [];

    expect(rpcPermissionHotfixMigration).toMatch(
      /create or replace function public\.register_waitlist_signup\([\s\S]*?\)\s+returns uuid\s+language plpgsql\s+security invoker\s+set search_path = ''/i
    );
    expect(rpcPermissionHotfixMigration).toMatch(
      /revoke all on function public\.register_waitlist_signup\(\s*text,\s*text,\s*text,\s*public\.supported_language,\s*text,\s*text\[\],\s*text\[\],\s*boolean,\s*text\s*\)\s+from public, anon, authenticated, service_role;/i
    );
    expect(rpcPermissionHotfixMigration).toMatch(
      /grant execute on function public\.register_waitlist_signup\(\s*text,\s*text,\s*text,\s*public\.supported_language,\s*text,\s*text\[\],\s*text\[\],\s*boolean,\s*text\s*\)\s+to service_role;/i
    );
    expect(waitlistGrantStatements).toHaveLength(1);
    expect(waitlistGrantStatements[0]).toMatch(/to service_role;$/i);
  });

  it("keeps validate_opening_offer executable only by authenticated users", () => {
    const validationGrantStatements =
      rpcPermissionHotfixMigration.match(
        /grant execute on function public\.validate_opening_offer\([\s\S]*?\)\s+to [^;]+;/gi
      ) ?? [];

    expect(rpcPermissionHotfixMigration).toMatch(
      /create or replace function public\.validate_opening_offer\([\s\S]*?\)\s+returns uuid\s+language plpgsql\s+security invoker\s+set search_path = ''/i
    );
    expect(rpcPermissionHotfixMigration).toMatch(
      /revoke all on function public\.validate_opening_offer\(uuid, uuid, integer, integer\)\s+from public, anon, authenticated, service_role;/i
    );
    expect(rpcPermissionHotfixMigration).toMatch(
      /grant execute on function public\.validate_opening_offer\(uuid, uuid, integer, integer\)\s+to authenticated;/i
    );
    expect(validationGrantStatements).toHaveLength(1);
    expect(validationGrantStatements[0]).toMatch(/to authenticated;$/i);
  });

  it("handles the partial unique booking request index with on conflict do nothing", () => {
    const conflictClauseIndex = rpcPermissionHotfixMigration.indexOf(
      "on conflict do nothing"
    );
    const returningIndex = rpcPermissionHotfixMigration.indexOf(
      "returning id into target_booking_request_id"
    );

    expect(conflictClauseIndex).toBeGreaterThan(-1);
    expect(returningIndex).toBeGreaterThan(conflictClauseIndex);
    expect(rpcPermissionHotfixMigration).not.toContain("on constraint");
  });
});
