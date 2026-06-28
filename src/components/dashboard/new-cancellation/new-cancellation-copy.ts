import type { DashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";

export type NewCancellationFormCopy = Pick<
  DashboardCopy["newCancellation"],
  | "detailsTitle"
  | "titleLabel"
  | "anyService"
  | "offer"
  | "offerPlaceholder"
  | "offerHelper"
  | "internalNote"
  | "submit"
  | "cancel"
>;

export type EligibleCustomersCopy = Pick<
  DashboardCopy["newCancellation"],
  | "eligibleCustomers"
  | "searchPlaceholder"
  | "smsAuthorized"
  | "criterion"
  | "emptyEligibleTitle"
  | "emptyEligibleDescription"
>;

export function pickNewCancellationFormCopy(
  copy: DashboardCopy["newCancellation"]
): NewCancellationFormCopy {
  return {
    detailsTitle: copy.detailsTitle,
    titleLabel: copy.titleLabel,
    anyService: copy.anyService,
    offer: copy.offer,
    offerPlaceholder: copy.offerPlaceholder,
    offerHelper: copy.offerHelper,
    internalNote: copy.internalNote,
    submit: copy.submit,
    cancel: copy.cancel
  };
}

export function pickEligibleCustomersCopy(
  copy: DashboardCopy["newCancellation"]
): EligibleCustomersCopy {
  return {
    eligibleCustomers: copy.eligibleCustomers,
    searchPlaceholder: copy.searchPlaceholder,
    smsAuthorized: copy.smsAuthorized,
    criterion: copy.criterion,
    emptyEligibleTitle: copy.emptyEligibleTitle,
    emptyEligibleDescription: copy.emptyEligibleDescription
  };
}

export function formatEligibleClientCount(count: number, locale: Locale) {
  if (locale === "fr") {
    return `${count} client${count === 1 ? "" : "s"}`;
  }

  return `${count} client${count === 1 ? "" : "s"}`;
}

export function formatEligibleCountFooter(count: number, locale: Locale) {
  if (locale === "fr") {
    return `${count} client${count === 1 ? "" : "s"} admissible${count === 1 ? "" : "s"}`;
  }

  return `${count} eligible client${count === 1 ? "" : "s"}`;
}
