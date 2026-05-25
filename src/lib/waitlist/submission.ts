import { normalizePhoneToE164 } from "@/lib/customers/phone";
import type { Locale } from "@/lib/i18n/types";

export const waitlistConsentCopy =
  "I agree to receive SMS about last-minute openings from this business and understand I can reply STOP to unsubscribe.";

export type WaitlistSubmissionInput = {
  organizationSlug: string;
  fullName: string;
  phone: string;
  preferredLanguage: string;
  serviceInterest?: string;
  preferredDays?: string;
  preferredTimeWindows?: string;
  discountInterest?: boolean;
  consentAccepted: boolean;
};

export type WaitlistSubmissionPayload = {
  organizationSlug: string;
  fullName: string;
  phoneE164: string;
  preferredLanguage: Locale;
  serviceInterest: string;
  preferredDays: string[];
  preferredTimeWindows: string[];
  discountInterest: boolean;
  consentText: string;
};

export function createWaitlistSubmissionPayload(
  input: WaitlistSubmissionInput
):
  | { ok: true; payload: WaitlistSubmissionPayload }
  | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const phone = normalizePhoneToE164(input.phone);

  if (!input.organizationSlug.trim()) {
    errors.push("Organization slug is required.");
  }

  if (!input.fullName.trim()) {
    errors.push("Full name is required.");
  }

  if (!phone.ok) {
    errors.push(phone.error);
  }

  if (!input.consentAccepted) {
    errors.push("SMS consent is required to join the waitlist.");
  }

  if (errors.length > 0 || !phone.ok) {
    return {
      ok: false,
      errors
    };
  }

  return {
    ok: true,
    payload: {
      organizationSlug: input.organizationSlug.trim(),
      fullName: input.fullName.trim(),
      phoneE164: phone.phoneE164,
      preferredLanguage: input.preferredLanguage === "fr" ? "fr" : "en",
      serviceInterest: input.serviceInterest?.trim() ?? "",
      preferredDays: splitList(input.preferredDays),
      preferredTimeWindows: splitList(input.preferredTimeWindows),
      discountInterest: Boolean(input.discountInterest),
      consentText: waitlistConsentCopy
    }
  };
}

function splitList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
