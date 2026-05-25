import type { ConsentStatus } from "@/lib/customers/consent";

export type OpeningRecipientCandidate = {
  customerId: string;
  phoneE164: string;
  consentStatus: ConsentStatus;
  waitlistStatus: "active" | "paused" | "booked" | "removed";
  serviceId: string | null;
  alreadyOffered: boolean;
};

export function filterEligibleOpeningRecipients(
  candidates: OpeningRecipientCandidate[],
  openingServiceId: string | null
) {
  return candidates.filter((candidate) => {
    if (candidate.consentStatus !== "opted_in") {
      return false;
    }

    if (candidate.waitlistStatus !== "active") {
      return false;
    }

    if (candidate.alreadyOffered) {
      return false;
    }

    if (openingServiceId && candidate.serviceId !== openingServiceId) {
      return false;
    }

    return /^\+[1-9][0-9]{7,14}$/.test(candidate.phoneE164);
  });
}
