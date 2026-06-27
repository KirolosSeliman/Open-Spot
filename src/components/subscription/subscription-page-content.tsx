import {
  SubscriptionBillingDetails,
  SubscriptionInfoBox,
  SubscriptionMetricCard,
  SubscriptionTotalCard
} from "@/components/subscription/subscription-billing-cards";
import {
  SubscriptionCalendarIcon,
  SubscriptionChartIcon,
  SubscriptionCreditCardIcon,
  SubscriptionInfoIcon,
  SubscriptionTagIcon,
  SubscriptionWalletIcon
} from "@/components/subscription/subscription-icons";
import {
  SubscriptionMonthSelector,
  SubscriptionMonthSelectorMobile
} from "@/components/subscription/subscription-month-selector";
import { SubscriptionHero } from "@/components/subscription/subscription-hero";
import { SubscriptionManualBillingPanel } from "@/components/subscription/subscription-manual-billing-panel";
import { getBillingStatusLabel } from "@/lib/billing/manual-billing";
import { formatSubscriptionMoney } from "@/lib/billing/subscription-format";
import type { SubscriptionPageData } from "@/lib/billing/subscription-data";

function getInvoiceStatusLabel(
  billingStatus: string | null | undefined,
  locale: SubscriptionPageData["locale"]
) {
  if (!billingStatus) {
    return locale === "fr" ? "À facturer" : "To invoice";
  }

  if (billingStatus === "paid" || billingStatus === "comped") {
    return getBillingStatusLabel(billingStatus, locale);
  }

  return locale === "fr" ? "À facturer" : "To invoice";
}

function getCopy(locale: SubscriptionPageData["locale"]) {
  return locale === "fr"
    ? {
        title: "Abonnement",
        description:
          "Résumé de votre abonnement mensuel et de la facturation des commissions basée sur les réservations récupérées.",
        months: "Mois",
        fixedFees: "Frais fixes mensuels",
        fixedFeesDetail: "Défini dans l’admin pour cette compagnie",
        recovered: "Réservations récupérées",
        unitCommission: "Commission unitaire",
        totalCommission: "Commission totale",
        monthlyTotal: "Total du mois",
        detailsTitle: "Détail de la facturation",
        infoLines: [
          "Le frais fixe mensuel est configuré dans le compte admin de votre organisation.",
          "La commission totale est calculée automatiquement selon le nombre de réservations récupérées."
        ],
        noSubscription:
          "Aucun abonnement configuré pour cette compagnie.",
        noRecovered:
          "Aucun rendez-vous récupéré pour ce mois.",
        loadError:
          "Impossible de charger les informations d’abonnement pour le moment.",
        noFixedFee:
          "Les frais fixes mensuels ne sont pas encore configurés dans l’admin."
      }
    : {
        title: "Subscription",
        description:
          "Summary of your monthly subscription and commission billing based on recovered reservations.",
        months: "Month",
        fixedFees: "Monthly fixed fees",
        fixedFeesDetail: "Defined in admin for this company",
        recovered: "Recovered reservations",
        unitCommission: "Unit commission",
        totalCommission: "Total commission",
        monthlyTotal: "Monthly total",
        detailsTitle: "Billing details",
        infoLines: [
          "The monthly fixed fee is configured in your organization admin account.",
          "Total commission is calculated automatically from recovered reservations."
        ],
        noSubscription: "No subscription configured for this company.",
        noRecovered: "No recovered appointments for this month.",
        loadError: "Unable to load subscription information right now.",
        noFixedFee: "Monthly fixed fees are not configured in admin yet."
      };
}

export function SubscriptionPageContent({ data }: { data: SubscriptionPageData }) {
  const copy = getCopy(data.locale);
  const intlLocale = data.locale === "fr" ? "fr" : "en";
  const formatMoney = (cents: number) =>
    formatSubscriptionMoney(cents, data.currency, intlLocale);
  const { totals } = data;
  const statusLabel = getInvoiceStatusLabel(
    data.manualBilling?.billingStatus,
    data.locale
  );
  const fixedFeeValue = formatMoney(totals.monthlyFixedFeeCents);
  const fixedFeeDetail = data.termsMissing
    ? copy.noFixedFee
    : copy.fixedFeesDetail;
  const unitCommissionValue = formatMoney(totals.unitCommissionCents);

  return (
    <div className="grid gap-6 lg:gap-8">
      <SubscriptionHero description={copy.description} title={copy.title} />

      {data.loadError ? (
        <SubscriptionInfoBox
          icon={<SubscriptionInfoIcon className="h-5 w-5" />}
          lines={[copy.loadError]}
        />
      ) : null}

      <SubscriptionMonthSelectorMobile months={data.monthOptions} title={copy.months} />

      <div className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)] xl:gap-8">
        <div className="hidden xl:block">
          <SubscriptionMonthSelector months={data.monthOptions} title={copy.months} />
        </div>

        <div className="grid gap-6">
          {!data.billingConfigured ? (
            <SubscriptionInfoBox
              icon={<SubscriptionInfoIcon className="h-5 w-5" />}
              lines={[copy.noSubscription]}
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <SubscriptionMetricCard
              detail={fixedFeeDetail}
              icon={<SubscriptionCreditCardIcon className="h-5 w-5" />}
              label={copy.fixedFees}
              value={fixedFeeValue}
            />
            <SubscriptionMetricCard
              detail={
                totals.recoveredReservationsCount === 0 ? copy.noRecovered : null
              }
              icon={<SubscriptionCalendarIcon className="h-5 w-5" />}
              label={copy.recovered}
              value={String(totals.recoveredReservationsCount)}
            />
            <SubscriptionMetricCard
              icon={<SubscriptionTagIcon className="h-5 w-5" />}
              label={copy.unitCommission}
              value={unitCommissionValue}
            />
            <SubscriptionMetricCard
              detail={totals.commissionFormula}
              icon={<SubscriptionChartIcon className="h-5 w-5" />}
              label={copy.totalCommission}
              value={formatMoney(totals.totalCommissionCents)}
            />
          </div>

          <SubscriptionTotalCard
            icon={<SubscriptionWalletIcon className="h-7 w-7" />}
            label={copy.monthlyTotal}
            value={formatMoney(totals.monthlyTotalCents)}
          />

          <SubscriptionBillingDetails
            monthLabel={data.selectedMonth.label}
            rows={[
              {
                icon: <SubscriptionCreditCardIcon className="h-4 w-4" />,
                label: copy.fixedFees,
                value: fixedFeeValue
              },
              {
                icon: <SubscriptionCalendarIcon className="h-4 w-4" />,
                label: copy.recovered,
                value: String(totals.recoveredReservationsCount)
              },
              {
                icon: <SubscriptionTagIcon className="h-4 w-4" />,
                label: copy.unitCommission,
                value: unitCommissionValue
              },
              {
                icon: <SubscriptionChartIcon className="h-4 w-4" />,
                label: copy.totalCommission,
                value: formatMoney(totals.totalCommissionCents)
              },
              {
                icon: <SubscriptionWalletIcon className="h-4 w-4" />,
                label: copy.monthlyTotal,
                value: formatMoney(totals.monthlyTotalCents),
                emphasis: true
              }
            ]}
            statusLabel={statusLabel}
            title={copy.detailsTitle}
          />

          <SubscriptionInfoBox
            icon={<SubscriptionInfoIcon className="h-5 w-5" />}
            lines={[
              ...copy.infoLines,
              ...data.warnings.filter(
                (warning) => !copy.infoLines.includes(warning)
              )
            ]}
          />

          {data.manualBilling ? (
            <SubscriptionManualBillingPanel
              billing={data.manualBilling}
              locale={data.locale}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
