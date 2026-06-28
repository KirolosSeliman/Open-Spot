import type { AdminOverviewData } from "@/lib/admin/overview-data";

function escapeCsvValue(value: string | number) {
  const stringValue = String(value);

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export function buildAdminOverviewCsv(payload: AdminOverviewData["exportPayload"]) {
  const lines = [
    "Section,Metric,Valeur",
    `Résumé,Date export,${payload.exportedAt}`,
    `Résumé,Compagnies actives,${payload.activeCompanies}`,
    `Résumé,SMS envoyés (30 j),${payload.outboundSms30d}`,
    `Résumé,Coût SMS estimé (30 j),${payload.estimatedSmsCost30d}`,
    `Résumé,Créneaux récupérés (30 j),${payload.filledSpots30d}`,
    `Résumé,Rappels échoués (30 j),${payload.failedReminders30d}`,
    "",
    "Rang,Compagnie,Créneaux récupérés,Taux de réponse,Revenus récupérés"
  ];

  for (const company of payload.topCompanies) {
    lines.push(
      [
        company.rank,
        escapeCsvValue(company.name),
        company.filledSpots,
        `${company.responseRate} %`,
        (company.recoveredRevenueCents / 100).toFixed(2)
      ].join(",")
    );
  }

  return lines.join("\n");
}

export function getAdminOverviewExportFilename(now = new Date()) {
  const stamp = now.toISOString().slice(0, 10);
  return `open-spot-admin-overview-${stamp}.csv`;
}
