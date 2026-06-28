import type { CompanyDetailKpiTrend } from "@/lib/admin/company-detail-data";
import { CompanyDetailCard, CompanyDetailIconBadge } from "@/components/admin/company-detail/company-detail-ui";
import { cn } from "@/lib/utils/cn";

const numberFormatter = new Intl.NumberFormat("fr-CA");

function TrendBadge({
  trend,
  tone = "default"
}: {
  trend: CompanyDetailKpiTrend;
  tone?: "default" | "warning";
}) {
  const { percentChange, absoluteChange } = trend;

  if (tone === "warning") {
    const value = Math.abs(absoluteChange);
    const color = absoluteChange > 0 ? "text-[#f97316]" : absoluteChange < 0 ? "text-[#16a34a]" : "text-[#64748b]";

    return (
      <span className={cn("inline-flex items-center gap-1 text-sm font-bold", color)}>
        {absoluteChange > 0 ? "↑" : absoluteChange < 0 ? "↓" : "—"} {numberFormatter.format(value)}
      </span>
    );
  }

  if (percentChange === null) {
    return (
      <span className="text-sm font-bold text-[#64748b]">
        {absoluteChange === 0 ? "—" : absoluteChange > 0 ? "↑" : "↓"}
      </span>
    );
  }

  const positive = percentChange >= 0;
  const color = positive ? "text-[#16a34a]" : "text-[#ef4444]";

  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-bold", color)}>
      {positive ? "↑" : "↓"} {Math.abs(percentChange)}%
    </span>
  );
}

function KpiCard({
  title,
  value,
  note,
  trend,
  trendTone = "default",
  icon
}: {
  title: string;
  value: string;
  note: string;
  trend: CompanyDetailKpiTrend;
  trendTone?: "default" | "warning";
  icon: React.ReactNode;
}) {
  return (
    <CompanyDetailCard className="flex min-h-[168px] flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-[#64748b]">{title}</p>
        <CompanyDetailIconBadge className="h-10 w-10 rounded-full">{icon}</CompanyDetailIconBadge>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-[2rem] font-bold leading-none text-[#0b1328]">{value}</p>
        <TrendBadge tone={trendTone} trend={trend} />
      </div>
      <p className="mt-3 text-xs text-[#64748b]">{note}</p>
    </CompanyDetailCard>
  );
}

function SpotIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function CompanyOverviewKpiCards({
  filledSpots,
  filledSpotsTrend,
  outboundSms,
  outboundSmsTrend,
  estimatedSmsCostLabel,
  estimatedSmsCostTrend,
  optInCustomersInRange,
  optInCustomersTrend,
  pendingValidations,
  pendingValidationsTrend
}: {
  filledSpots: number;
  filledSpotsTrend: CompanyDetailKpiTrend;
  outboundSms: number;
  outboundSmsTrend: CompanyDetailKpiTrend;
  estimatedSmsCostLabel: string;
  estimatedSmsCostTrend: CompanyDetailKpiTrend;
  optInCustomersInRange: number;
  optInCustomersTrend: CompanyDetailKpiTrend;
  pendingValidations: number;
  pendingValidationsTrend: CompanyDetailKpiTrend;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <KpiCard
        icon={<SpotIcon />}
        note="Validations uniquement"
        title="Spots remplis"
        trend={filledSpotsTrend}
        value={numberFormatter.format(filledSpots)}
      />
      <KpiCard
        icon={<MessageIcon />}
        note="Sortants uniquement"
        title="SMS envoyés"
        trend={outboundSmsTrend}
        value={numberFormatter.format(outboundSms)}
      />
      <KpiCard
        icon={<DollarIcon />}
        note="Estimation, non facturé"
        title="Coût SMS estimé"
        trend={estimatedSmsCostTrend}
        value={estimatedSmsCostLabel}
      />
      <KpiCard
        icon={<UsersIcon />}
        note="Opt-in dans la période"
        title="Clients"
        trend={optInCustomersTrend}
        value={numberFormatter.format(optInCustomersInRange)}
      />
      <KpiCard
        icon={<ClockIcon />}
        note="En attente de traitement"
        title="Validations en attente"
        trend={pendingValidationsTrend}
        trendTone="warning"
        value={numberFormatter.format(pendingValidations)}
      />
    </div>
  );
}

export function CompanySimpleKpiCard({
  title,
  value,
  note,
  icon
}: {
  title: string;
  value: string;
  note?: string;
  icon: React.ReactNode;
}) {
  return (
    <CompanyDetailCard className="flex min-h-[140px] flex-col">
      <div className="flex items-start gap-4">
        <CompanyDetailIconBadge className="h-10 w-10 rounded-full">{icon}</CompanyDetailIconBadge>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#64748b]">{title}</p>
          <p className="mt-3 text-[1.75rem] font-bold leading-none text-[#0b1328]">{value}</p>
          {note ? <p className="mt-2 text-xs text-[#64748b]">{note}</p> : null}
        </div>
      </div>
    </CompanyDetailCard>
  );
}
