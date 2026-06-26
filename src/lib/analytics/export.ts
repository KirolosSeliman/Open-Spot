import type { InsightsExportPayload } from "@/lib/analytics/types";

function escapeCsvValue(value: string | number) {
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD"
  }).format(cents / 100);
}

export function buildInsightsCsv(payload: InsightsExportPayload) {
  const lines: string[] = [];

  lines.push("Section,Libellé,Valeur");
  lines.push(
    `Métadonnées,Organisation,${escapeCsvValue(payload.organizationName)}`
  );
  lines.push(`Métadonnées,Période,${escapeCsvValue(payload.periodLabel)}`);
  lines.push(
    `Métadonnées,Plage de dates,${escapeCsvValue(payload.dateRangeLabel)}`
  );
  lines.push(`Métadonnées,Service,${escapeCsvValue(payload.serviceLabel)}`);
  lines.push(
    `Métadonnées,Fuseau horaire,${escapeCsvValue(payload.timezone)}`
  );
  lines.push(
    `Métadonnées,Généré le,${escapeCsvValue(payload.generatedAt)}`
  );
  lines.push("");

  lines.push("KPI,Valeur,Variation");
  for (const kpi of payload.kpis) {
    lines.push(
      `${escapeCsvValue(kpi.label)},${escapeCsvValue(kpi.value)},${escapeCsvValue(kpi.trend)}`
    );
  }
  lines.push("");

  lines.push("Revenus récupérés,Date,Valeur ($)");
  for (const point of payload.recoveredRevenueSeries) {
    lines.push(
      `Revenus récupérés,${escapeCsvValue(point.fullLabel)},${escapeCsvValue(formatCurrency(point.value))}`
    );
  }
  lines.push("");

  lines.push("SMS vs réponses,Date,SMS envoyés,Réponses");
  for (const point of payload.smsVsResponsesSeries) {
    lines.push(
      `SMS vs réponses,${escapeCsvValue(point.fullLabel)},${point.smsSent},${point.responses}`
    );
  }
  lines.push("");

  lines.push("Entonnoir,Étape,Volume,Taux");
  for (const step of payload.funnel) {
    lines.push(
      `Entonnoir,${escapeCsvValue(step.label)},${step.count},${escapeCsvValue(step.rateLabel ?? "—")}`
    );
  }
  lines.push("");

  lines.push(
    "Taux de réponse,Taux (%),Réponses,Sans réponse"
  );
  lines.push(
    `Taux de réponse,${payload.responseRateDonut.rate},${payload.responseRateDonut.responses},${payload.responseRateDonut.noResponse}`
  );
  lines.push("");

  lines.push("Croissance liste d'attente,Date,Inscrits cumulés");
  for (const point of payload.waitlistGrowthSeries) {
    lines.push(
      `Croissance liste d'attente,${escapeCsvValue(point.fullLabel)},${point.value}`
    );
  }
  lines.push("");

  lines.push(
    "Services,Service,Annulations,Taux de réponse,Rendez-vous récupérés,Revenus récupérés"
  );
  for (const service of payload.topServices) {
    lines.push(
      `Services,${escapeCsvValue(service.serviceName)},${service.cancellations},${service.responseRate} %,${service.recoveredAppointments},${escapeCsvValue(formatCurrency(service.recoveredRevenueCents))}`
    );
  }

  return `\uFEFF${lines.join("\n")}`;
}

export function getInsightsExportFilename(now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  return `open-spot-insights-${date}.csv`;
}
