import type { WaitlistSmsEligibility } from "@/lib/waitlist/eligibility";

export type WaitlistFilterValues = {
  search?: string;
  status?: string;
  serviceId?: string;
  consent?: string;
  source?: string;
  language?: string;
  discountInterest?: string;
};

export type FilterableWaitlistEntry = {
  organization_id: string;
  status: string;
  service_id: string | null;
  serviceInterestIds: string[];
  consentStatus: string;
  source: string;
  customerSource: string;
  customerLanguage: string;
  customerName: string;
  customerPhone: string;
  discount_interest: boolean;
  smsEligibility: WaitlistSmsEligibility;
};

export function filterWaitlistEntries<T extends FilterableWaitlistEntry>(
  entries: T[],
  filters: WaitlistFilterValues
) {
  const search = filters.search?.trim().toLowerCase() ?? "";

  return entries.filter((entry) => {
    if (search) {
      const searchableText = `${entry.customerName} ${entry.customerPhone}`
        .toLowerCase()
        .trim();

      if (!searchableText.includes(search)) {
        return false;
      }
    }

    if (filters.status && entry.status !== filters.status) {
      return false;
    }

    if (
      filters.serviceId &&
      entry.service_id !== filters.serviceId &&
      !entry.serviceInterestIds.includes(filters.serviceId)
    ) {
      return false;
    }

    if (filters.consent && entry.consentStatus !== filters.consent) {
      return false;
    }

    if (
      filters.source &&
      entry.source !== filters.source &&
      entry.customerSource !== filters.source
    ) {
      return false;
    }

    if (filters.language && entry.customerLanguage !== filters.language) {
      return false;
    }

    if (filters.discountInterest === "yes" && !entry.discount_interest) {
      return false;
    }

    if (filters.discountInterest === "no" && entry.discount_interest) {
      return false;
    }

    return true;
  });
}
