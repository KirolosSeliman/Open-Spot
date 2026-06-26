import { QrCode } from "@/components/waitlist/qr-code";
import { CopyLinkButton } from "@/components/waitlist/copy-link-button";
import { ClientsQrDownloadButton } from "@/components/clients/clients-qr-download-button";
import type { ClientsInsightsData } from "@/lib/clients/insights-data";
import { cn } from "@/lib/utils/cn";

function formatPercent(value: number | null) {
  if (value === null) {
    return null;
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value} %`;
}

function KpiMiniCard({
  detail,
  iconTone,
  label,
  trend,
  value
}: {
  label: string;
  value: string;
  detail?: string;
  trend?: { value: number | null; tone: "positive" | "negative" };
  iconTone: "blue" | "green" | "red";
}) {
  const iconClasses = {
    blue: "bg-[#eef4ff] text-[#2563ff]",
    green: "bg-[#ecfdf3] text-[#15803d]",
    red: "bg-[#fef2f2] text-[#b91c1c]"
  };

  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#64748b]">{label}</p>
          <p className="mt-2 text-2xl font-black text-[#07142f]">{value}</p>
          {detail ? (
            <p className="mt-1 truncate text-xs text-[#64748b]">{detail}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            iconClasses[iconTone]
          )}
        >
          <span aria-hidden="true" className="text-sm font-black">
            {iconTone === "red" ? "↓" : "↑"}
          </span>
        </div>
      </div>
      {trend && trend.value !== null ? (
        <p
          className={cn(
            "mt-3 text-xs font-bold",
            trend.tone === "positive" ? "text-[#15803d]" : "text-[#b91c1c]"
          )}
        >
          {formatPercent(trend.value)}
        </p>
      ) : null}
    </div>
  );
}

function GrowthChart({
  series
}: {
  series: ClientsInsightsData["growthSeries"];
}) {
  const maxCount = Math.max(...series.map((point) => point.count), 1);
  const width = 420;
  const height = 160;
  const padding = 24;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const points = series.map((point, index) => {
    const x =
      padding + (index / Math.max(series.length - 1, 1)) * innerWidth;
    const y = padding + innerHeight - (point.count / maxCount) * innerHeight;
    return `${x},${y}`;
  });

  return (
    <svg
      aria-hidden="true"
      className="h-auto w-full max-w-full"
      viewBox={`0 0 ${width} ${height}`}
    >
      {[0, 0.5, 1].map((ratio) => {
        const y = padding + innerHeight * ratio;
        return (
          <line
            key={ratio}
            stroke="#e2e8f0"
            strokeDasharray="4 4"
            x1={padding}
            x2={width - padding}
            y1={y}
            y2={y}
          />
        );
      })}
      <polyline
        fill="none"
        points={points.join(" ")}
        stroke="#2563ff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      {series.map((point, index) => {
        if (index % 5 !== 0 && index !== series.length - 1) {
          return null;
        }

        const x =
          padding + (index / Math.max(series.length - 1, 1)) * innerWidth;
        const y =
          padding + innerHeight - (point.count / maxCount) * innerHeight;

        return (
          <g key={point.dateKey}>
            <circle cx={x} cy={y} fill="#2563ff" r="4" />
            <text
              fill="#64748b"
              fontSize="10"
              textAnchor="middle"
              x={x}
              y={height - 6}
            >
              {point.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ConsentDonutChart({
  breakdown
}: {
  breakdown: ClientsInsightsData["consentBreakdown"];
}) {
  const total = Math.max(breakdown.total, 1);
  const optedInPct = (breakdown.optedIn / total) * 100;
  const pendingPct = (breakdown.pending / total) * 100;
  const optedOutPct = (breakdown.optedOut / total) * 100;
  const gradient = `conic-gradient(#22c55e 0 ${optedInPct}%, #f59e0b ${optedInPct}% ${
    optedInPct + pendingPct
  }%, #ef4444 ${optedInPct + pendingPct}% 100%)`;

  const legend = [
    {
      label: "Consentement",
      count: breakdown.optedIn,
      percent: Math.round(optedInPct),
      tone: "bg-[#22c55e]"
    },
    {
      label: "En attente",
      count: breakdown.pending,
      percent: Math.round(pendingPct),
      tone: "bg-[#f59e0b]"
    },
    {
      label: "Désinscrit",
      count: breakdown.optedOut,
      percent: Math.round(optedOutPct),
      tone: "bg-[#ef4444]"
    }
  ];

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div
        className="relative grid h-36 w-36 shrink-0 place-items-center rounded-full"
        style={{ background: gradient }}
      >
        <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center shadow-inner">
          <span className="text-2xl font-black text-[#07142f]">{breakdown.total}</span>
        </div>
      </div>
      <div className="grid min-w-0 flex-1 gap-3">
        {legend.map((item) => (
          <div className="flex min-w-0 items-center justify-between gap-3" key={item.label}>
            <div className="flex min-w-0 items-center gap-2">
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", item.tone)} />
              <span className="truncate text-sm font-medium text-[#475569]">
                {item.label}
              </span>
            </div>
            <span className="shrink-0 text-sm font-bold text-[#07142f]">
              {item.count} ({item.percent} %)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatLastUpdated(value: string, timezone: string) {
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone
  }).format(new Date(value));
}

export function ClientsInsightsSection({
  insights
}: {
  insights: ClientsInsightsData;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <h2 className="text-lg font-black text-[#07142f]">
          Liste d&apos;attente — Aperçu
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <KpiMiniCard
            iconTone="blue"
            label="Total inscrits"
            value={String(insights.overview.totalEnrolled)}
          />
          <KpiMiniCard
            iconTone="green"
            label="Opt-in actifs"
            value={String(insights.overview.activeOptIn)}
          />
          <KpiMiniCard
            iconTone="blue"
            label="Nouveaux cette semaine"
            trend={{
              tone: "positive",
              value: insights.overview.newThisWeekTrendPercent
            }}
            value={String(insights.overview.newThisWeek)}
          />
          <KpiMiniCard
            iconTone="red"
            label="Désabonnements"
            trend={{
              tone: "negative",
              value: insights.overview.unsubscribesTrendPercent
            }}
            value={String(insights.overview.unsubscribes)}
          />
        </div>
      </div>

      <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-[#07142f]">
            Croissance de la liste d&apos;attente
          </h2>
          <span className="shrink-0 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#64748b]">
            30 derniers jours
          </span>
        </div>
        <GrowthChart series={insights.growthSeries} />
      </div>

      <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <h2 className="text-lg font-black text-[#07142f]">Consentement SMS</h2>
        <div className="mt-5">
          <ConsentDonutChart breakdown={insights.consentBreakdown} />
        </div>
      </div>

      <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <h2 className="text-lg font-black text-[#07142f]">
          Inscription publique à la liste d&apos;attente
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#64748b]">
          Partagez ce lien ou ce code QR pour permettre aux clients de s&apos;inscrire
          eux-mêmes à votre liste d&apos;attente.
        </p>
        {insights.publicLink.ready && insights.publicLink.publicUrl ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
            {insights.publicLink.qrUrl ? (
              <div className="justify-self-start">
                <QrCode value={insights.publicLink.qrUrl} />
              </div>
            ) : null}
            <div className="grid min-w-0 gap-3">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#475569]">Lien public</span>
                <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#07142f]">
                    {insights.publicLink.publicUrl}
                  </span>
                  <CopyLinkButton value={insights.publicLink.publicUrl} />
                </div>
              </label>
              {insights.publicLink.qrUrl ? (
                <ClientsQrDownloadButton value={insights.publicLink.qrUrl} />
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-[#fde68a] bg-[#fffbeb] p-4 text-sm leading-6 text-[#92400e]">
            <p className="font-semibold">
              Les liens publics ne sont pas encore configurés.
            </p>
            <ul className="mt-2 grid gap-1">
              {insights.publicLink.blockingReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="xl:col-span-2 flex flex-col gap-3 rounded-[16px] border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1e3a8a] sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0">
          Les statistiques sont mises à jour en temps réel. Les données affichées
          sont basées sur le fuseau horaire {insights.timezone}.
        </p>
        <p className="shrink-0 font-semibold">
          Dernière mise à jour :{" "}
          {formatLastUpdated(insights.lastUpdatedAt, insights.timezone)}
        </p>
      </div>
    </section>
  );
}
