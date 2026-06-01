import type { WaitlistSubmissionPayload } from "@/lib/waitlist/submission";

export function buildWaitlistSignupRpcArgs(payload: WaitlistSubmissionPayload) {
  return {
    organization_slug: payload.organizationSlug,
    customer_full_name: payload.fullName,
    customer_phone_e164: payload.phoneE164,
    customer_preferred_language: payload.preferredLanguage,
    service_interest: payload.serviceInterest,
    preferred_days: payload.preferredDays,
    preferred_time_windows: payload.preferredTimeWindows,
    wants_discount: payload.discountInterest,
    consent_accepted: payload.consentAccepted,
    consent_copy: payload.consentText,
    signup_source: payload.signupSource,
    service_ids: payload.serviceIds
  };
}
