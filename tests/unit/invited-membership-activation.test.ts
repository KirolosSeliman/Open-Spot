import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { workspaceMemberStatuses } from "@/lib/organization/membership";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260704103000_fix_invited_membership_rls.sql"
);

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("invited membership RLS migration", () => {
  it("ships an idempotent policy allowing users to read only their own invited or active row", () => {
    expect(existsSync(migrationPath)).toBe(true);

    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain(
      'drop policy if exists "organization members can read own active or invited membership"'
    );
    expect(migration).toContain("user_id = (select auth.uid())");
    expect(migration).toContain("status in ('active', 'invited')");
    expect(migration).toContain(
      'drop policy if exists "active members can read active organization members"'
    );
    expect(migration).toContain("status = 'active'");
    expect(migration).toContain("private.is_org_member(organization_id)");
    expect(migration).not.toMatch(
      /on public\.organization_members\s+for\s+update/i
    );
    expect(migration).not.toMatch(/\bgrant\s+update\b/i);
  });
});

describe("setPasswordAction membership activation", () => {
  const setPasswordActions = source("src/lib/auth/set-password-actions.ts");

  it("uses the authenticated Supabase user instead of form-provided user ids", () => {
    expect(setPasswordActions).toContain("supabase.auth.getUser()");
    expect(setPasswordActions).toContain(".eq(\"user_id\", user.id)");
    expect(setPasswordActions).not.toContain("formData.get(\"userId\")");
    expect(setPasswordActions).not.toContain("formData.get(\"user_id\")");
  });

  it("activates invited memberships with the service role after password update", () => {
    expect(setPasswordActions).toContain("supabase.auth.updateUser({ password })");
    expect(setPasswordActions).toContain("createSupabaseServiceClient()");
    expect(setPasswordActions).toContain('.eq("status", "invited")');
    expect(setPasswordActions).toContain('status: "active"');
    expect(setPasswordActions).toContain("joined_at: now");
    expect(setPasswordActions).not.toContain("role:");
    expect(setPasswordActions).not.toContain("organization_id:");
  });

  it("handles missing service role configuration with a user-safe sign-in notice", () => {
    expect(setPasswordActions).toContain("if (!serviceClient)");
    expect(setPasswordActions).toContain("Contactez Open Spot.");
    expect(setPasswordActions).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(setPasswordActions).not.toContain("service_role");
    expect(setPasswordActions).not.toContain("RLS");
  });

  it("does not activate memberships when password update fails", () => {
    const updateUserIndex = setPasswordActions.indexOf(
      "supabase.auth.updateUser({ password })"
    );
    const serviceClientIndex = setPasswordActions.indexOf(
      "createSupabaseServiceClient()"
    );

    expect(updateUserIndex).toBeGreaterThan(-1);
    expect(serviceClientIndex).toBeGreaterThan(updateUserIndex);
    expect(setPasswordActions.slice(updateUserIndex, serviceClientIndex)).toContain(
      "if (error)"
    );
  });

  it("verifies workspace membership before the success redirect", () => {
    expect(setPasswordActions).toContain("workspaceMemberStatuses");
    expect(setPasswordActions).toContain("/sign-in?password_created=1");
    expect(setPasswordActions).toContain(
      "aucun accès commerce n'est associé à ce compte"
    );
  });
});

describe("workspace membership statuses", () => {
  it("keeps invited memberships eligible for workspace resolution", () => {
    expect(workspaceMemberStatuses).toEqual(["active", "invited"]);
  });
});
