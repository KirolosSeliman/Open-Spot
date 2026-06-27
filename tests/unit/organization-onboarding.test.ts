import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { canBillingStatusSendSms } from "@/lib/billing/manual-billing";
import {
  buildOrganizationCreateInput,
  decideWorkspaceRedirect,
  normalizeOrganizationSlug
} from "@/lib/organization/onboarding";
import { evaluateOrganizationSmsReadiness } from "@/lib/sms/organization-gate";

describe("organization setup", () => {
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
    ).toBe("/sign-in?notice=no_workspace");
    expect(
      decideWorkspaceRedirect({
        isConfigured: true,
        hasUser: true,
        hasOrganization: true
      })
    ).toBe("allow");
  });

  it("only treats active or invited organization memberships as workspace access", () => {
    const currentOrganizationSource = readFileSync(
      join(process.cwd(), "src", "lib", "organization", "current.ts"),
      "utf8"
    );

    expect(currentOrganizationSource).toContain('in("status", workspaceMemberStatuses)');
  });
});

describe("organization SMS readiness", () => {
  it("allows paid, trial, and comped billing statuses for SMS", () => {
    for (const billingStatus of ["paid", "trial", "comped"] as const) {
      expect(canBillingStatusSendSms(billingStatus)).toBe(true);
    }

    for (const billingStatus of [
      "unpaid",
      "payment_link_sent",
      "past_due",
      "cancelled"
    ] as const) {
      expect(canBillingStatusSendSms(billingStatus)).toBe(false);
    }
  });

  it("keeps the SMS gate closed until billing is authorized and sms_status is active", () => {
    expect(
      evaluateOrganizationSmsReadiness({
        billingStatus: "paid",
        smsStatus: "active"
      })
    ).toMatchObject({
      canSendSms: true,
      blockingReasons: []
    });

    expect(
      evaluateOrganizationSmsReadiness({
        billingStatus: "trial",
        smsStatus: "active"
      })
    ).toMatchObject({
      canSendSms: true,
      blockingReasons: []
    });

    expect(
      evaluateOrganizationSmsReadiness({
        billingStatus: "paid",
        smsStatus: "inactive"
      })
    ).toMatchObject({
      canSendSms: false,
      blockingReasons: ["SMS status is not active for this company."]
    });

    for (const billingStatus of [
      "unpaid",
      "payment_link_sent",
      "past_due",
      "cancelled"
    ]) {
      expect(
        evaluateOrganizationSmsReadiness({
          billingStatus,
          smsStatus: "active"
        })
      ).toMatchObject({
        canSendSms: false,
        blockingReasons: ["Billing is not authorized for SMS sending."]
      });
    }
  });

  it("does not query organization_onboarding_submissions in the SMS gate", () => {
    const gateSource = readFileSync(
      join(process.cwd(), "src", "lib", "sms", "organization-gate.ts"),
      "utf8"
    );

    expect(gateSource).not.toContain("organization_onboarding_submissions");
    expect(gateSource).not.toContain("Client onboarding is not completed.");
  });
});
