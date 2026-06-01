import { normalizePhoneToE164 } from "@/lib/customers/phone";
import type { Database } from "@/types/database";

type SmsConsentStatus =
  | Database["public"]["Enums"]["sms_consent_status"]
  | "missing";

export type WaitlistSmsEligibility =
  | "Eligible"
  | "Needs consent"
  | "Opted out"
  | "Invalid phone";

export function getWaitlistSmsEligibility({
  consentStatus,
  phone
}: {
  consentStatus: SmsConsentStatus;
  phone: string;
}): WaitlistSmsEligibility {
  if (!normalizePhoneToE164(phone).ok) {
    return "Invalid phone";
  }

  if (consentStatus === "opted_out") {
    return "Opted out";
  }

  if (consentStatus !== "opted_in") {
    return "Needs consent";
  }

  return "Eligible";
}
