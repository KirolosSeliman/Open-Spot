import {
  DashboardPageHeader,
  MetricCard,
  Panel
} from "@/components/dashboard/dashboard-ui";
import { dashboardBilling } from "@/lib/dashboard/mock-data";

export default function BillingPage() {
  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Aperçu de l'abonnement et de l'usage SMS. Les paiements ne sont pas activés tant qu'un provider billing n'est pas connecté."
        title="Abonnement"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="Plan configuré pour la démo dashboard."
          label="Current plan"
          value={dashboardBilling.plan}
        />
        <MetricCard
          detail="Billing provider requis avant facturation réelle."
          label="Subscription status"
          value={dashboardBilling.status}
          tone="amber"
        />
        <MetricCard
          detail="Date illustrative jusqu'à intégration billing."
          label="Renewal date"
          value={dashboardBilling.renewalDate}
        />
        <MetricCard
          detail={`${dashboardBilling.smsLimit} SMS inclus dans ce plan.`}
          label="SMS usage"
          value={`${dashboardBilling.smsUsed}`}
          tone="violet"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Payment method placeholder">
          <p className="text-sm leading-6 text-[var(--muted)]">
            Aucun moyen de paiement réel n&apos;est relié dans cette interface. Le
            bouton sera activé seulement après intégration d&apos;un provider.
          </p>
          <button
            className="mt-4 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-black"
            type="button"
          >
            Change plan action
          </button>
        </Panel>
        <Panel title="Invoices placeholder">
          <p className="text-sm leading-6 text-[var(--muted)]">
            Les factures apparaîtront ici quand la facturation réelle sera
            connectée.
          </p>
          <button
            className="mt-4 rounded-full border border-[#f2b8b5] bg-[#fff7f6] px-4 py-2 text-sm font-black text-[#8a1f17]"
            type="button"
          >
            Cancel subscription action
          </button>
        </Panel>
      </div>
    </div>
  );
}
