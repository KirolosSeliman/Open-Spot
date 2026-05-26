import { describe, expect, it } from "vitest";

import {
  buildOrganizationCreateInput,
  decideWorkspaceRedirect,
  normalizeOrganizationSlug
} from "@/lib/organization/onboarding";

describe("organization onboarding", () => {
  it("normalizes slugs to match the database constraint", () => {
    expect(normalizeOrganizationSlug(" Salon Beauté Laval!! ")).toBe(
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
        phone: "514-555-0100",
        timezone: "America/Toronto",
        defaultLanguage: "fr"
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
});
