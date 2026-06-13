import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildCsv,
  buildCustomerExportCsv,
  buildImportTemplateCsv
} from "@/lib/import/export";

describe("client and template CSV exports", () => {
  it("escapes CSV values correctly", () => {
    expect(buildCsv([["Maya, Jr.", 'said "yes"', "line\nbreak"]])).toBe(
      '"Maya, Jr.","said ""yes""","line\nbreak"'
    );
  });

  it("exports empty customer files with headers", () => {
    expect(buildCustomerExportCsv([])).toContain(
      "full_name,phone,preferred_language,consent_status,source,created_at,updated_at"
    );
  });

  it("exports customer rows without internal ids", () => {
    const csv = buildCustomerExportCsv([
      {
        id: "customer-id",
        organization_id: "org-id",
        full_name: "Maya, Example",
        phone_e164: "+15145550123",
        email: null,
        preferred_language: "fr",
        notes: null,
        source: "manual",
        deleted_at: null,
        deleted_by_profile_id: null,
        deleted_reason: null,
        restored_at: null,
        restored_by_profile_id: null,
        deletion_metadata: {},
        created_at: "2026-05-29T00:00:00Z",
        updated_at: "2026-05-29T00:00:00Z",
        consentStatus: "opted_in"
      }
    ]);

    expect(csv).toContain('"Maya, Example"');
    expect(csv).not.toContain("customer-id");
    expect(csv).not.toContain("org-id");
  });

  it("builds the expected import template headers", () => {
    expect(buildImportTemplateCsv().split("\r\n")[0]).toBe(
      "full_name,phone,preferred_language,service_interest,consent_status,consent_source,consent_date,source"
    );
  });

  it("keeps client export scoped and server-authorized", () => {
    const routeSource = readFileSync(
      join(
        process.cwd(),
        "src",
        "app",
        "dashboard",
        "import",
        "export",
        "customers",
        "route.ts"
      ),
      "utf8"
    );

    expect(routeSource).toContain("getActiveOrganizationWorkspace");
    expect(routeSource).toContain("canManageCustomers");
    expect(routeSource).toContain("loadCustomersWithConsent");
    expect(routeSource).not.toContain("createSupabaseServiceClient");
  });
});
