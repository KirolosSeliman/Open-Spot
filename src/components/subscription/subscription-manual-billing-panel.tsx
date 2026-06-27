import {
  getBillingIntervalLabel,
  getBillingStatusLabel,
  getPaymentMethodLabel
} from "@/lib/billing/manual-billing";
import { formatSubscriptionDate, formatSubscriptionMoney } from "@/lib/billing/subscription-format";
import type { ManualBillingSummary } from "@/lib/billing/manual-billing-data";
import type { Locale } from "@/lib/i18n/types";

export function SubscriptionManualBillingPanel({
  billing,
  locale
}: {
  billing: ManualBillingSummary;
  locale: Locale;
}) {
  const intlLocale = locale === "fr" ? "fr" : "en";
  const copy =
    locale === "fr"
      ? {
          title: "Statut du paiement",
          plan: "Plan actuel",
          status: "Statut",
          renewal: "Prochaine échéance",
          periodEnd: "Fin de période",
          method: "Méthode",
          externalLinkStored: "Lien externe enregistré",
          noLink: "Aucun lien",
          notAvailable: "Non disponible",
          manualMode:
            "Mode de facturation manuel : l’équipe Open Spot confirme le paiement après validation dans Stripe, Interac ou une méthode externe.",
          locked:
            "Vous ne pouvez pas modifier votre statut de paiement depuis le dashboard."
        }
      : {
          title: "Payment status",
          plan: "Current plan",
          status: "Status",
          renewal: "Next payment due",
          periodEnd: "Period end",
          method: "Method",
          externalLinkStored: "External link stored",
          noLink: "No link",
          notAvailable: "N/A",
          manualMode:
            "Manual billing mode: the Open Spot team confirms payment after it is validated in Stripe, Interac, or another external method.",
          locked: "You cannot update your payment status from the dashboard."
        };

  const items = [
    {
      label: copy.plan,
      value: billing.planName,
      detail: formatSubscriptionMoney(
        billing.monthlyPriceCents,
        billing.currency,
        intlLocale
      )
    },
    {
      label: copy.status,
      value: getBillingStatusLabel(billing.billingStatus, locale),
      detail: getBillingIntervalLabel(billing.billingInterval, locale)
    },
    {
      label: copy.renewal,
      value: formatSubscriptionDate(
        billing.nextPaymentDueAt,
        intlLocale,
        copy.notAvailable
      ),
      detail: `${copy.periodEnd}: ${formatSubscriptionDate(
        billing.currentPeriodEnd,
        intlLocale,
        copy.notAvailable
      )}`
    },
    {
      label: copy.method,
      value: getPaymentMethodLabel(billing.paymentMethod, locale),
      detail: billing.externalPaymentUrl
        ? copy.externalLinkStored
        : copy.noLink
    }
  ];

  return (
    <section className="rounded-[20px] border border-[#dde5f0] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
      <h2 className="text-lg font-black text-[#07142f]">{copy.title}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            className="rounded-[16px] border border-[#e8eef5] bg-[#fbfbfd] p-4"
            key={item.label}
          >
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">
              {item.label}
            </p>
            <p className="mt-2 text-lg font-black text-[#07142f]">{item.value}</p>
            <p className="mt-1 text-sm leading-6 text-[#64748b]">{item.detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-2 text-sm leading-6 text-[#64748b]">
        <p>{copy.manualMode}</p>
        <p className="font-bold text-[#07142f]">{copy.locked}</p>
        {billing.externalPaymentUrl ? (
          <p>
            <a
              className="font-semibold text-[#2563ff] underline-offset-2 hover:underline"
              href={billing.externalPaymentUrl}
              rel="noreferrer"
              target="_blank"
            >
              {billing.externalPaymentUrl}
            </a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
