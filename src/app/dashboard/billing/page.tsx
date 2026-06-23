import {
  DashboardPageHeader,
  MetricCard,
  Panel
} from "@/components/dashboard/dashboard-ui";

export default function BillingPage() {
  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Aperçu de l’abonnement et de l’usage SMS. Les paiements ne sont pas actifs tant qu’un fournisseur de facturation n’est pas connecté."
        title="Abonnement"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="Aucun plan payant actif dans cette version."
          label="Plan actuel"
          value="Plan de lancement"
        />
        <MetricCard
          detail="Fournisseur de facturation requis avant toute facturation réelle."
          label="État de l’abonnement"
          value="Non connecté"
          tone="amber"
        />
        <MetricCard
          detail="Aucune date de renouvellement réelle."
          label="Date de renouvellement"
          value="N/A"
        />
        <MetricCard
          detail="Usage réel calculé depuis les messages de l’organisation."
          label="Usage SMS"
          value="0"
          tone="violet"
        />
      </div>
      <Panel title="Moyen de paiement">
        <p className="text-sm leading-6 text-[var(--muted)]">
          Aucun moyen de paiement réel n&apos;est relié dans cette interface.
        </p>
      </Panel>
    </div>
  );
}
