import { existsSync, readdirSync, readFileSync } from "node:fs";
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

const migrationDirectory = join(process.cwd(), "supabase", "migrations");
const conditionalExpressionHotfixPath = join(
  migrationDirectory,
  "20260526008000_fix_onboarding_rpc_conditional_expressions.sql"
);
const openSpotFoundationPath = join(
  migrationDirectory,
  "20260528183000_open_spot_foundation_profiles_settings.sql"
);
const openSpotRlsPath = join(
  migrationDirectory,
  "20260528184000_open_spot_foundation_rls.sql"
);
const openSpotOnboardingPath = join(
  migrationDirectory,
  "20260528185000_open_spot_onboarding_profiles_settings.sql"
);
const waitlistSignupHardeningPath = join(
  migrationDirectory,
  "20260528190000_harden_public_waitlist_signup_rpc.sql"
);
const validateOpeningOfferHardeningPath = join(
  migrationDirectory,
  "20260528191000_harden_validate_opening_offer_authorization.sql"
);
const createOpeningWithOffersRpcPath = join(
  migrationDirectory,
  "20260529230025_create_opening_with_offers_rpc.sql"
);
const appointmentRemindersFoundationPath = join(
  migrationDirectory,
  "20260529234235_appointment_reminders_foundation.sql"
);
const smsMessagesAppointmentContextPath = join(
  migrationDirectory,
  "20260530000658_sms_messages_appointment_context.sql"
);
const openingSourceAppointmentLinkPath = join(
  migrationDirectory,
  "20260530001447_opening_source_appointment_link.sql"
);
const appointmentStatusReminderFlagsPath = join(
  migrationDirectory,
  "20260531151706_appointment_status_and_reminder_flags.sql"
);
const allMigrationFiles = readdirSync(migrationDirectory)
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort();

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

  it("keeps post-phase-8 RPC permission fixes in an additive hotfix migration", () => {
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

  it("hardens validate_opening_offer with explicit membership, role, and duplicate checks", () => {
    expect(existsSync(validateOpeningOfferHardeningPath)).toBe(true);

    const validateHardeningMigration = readFileSync(
      validateOpeningOfferHardeningPath,
      "utf8"
    );

    expect(validateHardeningMigration).toMatch(
      /create or replace function public\.validate_opening_offer\([\s\S]*?\)\s+returns uuid\s+language plpgsql\s+security invoker\s+set search_path = ''/i
    );
    expect(validateHardeningMigration).toContain("if auth.uid() is null then");
    expect(validateHardeningMigration).toContain("private.has_org_role");
    expect(validateHardeningMigration).toContain(
      "array['owner', 'manager', 'staff']::public.organization_role[]"
    );
    expect(validateHardeningMigration).toContain("for update");
    expect(validateHardeningMigration).toContain("status = 'filled'");
    expect(validateHardeningMigration).toContain("on conflict do nothing");
    expect(validateHardeningMigration).toContain(
      "Opening has already been validated."
    );
    expect(validateHardeningMigration).toMatch(
      /revoke all on function public\.validate_opening_offer\(uuid, uuid, integer, integer\)\s+from public, anon, authenticated, service_role;/i
    );
    expect(validateHardeningMigration).toMatch(
      /grant execute on function public\.validate_opening_offer\(uuid, uuid, integer, integer\)\s+to authenticated;/i
    );
    expect(validateHardeningMigration).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
  });

  it("creates openings, prepared offers, and audit logs through an authorized RPC", () => {
    expect(existsSync(createOpeningWithOffersRpcPath)).toBe(true);

    const openingRpcMigration = readFileSync(createOpeningWithOffersRpcPath, "utf8");

    expect(openingRpcMigration).toContain(
      "create or replace function private.create_opening_with_offers"
    );
    expect(openingRpcMigration).toContain(
      "create or replace function public.create_opening_with_offers"
    );
    expect(openingRpcMigration).toContain("security definer");
    expect(openingRpcMigration).toContain("security invoker");
    expect(openingRpcMigration).toContain("set search_path = ''");
    expect(openingRpcMigration).toContain("request_user_id <> auth.uid()");
    expect(openingRpcMigration).toContain("private.has_org_role");
    expect(openingRpcMigration).toContain(
      "array['owner', 'manager', 'staff']::public.organization_role[]"
    );
    expect(openingRpcMigration).toContain("from public.services s");
    expect(openingRpcMigration).toContain("s.organization_id = target_organization_id");
    expect(openingRpcMigration).toContain("s.active = true");
    expect(openingRpcMigration).toContain("insert into public.openings");
    expect(openingRpcMigration).toContain("normal_price_cents");
    expect(openingRpcMigration).toContain("null,");
    expect(openingRpcMigration).toContain("insert into public.opening_offers");
    expect(openingRpcMigration).toContain("sc.status = 'opted_in'");
    expect(openingRpcMigration).toContain("insert into public.audit_logs");
    expect(openingRpcMigration).toContain("'opening.created'");
    expect(openingRpcMigration).toContain("grant execute on function public.create_opening_with_offers");
    expect(openingRpcMigration).toContain("to authenticated;");
    expect(openingRpcMigration).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
    expect(openingRpcMigration).not.toMatch(
      /\bgrant\s+(?:insert|update|delete|all privileges)\s+on\s+(?:table\s+)?public\.audit_logs\s+to\s+(?:anon|authenticated|public)/i
    );
  });

  it("keeps audit logs append-only through controlled server/RPC flows", () => {
    const joinedSql = allMigrationFiles
      .map((fileName) => readFileSync(join(migrationDirectory, fileName), "utf8"))
      .join("\n");
    expect(joinedSql).toContain("alter table public.audit_logs enable row level security");
    expect(joinedSql).toContain("owners and managers can read audit logs");
    expect(joinedSql).toContain(
      "on public.audit_logs for select to authenticated"
    );
    expect(joinedSql).not.toMatch(
      /on public\.audit_logs for (?:insert|update|delete) to authenticated/i
    );
    expect(joinedSql).toContain("insert into public.audit_logs");
  });

  it("does not schema-qualify SQL conditional expressions in migrations", () => {
    for (const fileName of allMigrationFiles) {
      const sql = readFileSync(join(migrationDirectory, fileName), "utf8");

      expect(sql, fileName).not.toContain("pg_catalog.coalesce");
      expect(sql, fileName).not.toContain("pg_catalog.nullif");
    }
  });

  it("tracks acquisition source without destructive migration changes", () => {
    const sourceTrackingMigration = readFileSync(
      join(
        migrationDirectory,
        "20260528044027_acquisition_source_tracking.sql"
      ),
      "utf8"
    );

    expect(sourceTrackingMigration).toContain(
      "alter table public.customers"
    );
    expect(sourceTrackingMigration).toContain(
      "add column if not exists source text not null default 'manual'"
    );
    expect(sourceTrackingMigration).toContain(
      "alter table public.waitlist_entries"
    );
    expect(sourceTrackingMigration).toContain("'qr_code'");
    expect(sourceTrackingMigration).toContain("'public_link'");
    expect(sourceTrackingMigration).toContain("'kiosk'");
    expect(sourceTrackingMigration).toContain("'copy_paste'");
    expect(sourceTrackingMigration).not.toMatch(/\bdrop table\b/i);
    expect(sourceTrackingMigration).not.toMatch(/\btruncate\b/i);
    expect(sourceTrackingMigration).not.toMatch(/\bdelete\s+from\b/i);
  });

  it("adds an additive RPC hotfix for onboarding conditional expressions", () => {
    expect(existsSync(conditionalExpressionHotfixPath)).toBe(true);

    const conditionalExpressionHotfixMigration = readFileSync(
      conditionalExpressionHotfixPath,
      "utf8"
    );

    expect(conditionalExpressionHotfixMigration).toContain(
      "create or replace function private.create_organization_with_owner"
    );
    expect(conditionalExpressionHotfixMigration).toContain(
      "create or replace function public.create_organization_with_owner"
    );
    expect(conditionalExpressionHotfixMigration).toContain("coalesce(");
    expect(conditionalExpressionHotfixMigration).toContain("nullif(");
    expect(conditionalExpressionHotfixMigration).toContain("set search_path = ''");
    expect(conditionalExpressionHotfixMigration).not.toMatch(/\bdrop table\b/i);
    expect(conditionalExpressionHotfixMigration).not.toMatch(/\btruncate\b/i);
    expect(conditionalExpressionHotfixMigration).not.toMatch(
      /\bdelete\s+from\s+public\.organizations\b/i
    );
    expect(conditionalExpressionHotfixMigration).not.toMatch(
      /\bdelete\s+from\s+public\.organization_members\b/i
    );
  });

  it("tracks public waitlist source variants without destructive SQL", () => {
    const sourceVariantMigration = readFileSync(
      join(
        migrationDirectory,
        "20260528050000_public_waitlist_source_variants.sql"
      ),
      "utf8"
    );

    expect(sourceVariantMigration).toContain(
      "create or replace function public.register_waitlist_signup"
    );
    expect(sourceVariantMigration).toContain("signup_source text");
    expect(sourceVariantMigration).toContain("'public_link'");
    expect(sourceVariantMigration).toContain("'qr_code'");
    expect(sourceVariantMigration).toContain("'kiosk'");
    expect(sourceVariantMigration).toContain("set search_path = ''");
    expect(sourceVariantMigration).toContain("grant execute");
    expect(sourceVariantMigration).toContain("to service_role");
    expect(sourceVariantMigration).not.toMatch(/\bdrop table\b/i);
    expect(sourceVariantMigration).not.toMatch(/\btruncate\b/i);
    expect(sourceVariantMigration).not.toMatch(/\bdelete\s+from\b/i);
    const functionArguments = sourceVariantMigration.slice(
      sourceVariantMigration.indexOf(
        "create or replace function public.register_waitlist_signup"
      ),
      sourceVariantMigration.indexOf(")\nreturns uuid")
    );
    expect(functionArguments).not.toContain("organization_id");
  });

  it("adds an additive waitlist entry services join table for multi-service interests", () => {
    const joinedSql = allMigrationFiles
      .map((fileName) => readFileSync(join(migrationDirectory, fileName), "utf8"))
      .join("\n");

    expect(joinedSql).toContain(
      "create table if not exists public.waitlist_entry_services"
    );
    expect(joinedSql).toContain("waitlist_entry_id uuid not null");
    expect(joinedSql).toContain("service_id uuid not null");
    expect(joinedSql).toContain(
      "constraint waitlist_entry_services_entry_service_unique unique (waitlist_entry_id, service_id)"
    );
    expect(joinedSql).toContain("waitlist_entry_services_org_service_idx");
    expect(joinedSql).toContain("waitlist_entry_services_entry_idx");
    expect(joinedSql).toContain(
      "alter table public.waitlist_entry_services enable row level security"
    );
    expect(joinedSql).toContain(
      "Selected service must belong to the same organization as the waitlist entry."
    );
    expect(joinedSql).toContain("s.organization_id = new.organization_id");
    expect(joinedSql).not.toMatch(
      /\bdrop\s+(?:table|column)\b|\btruncate\b|\bdelete\s+from\s+public\.(?:waitlist_entries|services|customers)\b/i
    );
  });

  it("updates public waitlist signup RPC to validate and store selected service ids", () => {
    const joinedSql = allMigrationFiles
      .map((fileName) => readFileSync(join(migrationDirectory, fileName), "utf8"))
      .join("\n");

    expect(joinedSql).toContain("service_ids uuid[]");
    expect(joinedSql).toContain("selected_service_ids");
    expect(joinedSql).toContain("array_agg(distinct service_id)");
    expect(joinedSql).toContain("s.organization_id = target_organization_id");
    expect(joinedSql).toContain("s.active = true");
    expect(joinedSql).toContain(
      "raise exception 'One or more selected services are unavailable.'"
    );
    expect(joinedSql).toContain("insert into public.waitlist_entry_services");
    expect(joinedSql).toContain("on conflict (waitlist_entry_id, service_id) do nothing");
  });

  it("adds a controlled public waitlist signup write RPC without anon table grants", () => {
    const publicSignupWriteMigration = readFileSync(
      join(
        migrationDirectory,
        "20260528180500_public_waitlist_signup_write_rpc.sql"
      ),
      "utf8"
    );

    expect(publicSignupWriteMigration).toContain(
      "create or replace function public.register_waitlist_signup"
    );
    expect(publicSignupWriteMigration).toContain("consent_accepted boolean");
    expect(publicSignupWriteMigration).toContain("security definer");
    expect(publicSignupWriteMigration).toContain("set search_path = ''");
    expect(publicSignupWriteMigration).toContain(
      "SMS consent is required to join the waitlist."
    );
    expect(publicSignupWriteMigration).toContain(
      "customer_phone_e164 !~ '^\\+[1-9][0-9]{7,14}$'"
    );
    expect(publicSignupWriteMigration).toContain(
      "One or more selected services are unavailable."
    );
    expect(publicSignupWriteMigration).toContain(
      "insert into public.customers"
    );
    expect(publicSignupWriteMigration).toContain(
      "insert into public.sms_consents"
    );
    expect(publicSignupWriteMigration).toContain(
      "insert into public.waitlist_entries"
    );
    expect(publicSignupWriteMigration).toContain(
      "insert into public.waitlist_entry_services"
    );
    expect(publicSignupWriteMigration).toContain(
      "grant execute on function public.register_waitlist_signup"
    );
    expect(publicSignupWriteMigration).not.toMatch(
      /\bgrant\s+(?:select|insert|update|delete|all privileges)\s+on\s+(?:table\s+)?public\.(?:customers|sms_consents|waitlist_entries|waitlist_entry_services)\s+to\s+anon/i
    );
    expect(publicSignupWriteMigration).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
  });

  it("hardens the final public waitlist write RPC to service-role execution only", () => {
    expect(existsSync(waitlistSignupHardeningPath)).toBe(true);

    const hardeningMigration = readFileSync(waitlistSignupHardeningPath, "utf8");
    const waitlistGrantStatements =
      hardeningMigration.match(
        /grant execute on function public\.register_waitlist_signup\([\s\S]*?\)\s+to [^;]+;/gi
      ) ?? [];

    expect(hardeningMigration).toContain(
      "create or replace function public.register_waitlist_signup"
    );
    expect(hardeningMigration).toContain("consent_accepted boolean");
    expect(hardeningMigration).toContain("security definer");
    expect(hardeningMigration).toContain("set search_path = ''");
    expect(hardeningMigration).toContain("previous_consent_status");
    expect(hardeningMigration).toContain("previous_unsubscribed_at");
    expect(hardeningMigration).toContain("'fresh_consent_recorded', true");
    expect(hardeningMigration).toMatch(
      /revoke all on function public\.register_waitlist_signup\([\s\S]*?\)\s+from public, anon, authenticated, service_role;/i
    );
    expect(waitlistGrantStatements.length).toBeGreaterThan(0);
    for (const statement of waitlistGrantStatements) {
      expect(statement).toMatch(/to service_role;$/i);
      expect(statement).not.toMatch(/\bto\s+(?:anon|authenticated)\b/i);
    }
    expect(hardeningMigration).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
  });

  it("preserves customer identity and reuses active waitlist entries on duplicate public signup", () => {
    const identityMigration = readFileSync(
      join(
        migrationDirectory,
        "20260603201000_preserve_customer_identity_on_waitlist_signup.sql"
      ),
      "utf8"
    );

    expect(identityMigration).toContain(
      "create or replace function public.register_waitlist_signup"
    );
    expect(identityMigration).toContain("on conflict (organization_id, phone_e164)");
    expect(identityMigration).not.toContain("full_name = excluded.full_name");
    expect(identityMigration).toContain("preferred_language = excluded.preferred_language");
    expect(identityMigration).toContain("existing_waitlist_entry_id");
    expect(identityMigration).toContain("'waitlist.signup.updated'");
    expect(identityMigration).toContain("'submitted_name_differs'");
    expect(identityMigration).toContain(
      "grant execute on function public.register_waitlist_signup"
    );
    expect(identityMigration).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
  });

  it("revokes direct anonymous table access for public waitlist security", () => {
    const revokeMigration = readFileSync(
      join(
        migrationDirectory,
        "20260528173500_revoke_anon_table_access.sql"
      ),
      "utf8"
    );

    const publicAccessTables = [
      ...organizationScopedTables,
      "waitlist_entry_services"
    ];

    for (const table of publicAccessTables) {
      expect(revokeMigration).toContain(
        `revoke all privileges on table public.${table} from anon;`
      );
      expect(revokeMigration).toContain(
        `revoke all privileges on table public.${table} from public;`
      );
    }

    expect(revokeMigration).toContain(
      "grant select, insert, delete on public.waitlist_entry_services to authenticated;"
    );
    expect(revokeMigration).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
  });

  it("adds Open Spot foundational profiles and organization settings without destructive SQL", () => {
    expect(existsSync(openSpotFoundationPath)).toBe(true);

    const foundationSql = readFileSync(openSpotFoundationPath, "utf8");

    expect(foundationSql).toContain("create table if not exists public.profiles");
    expect(foundationSql).toContain("auth_user_id uuid not null");
    expect(foundationSql).toContain("references auth.users(id) on delete cascade");
    expect(foundationSql).toContain("create table if not exists public.organization_settings");
    expect(foundationSql).toContain("organization_id uuid not null");
    expect(foundationSql).toContain("references public.organizations(id) on delete cascade");
    expect(foundationSql).toContain("alter table public.organization_members");
    expect(foundationSql).toContain("add column if not exists profile_id uuid");
    expect(foundationSql).toContain("add column if not exists status text");
    expect(foundationSql).toContain("insert into public.profiles");
    expect(foundationSql).toContain("from public.organization_members om");
    expect(foundationSql).toContain("join auth.users u");
    expect(foundationSql).toContain("insert into public.organization_settings");
    expect(foundationSql).toContain("organization_members_org_profile_unique_idx");
    expect(foundationSql).not.toMatch(/\bdrop\s+table\b/i);
    expect(foundationSql).not.toMatch(/\btruncate\b/i);
    expect(foundationSql).not.toMatch(/\bdelete\s+from\b/i);
  });

  it("adds Open Spot foundational RLS helpers and policies", () => {
    expect(existsSync(openSpotRlsPath)).toBe(true);

    const rlsSql = readFileSync(openSpotRlsPath, "utf8");

    expect(rlsSql).toContain("create or replace function private.current_profile_id()");
    expect(rlsSql).toContain("set search_path = ''");
    expect(rlsSql).toContain("alter table public.profiles enable row level security");
    expect(rlsSql).toContain("alter table public.organization_settings enable row level security");
    expect(rlsSql).toContain("authenticated users can read own profile");
    expect(rlsSql).toContain("members can read organization settings");
    expect(rlsSql).toContain("owners and managers can update organization settings");
    expect(rlsSql).toContain("revoke all privileges on table public.profiles from anon");
    expect(rlsSql).toContain("revoke all privileges on table public.organization_settings from anon");
    expect(rlsSql).not.toMatch(/\bgrant\s+(?:select|insert|update|delete|all privileges)\s+on\s+(?:table\s+)?public\.(?:profiles|organization_settings)\s+to\s+anon/i);
    expect(rlsSql).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
  });

  it("updates onboarding RPC to create profile, organization, settings, membership, billing, and audit records", () => {
    expect(existsSync(openSpotOnboardingPath)).toBe(true);

    const onboardingSql = readFileSync(openSpotOnboardingPath, "utf8");

    expect(onboardingSql).toContain(
      "create or replace function private.create_organization_with_owner"
    );
    expect(onboardingSql).toContain(
      "create or replace function public.create_organization_with_owner"
    );
    expect(onboardingSql).toContain("set search_path = ''");
    expect(onboardingSql).toContain("insert into public.profiles");
    expect(onboardingSql).toContain("target_profile_id");
    expect(onboardingSql).toContain("insert into public.organizations");
    expect(onboardingSql).toContain("insert into public.organization_settings");
    expect(onboardingSql).toContain("insert into public.organization_members");
    expect(onboardingSql).toContain("profile_id");
    expect(onboardingSql).toContain("insert into public.organization_billing_settings");
    expect(onboardingSql).toContain("insert into public.audit_logs");
    expect(onboardingSql).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
  });

  it("adds appointment reminder tables with conservative settings and RLS", () => {
    expect(existsSync(appointmentRemindersFoundationPath)).toBe(true);

    const appointmentSql = readFileSync(
      appointmentRemindersFoundationPath,
      "utf8"
    );
    const appointmentTables = [
      "appointments",
      "scheduled_messages",
      "sms_templates",
      "appointment_events"
    ];

    expect(appointmentSql).toContain(
      "alter table public.organization_settings"
    );
    expect(appointmentSql).toContain(
      "appointment_reminders_enabled boolean not null default false"
    );
    expect(appointmentSql).toContain(
      "default_reminder_delay_hours integer not null default 24"
    );
    expect(appointmentSql).toContain(
      "auto_create_opening_on_sms_cancellation boolean not null default false"
    );
    expect(appointmentSql).toContain(
      "auto_send_recovery_sms_on_cancellation boolean not null default false"
    );

    for (const table of appointmentTables) {
      expect(appointmentSql).toContain(
        `create table if not exists public.${table}`
      );
      expect(appointmentSql).toContain(
        `alter table public.${table} enable row level security`
      );
      expect(appointmentSql).toContain(
        `revoke all privileges on table public.${table} from anon`
      );
      expect(appointmentSql).toContain(
        `revoke all privileges on table public.${table} from public`
      );
    }

    expect(appointmentSql).toContain("private.is_org_member(organization_id)");
    expect(appointmentSql).toContain("private.has_org_role");
    expect(appointmentSql).toContain(
      "array['owner', 'manager', 'staff']::public.organization_role[]"
    );
    expect(appointmentSql).toContain(
      "array['owner', 'manager']::public.organization_role[]"
    );
    expect(appointmentSql).not.toMatch(
      /\bgrant\s+(?:select|insert|update|delete|all privileges)\s+on\s+(?:table\s+)?public\.(?:appointments|scheduled_messages|sms_templates|appointment_events)\s+to\s+anon/i
    );
  });

  it("keeps appointment reminder scheduling idempotent and append-only where needed", () => {
    const appointmentSql = readFileSync(
      appointmentRemindersFoundationPath,
      "utf8"
    );

    expect(appointmentSql).toContain(
      "scheduled_messages_unique_pending_24h_reminder_idx"
    );
    expect(appointmentSql).toContain(
      "message_type = 'appointment_reminder_24h'"
    );
    expect(appointmentSql).toContain("status in ('pending', 'processing')");
    expect(appointmentSql).toContain(
      "create index if not exists scheduled_messages_status_due_idx"
    );
    expect(appointmentSql).toContain(
      "create index if not exists appointments_org_starts_idx"
    );
    expect(appointmentSql).toContain(
      "create index if not exists appointment_events_org_appointment_created_idx"
    );
    expect(appointmentSql).toContain(
      "grant select, insert on public.appointment_events to authenticated"
    );
    expect(appointmentSql).not.toMatch(
      /\bgrant\s+(?:update|delete|all privileges)\s+on\s+(?:table\s+)?public\.appointment_events\s+to\s+authenticated/i
    );
    expect(appointmentSql).not.toMatch(
      /on public\.appointment_events for (?:update|delete) to authenticated/i
    );
  });

  it("seeds safe bilingual SMS template defaults without enabling real sends", () => {
    const appointmentSql = readFileSync(
      appointmentRemindersFoundationPath,
      "utf8"
    );

    expect(appointmentSql).toContain("appointment_reminder_24h");
    expect(appointmentSql).toContain("appointment_confirmed");
    expect(appointmentSql).toContain("appointment_cancelled");
    expect(appointmentSql).toContain("language text not null");
    expect(appointmentSql).toContain("language in ('fr', 'en')");
    expect(appointmentSql).toContain("STOP");
    expect(appointmentSql).not.toMatch(/\bplivo\b|\btwilio\b|\bsend_sms\b/i);
  });

  it("keeps the appointment reminder foundation migration non-destructive", () => {
    const appointmentSql = readFileSync(
      appointmentRemindersFoundationPath,
      "utf8"
    );

    expect(appointmentSql).not.toMatch(/\bdrop\s+table\b/i);
    expect(appointmentSql).not.toMatch(/\btruncate\b/i);
    expect(appointmentSql).not.toMatch(
      /\bdelete\s+from\s+public\.(?:organizations|organization_members|customers|sms_consents|waitlist_entries|openings|opening_offers|sms_messages|booking_requests|audit_logs|appointments|scheduled_messages|sms_templates|appointment_events)\b/i
    );
  });

  it("adds appointment context to SMS messages additively", () => {
    expect(existsSync(smsMessagesAppointmentContextPath)).toBe(true);

    const appointmentContextSql = readFileSync(
      smsMessagesAppointmentContextPath,
      "utf8"
    );

    expect(appointmentContextSql).toContain("alter table public.sms_messages");
    expect(appointmentContextSql).toContain("add column if not exists appointment_id");
    expect(appointmentContextSql).toContain("references public.appointments(id)");
    expect(appointmentContextSql).toContain("sms_messages_org_appointment_created_idx");
    expect(appointmentContextSql).not.toMatch(/\bdrop\s+table\b/i);
    expect(appointmentContextSql).not.toMatch(/\btruncate\b/i);
    expect(appointmentContextSql).not.toMatch(/\bdelete\s+from\b/i);
  });

  it("adds traceability for openings created from appointment cancellations", () => {
    expect(existsSync(openingSourceAppointmentLinkPath)).toBe(true);

    const sourceLinkSql = readFileSync(openingSourceAppointmentLinkPath, "utf8");

    expect(sourceLinkSql).toContain("alter table public.openings");
    expect(sourceLinkSql).toContain("add column if not exists source text");
    expect(sourceLinkSql).toContain("add column if not exists source_appointment_id");
    expect(sourceLinkSql).toContain("references public.appointments(id)");
    expect(sourceLinkSql).toContain("openings_unique_source_appointment_idx");
    expect(sourceLinkSql).toContain("source = 'appointment_cancellation'");
    expect(sourceLinkSql).not.toMatch(/\bdrop\s+table\b/i);
    expect(sourceLinkSql).not.toMatch(/\btruncate\b/i);
    expect(sourceLinkSql).not.toMatch(/\bdelete\s+from\b/i);
  });

  it("aligns appointment statuses and stores reminder preferences additively", () => {
    expect(existsSync(appointmentStatusReminderFlagsPath)).toBe(true);

    const statusSql = readFileSync(appointmentStatusReminderFlagsPath, "utf8");

    expect(statusSql).toContain("alter table public.appointments");
    expect(statusSql).toContain(
      "add column if not exists reminder_24h_enabled boolean not null default false"
    );
    expect(statusSql).toContain(
      "add column if not exists confirmation_request_enabled boolean not null default false"
    );
    expect(statusSql).toContain(
      "status in ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')"
    );
    expect(statusSql).not.toContain("not" + "_yet_confirmed");
    expect(statusSql).not.toMatch(/\bdrop\s+table\b/i);
    expect(statusSql).not.toMatch(/\btruncate\b/i);
    expect(statusSql).not.toMatch(
      /\bdelete\s+from\s+public\.(?:appointments|scheduled_messages|appointment_events)\b/i
    );
  });
});
