import type { ConsentStatus } from "@/lib/customers/consent";

export type OpeningRecipientCandidate = {
  customerId: string;
  phoneE164: string;
  consentStatus: ConsentStatus;
  waitlistStatus: "active" | "paused" | "booked" | "removed";
  serviceId: string | null;
  serviceInterestIds?: string[];
  alreadyOffered: boolean;
};

export function filterEligibleOpeningRecipients(
  candidates: OpeningRecipientCandidate[],
  openingServiceId: string | null
) {
  const returnedCustomerIds = new Set<string>();
  const eligibleCandidates = candidates.filter((candidate) => {
    if (candidate.consentStatus !== "opted_in") {
      return false;
    }

    if (candidate.waitlistStatus !== "active") {
      return false;
    }

    if (candidate.alreadyOffered) {
      return false;
    }

    const serviceInterestIds = candidate.serviceInterestIds ?? [];
    const hasSpecificInterests = serviceInterestIds.length > 0;
    const matchesSelectedService = openingServiceId
      ? serviceInterestIds.includes(openingServiceId) ||
        candidate.serviceId === openingServiceId
      : true;

    if (openingServiceId && hasSpecificInterests && !matchesSelectedService) {
      return false;
    }

    if (
      openingServiceId &&
      !hasSpecificInterests &&
      candidate.serviceId &&
      candidate.serviceId !== openingServiceId
    ) {
      return false;
    }

    return /^\+[1-9][0-9]{7,14}$/.test(candidate.phoneE164);
  });

  return eligibleCandidates.filter((candidate) => {
    if (returnedCustomerIds.has(candidate.customerId)) {
      return false;
    }

    returnedCustomerIds.add(candidate.customerId);
    return true;
  });
}
