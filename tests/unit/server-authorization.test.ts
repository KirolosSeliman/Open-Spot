import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("server authorization", () => {
  it("requires role-aware authorization before dashboard writes", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "lib", "dashboard", "actions.ts"),
      "utf8"
    );

    expect(source).toContain("getActiveOrganizationWorkspace");
    expect(source).toContain("workspace.organization.role");
    expect(source).toContain("canManageServices");
    expect(source).toContain("canManageCustomers");
    expect(source).toContain("canValidateBookings");
    expect(source).not.toContain('formData.get("organizationId")');
  });

  it("requires customer-management permission for imports", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "lib", "import", "actions.ts"),
      "utf8"
    );

    expect(source).toContain("getActiveOrganizationWorkspace");
    expect(source).toContain("canManageCustomers");
    expect(source).toContain("workspace.organization.role");
    expect(source).toContain("organization_id: organizationId");
    expect(source).not.toContain('formData.get("organizationId")');
  });

  it("keeps service-role helpers out of private dashboard server actions", () => {
    for (const path of [
      join(process.cwd(), "src", "lib", "dashboard", "actions.ts"),
      join(process.cwd(), "src", "lib", "import", "actions.ts")
    ]) {
      const source = readFileSync(path, "utf8");

      expect(source).not.toContain("createSupabaseServiceClient");
      expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    }
  });
});
