import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildOrganizationCreateInput,
  decideWorkspaceRedirect,
  normalizeOrganizationSlug
} from "@/lib/organization/onboarding";
import {
  parseOnboardingFormData,
  onboardingServicesToJson
} from "@/lib/organization/client-onboarding";
import {
  generateOnboardingToken,
  hashOnboardingToken
} from "@/lib/organization/onboarding-tokens";
import { evaluateOrganizationSmsReadiness } from "@/lib/sms/organization-gate";

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

  it("hashes onboarding tokens without storing the raw value", () => {
    const token = generateOnboardingToken();
    const hash = hashOnboardingToken(token);

    expect(token).not.toBe(hash);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashOnboardingToken(token)).toBe(hash);
  });

  it("validates client onboarding data before final submission", () => {
    const formData = new FormData();

    formData.set("businessName", "Lunera Studio");
    formData.set("businessType", "Salon");
    formData.set("publicContactEmail", "hello@example.com");
    formData.set("publicContactPhone", "514-555-0100");
    formData.set("responsibleName", "Sophie Tremblay");
    formData.set("responsibleRole", "Owner");
    formData.set("responsibleEmail", "sophie@example.com");
    formData.set("service_0_name", "Facial");
    formData.set("service_0_duration", "60");
    formData.set("service_0_value", "120");
    formData.set("averageAppointmentValue", "120");
    formData.set("currency", "CAD");
    formData.set("smsLanguage", "fr");
    formData.set("smsTone", "warm");
    formData.set("smsQuietHoursStart", "20:00");
    formData.set("smsQuietHoursEnd", "08:00");
    formData.set("consentStatementAccepted", "on");
    formData.set("consentResponsibleName", "Sophie Tremblay");

    expect(parseOnboardingFormData(formData, { requireConsent: true })).toEqual({
      ok: true,
      value: expect.objectContaining({
        businessName: "Lunera Studio",
        publicContactPhone: "+15145550100",
        averageAppointmentValueCents: 12000,
        services: [
          {
            name: "Facial",
            durationMinutes: 60,
            valueCents: 12000
          }
        ],
        consentStatementAccepted: true
      })
    });

    expect(
      onboardingServicesToJson([
        {
          name: "Facial",
          durationMinutes: 60,
          valueCents: 12000
        }
      ])
    ).toEqual([
      {
        name: "Facial",
        durationMinutes: 60,
        valueCents: 12000
      }
    ]);
  });

  it("rejects final onboarding submission without SMS compliance consent", () => {
    const formData = new FormData();
    formData.set("businessName", "Lunera Studio");
    formData.set("businessType", "Salon");
    formData.set("responsibleName", "Sophie Tremblay");
    formData.set("responsibleRole", "Owner");
    formData.set("responsibleEmail", "sophie@example.com");
    formData.set("service_0_name", "Facial");
    formData.set("service_0_duration", "60");
    formData.set("service_0_value", "120");
    formData.set("averageAppointmentValue", "120");

    const result = parseOnboardingFormData(formData, { requireConsent: true });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain(
        "SMS compliance consent must be accepted before submission."
      );
    }
  });

  it("keeps the SMS gate closed until onboarding, billing, and SMS status are all ready", () => {
    expect(
      evaluateOrganizationSmsReadiness({
        onboardingStatus: "completed",
        billingStatus: "paid",
        smsStatus: "active"
      })
    ).toMatchObject({
      canSendSms: true,
      blockingReasons: []
    });

    expect(
      evaluateOrganizationSmsReadiness({
        onboardingStatus: "submitted",
        billingStatus: "paid",
        smsStatus: "active"
      })
    ).toMatchObject({
      canSendSms: false,
      blockingReasons: ["Client onboarding is not completed."]
    });

    expect(
      evaluateOrganizationSmsReadiness({
        onboardingStatus: "completed",
        billingStatus: "trial",
        smsStatus: "pending_setup"
      }).blockingReasons
    ).toEqual(["Billing status is not paid.", "SMS status is not active."]);

    for (const billingStatus of [
      "unpaid",
      "payment_link_sent",
      "past_due",
      "cancelled"
    ]) {
      expect(
        evaluateOrganizationSmsReadiness({
          onboardingStatus: "completed",
          billingStatus,
          smsStatus: "active"
        })
      ).toMatchObject({
        canSendSms: false,
        blockingReasons: ["Billing status is not paid."]
      });
    }
  });

  it("adds onboarding persistence without anonymous table access", () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        "supabase",
        "migrations",
        "20260624110000_client_onboarding_and_sms_gate.sql"
      ),
      "utf8"
    );

    expect(migration).toContain(
      "create table if not exists public.organization_onboarding_submissions"
    );
    expect(migration).toContain("token_hash");
    expect(migration).toContain("revoke all privileges");
    expect(migration).toContain("add column if not exists sms_status");
  });
});
