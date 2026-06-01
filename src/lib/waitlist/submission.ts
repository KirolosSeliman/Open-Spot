import { normalizePhoneToE164 } from "@/lib/customers/phone";
import type { Locale } from "@/lib/i18n/types";
import {
  normalizeWaitlistSignupSource,
  type WaitlistSignupSource
} from "@/lib/waitlist/sources";

export const waitlistConsentCopy =
  "I agree to receive SMS alerts about last-minute openings from this business. I understand replying does not automatically confirm an appointment, the merchant must validate manually, message/data rates may apply, and I can reply STOP or ARRET to unsubscribe.";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type WaitlistSubmissionInput = {
  organizationSlug: string;
  fullName: string;
  phone: string;
  preferredLanguage: string;
  serviceInterest?: string;
  serviceIds?: string[];
  preferredDays?: string;
  preferredTimeWindows?: string;
  discountInterest?: boolean;
  consentAccepted: boolean;
  signupSource?: string;
};

export type WaitlistSubmissionPayload = {
  organizationSlug: string;
  fullName: string;
  phoneE164: string;
  preferredLanguage: Locale;
  serviceInterest: string;
  serviceIds: string[];
  preferredDays: string[];
  preferredTimeWindows: string[];
  discountInterest: boolean;
  consentAccepted: true;
  consentText: string;
  signupSource: WaitlistSignupSource;
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

  const serviceIds = uniqueNonEmpty(input.serviceIds);

  if (serviceIds.some((serviceId) => !uuidPattern.test(serviceId))) {
    errors.push("Selected service ids are invalid.");
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
      serviceIds,
      preferredDays: splitList(input.preferredDays),
      preferredTimeWindows: splitList(input.preferredTimeWindows),
      discountInterest: Boolean(input.discountInterest),
      consentAccepted: true,
      consentText: waitlistConsentCopy,
      signupSource: normalizeWaitlistSignupSource(input.signupSource)
    }
  };
}

function uniqueNonEmpty(values: string[] | undefined) {
  return Array.from(
    new Set((values ?? []).map((value) => value.trim()).filter(Boolean))
  );
}

function splitList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
