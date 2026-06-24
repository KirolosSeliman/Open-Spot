import {
  DashboardPageHeader,
  MetricCard,
  Panel
} from "@/components/dashboard/dashboard-ui";
import {
  getBillingIntervalLabel,
  getBillingStatusLabel,
  getPaymentMethodLabel
} from "@/lib/billing/manual-billing";
import { loadManualBillingForOrganization } from "@/lib/billing/manual-billing-data";
import { getRequestLocale } from "@/lib/i18n/locale";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";

function formatMoney(cents: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency
  }).format(cents / 100);
}

function formatDate(value: string | null, locale: string, fallback: string) {
  return value ? new Date(value).toLocaleDateString(locale) : fallback;
}

export default async function BillingPage() {
  const [workspace, locale] = await Promise.all([
    getActiveOrganizationWorkspace(),
    getRequestLocale()
  ]);
  const intlLocale = locale === "fr" ? "fr-CA" : "en-CA";
  const billing =
    workspace.status === "ready"
      ? await loadManualBillingForOrganization(workspace.organization.id).catch(
          () => null
        )
      : null;
  const copy = {
    fr: {
      title: "Facturation",
      description:
        "Résumé de votre statut de paiement. Les modifications de plan et de statut sont gérées par l’équipe Open Spot.",
      plan: "Plan actuel",
      status: "Statut du paiement",
      renewal: "Prochaine échéance",
      method: "Méthode",
      periodEnd: "Fin de période",
      externalLinkStored: "Lien externe enregistré",
      noLink: "Aucun lien",
      notAvailable: "Non disponible",
      noRecord: "La facturation n’est pas encore configurée pour ce compte.",
      manualMode:
        "Mode de facturation manuel : l’équipe Open Spot confirme le paiement après validation dans Stripe, Interac ou une méthode externe.",
      locked:
        "Vous ne pouvez pas modifier votre statut de paiement depuis le dashboard."
    },
    en: {
      title: "Billing",
      description:
        "Summary of your payment status. Plan and status changes are managed by the Open Spot team.",
      plan: "Current plan",
      status: "Payment status",
      renewal: "Next payment due",
      method: "Method",
      periodEnd: "Period end",
      externalLinkStored: "External link stored",
      noLink: "No link",
      notAvailable: "N/A",
      noRecord: "Billing is not configured for this account yet.",
      manualMode:
        "Manual billing mode: the Open Spot team confirms payment after it is validated in Stripe, Interac, or another external method.",
      locked: "You cannot update your payment status from the dashboard."
    }
  }[locale];

  if (!billing) {
    return (
      <div className="grid gap-6">
        <DashboardPageHeader description={copy.description} title={copy.title} />
        <Panel title={copy.status}>
          <p className="text-sm leading-6 text-[var(--muted)]">{copy.noRecord}</p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <DashboardPageHeader description={copy.description} title={copy.title} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={formatMoney(
            billing.monthlyPriceCents,
            billing.currency,
            intlLocale
          )}
          label={copy.plan}
          value={billing.planName}
        />
        <MetricCard
          detail={getBillingIntervalLabel(billing.billingInterval, locale)}
          label={copy.status}
          value={getBillingStatusLabel(billing.billingStatus, locale)}
          tone={billing.billingStatus === "paid" ? "green" : "amber"}
        />
        <MetricCard
          detail={`${copy.periodEnd}: ${formatDate(
            billing.currentPeriodEnd,
            intlLocale,
            copy.notAvailable
          )}`}
          label={copy.renewal}
          value={formatDate(
            billing.nextPaymentDueAt,
            intlLocale,
            copy.notAvailable
          )}
        />
        <MetricCard
          detail={
            billing.externalPaymentUrl ? copy.externalLinkStored : copy.noLink
          }
          label={copy.method}
          value={getPaymentMethodLabel(billing.paymentMethod, locale)}
          tone="violet"
        />
      </div>
      <Panel title={copy.status}>
        <div className="grid gap-3 text-sm leading-6 text-[var(--muted)]">
          <p>{copy.manualMode}</p>
          <p className="font-bold text-[var(--foreground)]">{copy.locked}</p>
        </div>
      </Panel>
    </div>
  );
}
