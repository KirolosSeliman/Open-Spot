import "server-only";

import { defaultBillingTerms, type FilledSpotForBilling } from "@/lib/admin/billing-terms";
import { loadOrganizationBillingTerms } from "@/lib/admin/organization-billing";
import { calculateSubscriptionTotals } from "@/lib/billing/subscription-calculations";
import { formatSubscriptionMoney } from "@/lib/billing/subscription-format";
import {
  buildSubscriptionMonthOptions,
  buildSubscriptionYearOptions,
  formatSubscriptionMonthLabel,
  getOrganizationRegistrationBounds,
  getSubscriptionMonthWindow,
  parseSubscriptionSelection,
  type OrganizationRegistrationBounds,
  type SubscriptionMonthOption,
  type SubscriptionYearOption
} from "@/lib/billing/subscription-months";
import {
  loadManualBillingForOrganization,
  type ManualBillingSummary
} from "@/lib/billing/manual-billing-data";
import { assertDashboardOrganizationId } from "@/lib/dashboard/real-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/types";

type BookingRow = {
  id: string;
  selected_offer_id: string | null;
  status: string;
  recovered_value_cents: number | null;
  confirmed_at: string | null;
  updated_at: string;
};

export type SubscriptionPageData = {
  locale: Locale;
  timezone: string;
  selectedMonth: {
    key: string;
    year: number;
    month: number;
    label: string;
  };
  monthOptions: SubscriptionMonthOption[];
  yearOptions: SubscriptionYearOption[];
  registrationBounds: OrganizationRegistrationBounds;
  billingConfigured: boolean;
  termsMissing: boolean;
  loadError: boolean;
  manualBilling: ManualBillingSummary | null;
  totals: ReturnType<typeof calculateSubscriptionTotals>;
  currency: string;
  filledSpots: FilledSpotForBilling[];
  warnings: string[];
};

function getEffectiveBookingDate(booking: BookingRow) {
  return booking.confirmed_at ?? booking.updated_at;
}

function isBookingInRange(
  booking: BookingRow,
  startIso: string,
  endIso: string
) {
  const effectiveDate = getEffectiveBookingDate(booking);

  return effectiveDate >= startIso && effectiveDate < endIso;
}

async function loadOrganizationRegisteredAt(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("created_at")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.created_at ?? new Date().toISOString();
}

function buildPeriodOptions({
  registeredAt,
  timezone,
  locale,
  monthKey
}: {
  registeredAt: string;
  timezone: string;
  locale: "fr" | "en";
  monthKey?: string | null;
}) {
  const bounds = getOrganizationRegistrationBounds({
    registeredAt,
    timezone
  });
  const selected = parseSubscriptionSelection({
    monthKey,
    registeredAt,
    timezone
  });

  return {
    bounds,
    selected,
    monthOptions: buildSubscriptionMonthOptions({
      activeKey: selected.key,
      selectedYear: selected.year,
      bounds,
      locale,
      timezone
    }),
    yearOptions: buildSubscriptionYearOptions({
      bounds,
      activeYear: selected.year,
      activeMonth: selected.month
    })
  };
}

export async function loadSubscriptionPageData({
  organizationId,
  timezone,
  locale,
  monthKey
}: {
  organizationId: string;
  timezone: string;
  locale: Locale;
  monthKey?: string | null;
}): Promise<SubscriptionPageData> {
  assertDashboardOrganizationId(organizationId);

  const registeredAt = await loadOrganizationRegisteredAt(organizationId);
  const { bounds, selected, monthOptions, yearOptions } = buildPeriodOptions({
    registeredAt,
    timezone,
    locale: locale === "fr" ? "fr" : "en",
    monthKey
  });
  const monthWindow = getSubscriptionMonthWindow({
    year: selected.year,
    month: selected.month,
    timezone
  });
  const intlLocale = locale === "fr" ? "fr" : "en";

  const [billingTermsResult, manualBilling, bookingsResult] = await Promise.all([
    loadOrganizationBillingTerms(organizationId).catch(() => ({
      row: null,
      terms: defaultBillingTerms
    })),
    loadManualBillingForOrganization(organizationId).catch(() => null),
    (async () => {
      const supabase = await createSupabaseServerClient();

      return supabase
        .from("booking_requests")
        .select(
          "id, selected_offer_id, status, recovered_value_cents, confirmed_at, updated_at"
        )
        .eq("organization_id", organizationId)
        .in("status", ["confirmed", "completed"]);
    })()
  ]);

  if (bookingsResult.error) {
    throw new Error(bookingsResult.error.message);
  }

  const bookings = (bookingsResult.data ?? []) as BookingRow[];
  const monthBookings = bookings.filter((booking) =>
    isBookingInRange(booking, monthWindow.startIso, monthWindow.endIso)
  );
  const filledSpots: FilledSpotForBilling[] = monthBookings.map((booking) => ({
    id: booking.id,
    recoveredValueCents: booking.recovered_value_cents
  }));
  const terms = billingTermsResult.terms;
  const currency = terms.currency || manualBilling?.currency || "CAD";
  const formatMoney = (cents: number) =>
    formatSubscriptionMoney(cents, currency, intlLocale);
  const totals = calculateSubscriptionTotals({
    terms,
    recoveredReservationsCount: monthBookings.length,
    filledSpots,
    formatMoney
  });
  const termsMissing = !billingTermsResult.row;
  const billingConfigured =
    Boolean(billingTermsResult.row) ||
    Boolean(manualBilling) ||
    terms.monthlySubscriptionCents > 0 ||
    terms.filledSpotFixedFeeCents > 0 ||
    terms.filledSpotFeeMode !== "none";

  const warnings = [...totals.warnings];

  if (termsMissing) {
    warnings.push(
      locale === "fr"
        ? "Les frais fixes mensuels ne sont pas encore configurés dans l’admin."
        : "Monthly fixed fees are not configured in admin yet."
    );
  }

  return {
    locale,
    timezone,
    selectedMonth: {
      key: selected.key,
      year: selected.year,
      month: selected.month,
      label: formatSubscriptionMonthLabel({
        year: selected.year,
        month: selected.month,
        locale: intlLocale
      })
    },
    monthOptions,
    yearOptions,
    registrationBounds: bounds,
    billingConfigured,
    termsMissing,
    loadError: false,
    manualBilling,
    totals,
    currency,
    filledSpots,
    warnings
  };
}

export function getSubscriptionEmptyData({
  locale,
  timezone,
  monthKey,
  registeredAt
}: {
  locale: Locale;
  timezone: string;
  monthKey?: string | null;
  registeredAt?: string;
}): SubscriptionPageData {
  const intlLocale = locale === "fr" ? "fr" : "en";
  const registrationDate = registeredAt ?? new Date().toISOString();
  const { bounds, selected, monthOptions, yearOptions } = buildPeriodOptions({
    registeredAt: registrationDate,
    timezone,
    locale: intlLocale,
    monthKey
  });
  const currency = "CAD";
  const formatMoney = (cents: number) =>
    formatSubscriptionMoney(cents, currency, intlLocale);

  return {
    locale,
    timezone,
    selectedMonth: {
      key: selected.key,
      year: selected.year,
      month: selected.month,
      label: formatSubscriptionMonthLabel({
        year: selected.year,
        month: selected.month,
        locale: intlLocale
      })
    },
    monthOptions,
    yearOptions,
    registrationBounds: bounds,
    billingConfigured: false,
    termsMissing: true,
    loadError: false,
    manualBilling: null,
    totals: calculateSubscriptionTotals({
      terms: defaultBillingTerms,
      recoveredReservationsCount: 0,
      filledSpots: [],
      formatMoney
    }),
    currency,
    filledSpots: [],
    warnings: []
  };
}
