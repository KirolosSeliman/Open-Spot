import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildOrganizationCreateInput,
  decideWorkspaceRedirect,
  normalizeOrganizationSlug
} from "@/lib/organization/onboarding";

describe("organization onboarding", () => {
  it("normalizes slugs to match the database constraint", () => {
    expect(normalizeOrganizationSlug(" Salon Beaute Laval!! ")).toBe(
      "salon-beaute-laval"
    );
  });

  it("builds a safe organization payload from form-like input", () => {
    expect(
      buildOrganizationCreateInput({
        name: "Salon Demo",
        slug: "",
        email: " owner@example.com ",
        phone: "514-555-0100",
        timezone: "",
        defaultLanguage: "fr"
      })
    ).toEqual({
      ok: true,
      value: {
        name: "Salon Demo",
        slug: "salon-demo",
        email: "owner@example.com",
        phone: "+15145550100",
        timezone: "America/Toronto",
        defaultLanguage: "fr"
      }
    });
  });

  it("keeps organization phone optional and normalizes common local formats", () => {
    expect(
      buildOrganizationCreateInput({
        name: "Salon Demo",
        phone: "",
        defaultLanguage: "fr"
      })
    ).toMatchObject({
      ok: true,
      value: {
        phone: null
      }
    });

    expect(
      buildOrganizationCreateInput({
        name: "Salon Demo",
        phone: "5142494425",
        defaultLanguage: "fr"
      })
    ).toMatchObject({
      ok: true,
      value: {
        phone: "+15142494425"
      }
    });

    expect(
      buildOrganizationCreateInput({
        name: "Salon Demo",
        phone: "514-249-4425",
        defaultLanguage: "fr"
      })
    ).toMatchObject({
      ok: true,
      value: {
        phone: "+15142494425"
      }
    });
  });

  it("rejects invalid names and slugs before database writes", () => {
    expect(
      buildOrganizationCreateInput({
        name: "",
        slug: "---",
        defaultLanguage: "en"
      })
    ).toEqual({
      ok: false,
      errors: ["Business name is required.", "Slug is required."]
    });
  });

  it("rejects invalid organization contact and locale data", () => {
    expect(
      buildOrganizationCreateInput({
        name: "Salon Demo",
        slug: "Salon Demo",
        email: "owner@",
        phone: "123",
        timezone: "Europe/Paris",
        defaultLanguage: "es"
      })
    ).toEqual({
      ok: false,
      errors: [
        "Business email must be valid if provided.",
        "Enter a valid 10-digit Canadian or US phone number.",
        "Timezone is not supported yet.",
        "Default language must be English or French."
      ]
    });
  });

  it("decides workspace redirects without exposing protected pages", () => {
    expect(decideWorkspaceRedirect({ isConfigured: false })).toBe("allow");
    expect(decideWorkspaceRedirect({ isConfigured: true, hasUser: false })).toBe(
      "/sign-in"
    );
    expect(
      decideWorkspaceRedirect({
        isConfigured: true,
        hasUser: true,
        hasOrganization: false
      })
    ).toBe("/onboarding");
    expect(
      decideWorkspaceRedirect({
        isConfigured: true,
        hasUser: true,
        hasOrganization: true
      })
    ).toBe("allow");
  });

  it("only treats active organization memberships as workspace access", () => {
    const currentOrganizationSource = readFileSync(
      join(process.cwd(), "src", "lib", "organization", "current.ts"),
      "utf8"
    );

    expect(currentOrganizationSource).toContain('.eq("status", "active")');
  });
});
