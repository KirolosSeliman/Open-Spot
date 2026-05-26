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
});
