"use client";

import { LineChart } from "@/components/dashboard/home/charts";
import { CompanyDetailCard, CompanyDetailSectionTitle } from "@/components/admin/company-detail/company-detail-ui";
import type { AdminOrganizationOverview } from "@/lib/admin/organizations";
import { formatEstimatedSmsCost } from "@/lib/admin/sms-cost";

function formatChartLabel(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

function buildLabels(data: Array<{ date: string }>) {
  const step = Math.max(1, Math.ceil(data.length / 6));
  return data.map((row, index) =>
    index % step === 0 || index === data.length - 1 ? formatChartLabel(row.date) : ""
  );
}

function AnalyticsChartCard({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <CompanyDetailCard>
      <div className="mb-4 flex items-start justify-between gap-3">
        <CompanyDetailSectionTitle>{title}</CompanyDetailSectionTitle>
        <span className="rounded-full border border-[#e2eaf5] bg-[#f8fbff] px-3 py-1 text-xs font-semibold text-[#64748b]">
          30 jours
        </span>
      </div>
      {children}
    </CompanyDetailCard>
  );
}

function buildCumulativeOptIn(data: Array<{ optedInCustomers: number }>) {
  return data.reduce<number[]>((series, row) => {
    const previous = series[series.length - 1] ?? 0;
    series.push(previous + row.optedInCustomers);
    return series;
  }, []);
}

export function CompanyAnalyticsCharts({
  charts,
  currency = "CAD"
}: {
  charts: AdminOrganizationOverview["charts"];
  currency?: string;
}) {
  const filledLabels = buildLabels(charts.filledSpotsByDay);
  const smsCostLabels = buildLabels(charts.smsCostByDay);
  const customerLabels = buildLabels(charts.customerGrowthByDay);
  const smsVolumeLabels = buildLabels(charts.smsVolumeByDay);

  const cumulativeCustomerData = buildCumulativeOptIn(charts.customerGrowthByDay);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <AnalyticsChartCard title="Spots remplis dans le temps">
        <LineChart
          labels={filledLabels}
          series={[
            {
              name: "Spots remplis",
              data: charts.filledSpotsByDay.map((row) => row.count),
              tone: "blue"
            }
          ]}
        />
      </AnalyticsChartCard>

      <AnalyticsChartCard title="Coût SMS estimé">
        <LineChart
          labels={smsCostLabels}
          series={[
            {
              name: "Coût SMS estimé",
              data: charts.smsCostByDay.map((row) => row.estimatedCostCents / 100),
              tone: "blue"
            }
          ]}
        />
        <p className="mt-2 text-xs text-[#64748b]">
          Valeurs en {currency}. Estimation basée sur les SMS sortants.
        </p>
      </AnalyticsChartCard>

      <AnalyticsChartCard title="Croissance de la base client">
        <LineChart
          labels={customerLabels}
          series={[
            {
              name: "Clients (opt-in cumulés)",
              data: cumulativeCustomerData,
              tone: "blue"
            }
          ]}
        />
      </AnalyticsChartCard>

      <AnalyticsChartCard title="Volume SMS">
        <LineChart
          labels={smsVolumeLabels}
          series={[
            {
              name: "SMS envoyés",
              data: charts.smsVolumeByDay.map((row) => row.outbound),
              tone: "blue"
            }
          ]}
        />
      </AnalyticsChartCard>
    </div>
  );
}

export function CompanyBillingKpiCards({
  filledSpotsInRange,
  filledSpotFeesLabel,
  estimatedSmsCostLabel,
  monthlySubscriptionLabel,
  estimatedContributionLabel
}: {
  filledSpotsInRange: number;
  filledSpotFeesLabel: string;
  estimatedSmsCostLabel: string;
  monthlySubscriptionLabel: string;
  estimatedContributionLabel: string;
}) {
  const numberFormatter = new Intl.NumberFormat("fr-CA");
  const items = [
    {
      title: "Spots remplis sur la période",
      value: numberFormatter.format(filledSpotsInRange),
      note: "Validations uniquement"
    },
    {
      title: "Frais spots remplis",
      value: filledSpotFeesLabel,
      note: "Selon les conditions"
    },
    {
      title: "Coût SMS estimé",
      value: estimatedSmsCostLabel,
      note: "Estimation, non facturé"
    },
    {
      title: "Abonnement mensuel",
      value: monthlySubscriptionLabel,
      note: "Période en cours"
    },
    {
      title: "Contribution estimée",
      value: estimatedContributionLabel,
      note: "Estimation totale"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <CompanyDetailCard key={item.title}>
          <p className="text-sm font-semibold text-[#64748b]">{item.title}</p>
          <p className="mt-3 text-[1.75rem] font-bold text-[#0b1328]">{item.value}</p>
          <p className="mt-2 text-xs text-[#64748b]">{item.note}</p>
        </CompanyDetailCard>
      ))}
    </div>
  );
}

export function formatCompanyMoney(cents: number, currency = "CAD") {
  return formatEstimatedSmsCost(cents, currency);
}
