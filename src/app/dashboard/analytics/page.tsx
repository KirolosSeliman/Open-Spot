import {
  DashboardPageHeader,
  MetricCard,
  Panel
} from "@/components/dashboard/dashboard-ui";

const filters = [
  "Today",
  "Last 7 days",
  "Last 30 days",
  "Current month",
  "Current year",
  "Custom range"
];

export default function AnalyticsPage() {
  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Indicateurs reels de l'organisation. Les exemples de demonstration sont separes du dashboard authentifie."
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
          detail="Aucune confirmation reelle pour le moment."
          label="Estimated recovered revenue by month"
          value="$0.00"
          tone="green"
        />
        <MetricCard
          detail="Confirmations faites manuellement."
          label="Number of recovered cancellations"
          value="0"
          tone="green"
        />
        <MetricCard
          detail="Aucun SMS reel ou simule dans cette organisation."
          label="Response rate"
          value="0%"
        />
      </div>
      <Panel title="SMS sent by period">
        <p className="text-sm leading-6 text-[var(--muted)]">
          Les volumes reels apparaitront ici apres les premieres annulations et
          simulations SMS.
        </p>
      </Panel>
    </div>
  );
}
