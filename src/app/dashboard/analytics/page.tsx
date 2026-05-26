import {
  DashboardPageHeader,
  MetricCard,
  Panel
} from "@/components/dashboard/dashboard-ui";
import {
  dashboardCancellations,
  dashboardReplies,
  findClient,
  findService,
  formatCurrency
} from "@/lib/dashboard/mock-data";

const filters = [
  "Today",
  "Last 7 days",
  "Last 30 days",
  "Current month",
  "Current year",
  "Custom range"
];

export default function AnalyticsPage() {
  const recovered = dashboardCancellations.filter(
    (cancellation) => cancellation.status === "Récupérée"
  );
  const smsSent = dashboardCancellations.reduce(
    (total, cancellation) => total + cancellation.clientsContacted,
    0
  );
  const recoveredRevenue = recovered.reduce(
    (total, cancellation) => total + cancellation.estimatedValueCents,
    0
  );
  const responseRate =
    smsSent === 0 ? 0 : Math.round((dashboardReplies.length / smsSent) * 100);

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Indicateurs illustratifs pour comprendre les revenus récupérés, le taux de réponse et les services les plus performants."
        title="Statistiques"
      />
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-black"
            key={filter}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          detail="Estimé à partir des services récupérés."
          label="Estimated recovered revenue by month"
          value={formatCurrency(recoveredRevenue)}
          tone="green"
        />
        <MetricCard
          detail="Confirmations faites manuellement."
          label="Number of recovered cancellations"
          value={String(recovered.length)}
          tone="green"
        />
        <MetricCard
          detail="Réponses reçues sur SMS envoyés."
          label="Response rate"
          value={`${responseRate}%`}
        />
        <MetricCard
          detail="Basé sur les réponses de démonstration."
          label="Average time to first response"
          value="1m 04s"
          tone="amber"
        />
        <MetricCard
          detail={findService(recovered[0]?.serviceId ?? "")?.name ?? "—"}
          label="Most recovered services"
          value="Coupe"
          tone="violet"
        />
        <MetricCard
          detail={findClient(dashboardReplies[0]?.clientId)?.name ?? "—"}
          label="Most responsive clients"
          value="Maya"
          tone="violet"
        />
      </div>
      <Panel title="SMS sent by period">
        <div className="grid gap-4">
          {[
            ["Aujourd'hui", "7 SMS", "70%"],
            ["Cette semaine", "38 SMS", "52%"],
            ["Ce mois-ci", "284 SMS", "84%"]
          ].map(([label, value, width]) => (
            <div key={label}>
              <div className="flex justify-between text-sm font-black">
                <span>{label}</span>
                <span>{value}</span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-[#edf1ec]">
                <div
                  className="h-3 rounded-full bg-[var(--primary)]"
                  style={{ width }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
