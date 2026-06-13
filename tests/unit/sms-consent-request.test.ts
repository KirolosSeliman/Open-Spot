import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  canSendConsentRequest,
  CONSENT_REQUEST_COOLDOWN_HOURS,
  CONSENT_REQUEST_MAX_ATTEMPTS,
  getCustomerFirstName,
  sanitizeSmsProviderError
} from "@/lib/sms/consent-request";

const consentRequestMigration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260613233000_sms_consent_requests.sql"
  ),
  "utf8"
);

describe("SMS consent request helper", () => {
  const now = new Date("2026-06-13T18:00:00.000Z");

  it("allows a first needs-consent request for a valid phone", () => {
    expect(
      canSendConsentRequest({
        consentStatus: "needs_consent",
        phoneE164: "+15142494425",
        previousRequests: [],
        now
      })
    ).toEqual({ ok: true });
  });

  it("blocks opted-in, opted-out, and invalid-phone recipients", () => {
    expect(
      canSendConsentRequest({
        consentStatus: "opted_in",
        phoneE164: "+15142494425",
        previousRequests: [],
        now
      })
    ).toMatchObject({ ok: false, reason: "opted_in" });

    expect(
      canSendConsentRequest({
        consentStatus: "opted_out",
        phoneE164: "+15142494425",
        previousRequests: [],
        now
      })
    ).toMatchObject({ ok: false, reason: "opted_out" });

    expect(
      canSendConsentRequest({
        consentStatus: "needs_consent",
        phoneE164: "5142494425",
        previousRequests: [],
        now
      })
    ).toMatchObject({ ok: false, reason: "invalid_phone" });
  });

  it("blocks a request inside the cooldown window", () => {
    const recent = new Date(
      now.getTime() - (CONSENT_REQUEST_COOLDOWN_HOURS - 1) * 60 * 60 * 1000
    ).toISOString();

    expect(
      canSendConsentRequest({
        consentStatus: "needs_consent",
        phoneE164: "+15142494425",
        previousRequests: [{ status: "sent", sent_at: recent, created_at: recent }],
        now
      })
    ).toMatchObject({ ok: false, reason: "cooldown" });
  });

  it("blocks after the lifetime attempt cap, including failed attempts", () => {
    const older = new Date(
      now.getTime() - (CONSENT_REQUEST_COOLDOWN_HOURS + 1) * 60 * 60 * 1000
    ).toISOString();
    const attempts = Array.from({ length: CONSENT_REQUEST_MAX_ATTEMPTS }, () => ({
      status: "failed",
      sent_at: null,
      created_at: older
    }));

    expect(
      canSendConsentRequest({
        consentStatus: "needs_consent",
        phoneE164: "+15142494425",
        previousRequests: attempts,
        now
      })
    ).toMatchObject({ ok: false, reason: "max_attempts" });
  });

  it("extracts a safe first name and redacts secret-shaped provider errors", () => {
    const previousToken = process.env.TWILIO_AUTH_TOKEN;
    process.env.TWILIO_AUTH_TOKEN = "secret-token-value";

    expect(getCustomerFirstName("  Kirolos Seliman  ")).toBe("Kirolos");
    expect(
      sanitizeSmsProviderError(
        new Error("Failed with secret-token-value and abcdefghijklmnopqrstuvwxyz123456")
      )
    ).not.toContain("secret-token-value");

    if (previousToken === undefined) {
      delete process.env.TWILIO_AUTH_TOKEN;
    } else {
      process.env.TWILIO_AUTH_TOKEN = previousToken;
    }
  });

  it("adds consent request storage with RLS through an additive migration", () => {
    expect(consentRequestMigration).toContain(
      "create table if not exists public.sms_consent_requests"
    );
    expect(consentRequestMigration).toContain(
      "alter table public.sms_consent_requests enable row level security"
    );
    expect(consentRequestMigration).toContain(
      "add column if not exists message_type"
    );
    expect(consentRequestMigration).toContain(
      "revoke all privileges on table public.sms_consent_requests from anon"
    );
    expect(consentRequestMigration).toContain("private.is_org_member");
    expect(consentRequestMigration).toContain("private.has_org_role");
    expect(consentRequestMigration).not.toMatch(
      /\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b|db reset|migration repair/i
    );
  });
});
