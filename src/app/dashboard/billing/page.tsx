import {
  DashboardPageHeader,
  MetricCard,
  Panel
} from "@/components/dashboard/dashboard-ui";

export default function BillingPage() {
  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Apercu de l'abonnement et de l'usage SMS. Les paiements ne sont pas actives tant qu'un provider billing n'est pas connecte."
        title="Abonnement"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="Aucun plan payant actif dans cette version."
          label="Current plan"
          value="MVP"
        />
        <MetricCard
          detail="Billing provider requis avant facturation reelle."
          label="Subscription status"
          value="Not connected"
          tone="amber"
        />
        <MetricCard
          detail="Aucune date de renouvellement reelle."
          label="Renewal date"
          value="N/A"
        />
        <MetricCard
          detail="Usage reel calcule depuis les messages de l'organisation."
          label="SMS usage"
          value="0"
          tone="violet"
        />
      </div>
      <Panel title="Payment method">
        <p className="text-sm leading-6 text-[var(--muted)]">
          Aucun moyen de paiement reel n&apos;est relie dans cette interface.
        </p>
      </Panel>
    </div>
  );
}
