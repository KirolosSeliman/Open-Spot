import type { InsightsKpi } from "@/lib/analytics/types";
import { cn } from "@/lib/utils/cn";

const KPI_ICONS = {
  recoveredRevenue: {
    tone: "bg-[#eef4ff] text-[#2563ff]",
    icon: (
      <path d="M12 2v20M17 7H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H7" />
    )
  },
  recoveredAppointments: {
    tone: "bg-[#eef4ff] text-[#2563ff]",
    icon: (
      <>
        <path d="M8 2v3m8-3v3" />
        <path d="M4 9h16M5 5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      </>
    )
  },
  responseRate: {
    tone: "bg-[#f3e8ff] text-[#7c3aed]",
    icon: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
  },
  cancellationsReceived: {
    tone: "bg-[#fff7ed] text-[#ea580c]",
    icon: (
      <>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
      </>
    )
  },
  smsSent: {
    tone: "bg-[#ecfdf3] text-[#15803d]",
    icon: <path d="m22 2-7 20-4-9-9-4zM22 2 11 13" />
  },
  clientsAdded: {
    tone: "bg-[#eef4ff] text-[#2563ff]",
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    )
  }
} as const;

function InsightsKpiCard({
  kpi,
  iconKey
}: {
  kpi: InsightsKpi;
  iconKey: keyof typeof KPI_ICONS;
}) {
  const icon = KPI_ICONS[iconKey];

  return (
    <article className="rounded-[18px] border border-[#e2e8f0] bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
            icon.tone
          )}
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            viewBox="0 0 24 24"
          >
            {icon.icon}
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#64748b]">{kpi.label}</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-[#07142f]">
            {kpi.value}
          </p>
          <p
            className={cn(
              "mt-2 text-xs font-semibold",
              kpi.trend.tone === "positive" && "text-[#15803d]",
              kpi.trend.tone === "negative" && "text-[#b91c1c]",
              kpi.trend.tone === "neutral" && "text-[#64748b]"
            )}
          >
            {kpi.trend.display}
          </p>
        </div>
      </div>
    </article>
  );
}

export function InsightsKpiGrid({
  kpis
}: {
  kpis: {
    recoveredRevenue: InsightsKpi;
    recoveredAppointments: InsightsKpi;
    responseRate: InsightsKpi;
    cancellationsReceived: InsightsKpi;
    smsSent: InsightsKpi;
    clientsAdded: InsightsKpi;
  };
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <InsightsKpiCard iconKey="recoveredRevenue" kpi={kpis.recoveredRevenue} />
      <InsightsKpiCard iconKey="recoveredAppointments" kpi={kpis.recoveredAppointments} />
      <InsightsKpiCard iconKey="responseRate" kpi={kpis.responseRate} />
      <InsightsKpiCard iconKey="cancellationsReceived" kpi={kpis.cancellationsReceived} />
      <InsightsKpiCard iconKey="smsSent" kpi={kpis.smsSent} />
      <InsightsKpiCard iconKey="clientsAdded" kpi={kpis.clientsAdded} />
    </section>
  );
}
