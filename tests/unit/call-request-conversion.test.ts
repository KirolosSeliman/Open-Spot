import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  canConvertRequest,
  isConversionComplete
} from "@/lib/book-call/conversion-types";
import { getSafeInternalRedirectPath } from "@/lib/auth/platform-admin";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("call request client conversion", () => {
  it("ships an additive conversion migration with atomic claim and bootstrap RPCs", () => {
    const migrationPath = join(
      process.cwd(),
      "supabase",
      "migrations",
      "20260624150000_book_call_request_client_conversion.sql"
    );

    expect(existsSync(migrationPath)).toBe(true);

    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain("conversion_status");
    expect(migration).toContain("source_request_id");
    expect(migration).toContain("claim_book_call_request_conversion");
    expect(migration).toContain("admin_bootstrap_organization_from_call_request");
    expect(migration).toContain("billing_status");
    expect(migration).toContain("'unpaid'");
    expect(migration).toContain("'inactive'");
    expect(migration).toContain("revoke all on function public.claim_book_call_request_conversion");
    expect(migration).toContain("grant execute on function public.claim_book_call_request_conversion");
  });

  it("exposes admin-only detail route and conversion actions", () => {
    const detailPage = source("src/app/admin/call-requests/[requestId]/page.tsx");
    const detailActions = source("src/app/admin/call-requests/[requestId]/actions.ts");
    const conversionLib = source("src/lib/book-call/conversion.ts");
    const adminClient = source("src/lib/supabase/admin.ts");

    expect(detailPage).toContain("requireCurrentPlatformAdmin");
    expect(detailPage).toContain("loadCallRequestDetail");
    expect(detailPage).toContain("notFound");
    expect(detailActions).toContain("convertCallRequestToClient");
    expect(detailActions).toContain("resendCallRequestInvitation");
    expect(conversionLib).toContain("inviteUserByEmail");
    expect(conversionLib).not.toContain("createUser(");
    expect(conversionLib).toContain("claim_book_call_request_conversion");
    expect(adminClient).toContain('"server-only"');
  });

  it("links business names to the detail page without breaking manual actions", () => {
    const table = source("src/components/admin/call-requests-table.tsx");
    const link = source("src/components/admin/business-name-link.tsx");

    expect(link).toContain("/admin/call-requests/");
    expect(table).toContain("BusinessNameLink");
    expect(table).toContain("mailto:");
    expect(table).toContain("updateBookCallRequestAction");
  });

  it("ships approved client signup and invite password flow", () => {
    const signupPage = source("src/app/signup/page.tsx");
    const authActions = source("src/lib/auth/actions.ts");
    const callbackRoute = source("src/app/auth/callback/route.ts");
    const setPasswordPage = source("src/app/auth/set-password/page.tsx");
    const conversionCard = source("src/components/admin/call-request-conversion-card.tsx");

    expect(signupPage).toContain("CreateAccountForm");
    expect(signupPage).toContain("Creez votre compte Open Spot");
    expect(authActions).toContain("Public signup is disabled");
    expect(callbackRoute).toContain("exchangeCodeForSession");
    expect(callbackRoute).toContain("getSafeInternalRedirectPath");
    expect(setPasswordPage).toContain("setPasswordAction");
    expect(setPasswordPage).toContain("Creez votre mot de passe");
    expect(conversionCard).toContain("Renvoyer l'email");
  });

  it("validates conversion eligibility from persisted request data", () => {
    const baseRequest = {
      email: "owner@example.com",
      business_name: "Salon Demo",
      conversion_status: "not_started",
      organization_id: null
    } as const;

    expect(canConvertRequest(baseRequest)).toBe(true);
    expect(canConvertRequest({ ...baseRequest, email: "bad" })).toBe(false);
    expect(
      canConvertRequest({
        ...baseRequest,
        conversion_status: "completed",
        organization_id: "00000000-0000-4000-8000-000000000001"
      })
    ).toBe(false);
    expect(
      isConversionComplete({
        conversion_status: "completed",
        organization_id: "00000000-0000-4000-8000-000000000001"
      })
    ).toBe(true);
  });

  it("rejects unsafe auth redirect targets", () => {
    expect(getSafeInternalRedirectPath("/auth/set-password")).toBe("/auth/set-password");
    expect(getSafeInternalRedirectPath("//evil.example")).toBeNull();
    expect(getSafeInternalRedirectPath("https://evil.example")).toBeNull();
  });
});
