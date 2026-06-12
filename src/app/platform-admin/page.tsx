import Link from "next/link";

import {
  DashboardPageHeader,
  MetricCard,
  Panel,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import {
  loadPlatformAdminBusinesses,
  loadPlatformAdminOverview
} from "@/lib/platform-admin/data";
import { formatAdminCurrency, formatAdminDate } from "@/lib/platform-admin/helpers";

function metricValue(value: number | null) {
  return value === null ? "Non disponible" : String(value);
}

export default async function PlatformAdminPage() {
  const [overview, businessWorkspace] = await Promise.all([
    loadPlatformAdminOverview(),
    loadPlatformAdminBusinesses({
      health: "problem",
      sort: "activity_desc"
    })
  ]);

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Cockpit interne read-only pour surveiller les commerces, l'activité SMS et les montants estimés."
        title="Vue d'ensemble plateforme"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`${overview.businessesActive} actifs, ${overview.businessesCreatedThisMonth} créés ce mois.`}
          label="Commerces"
          value={String(overview.businessesTotal)}
        />
        <MetricCard
          detail={`${overview.customersOptIn} opt-in, ${overview.customersOptOut} opt-out.`}
          label="Clients"
          value={String(overview.customersTotal)}
          tone="green"
        />
        <MetricCard
          detail={`${overview.smsDeliveredThisMonth} delivered, ${overview.smsFailedThisMonth + overview.smsUndeliveredThisMonth} problèmes.`}
          label="SMS ce mois"
          value={String(overview.smsSentThisMonth)}
          tone="violet"
        />
        <MetricCard
          detail="Lecture estimée, pas une facture officielle."
          label="Montant estimé dû"
          value={formatAdminCurrency(overview.estimatedAmountDueCents)}
          tone="amber"
        />
        <MetricCard
          detail={`${overview.openingsAwaitingValidation} en attente de validation.`}
          label="Annulations"
          value={String(overview.openingsCreated)}
        />
        <MetricCard
          detail="Réponses SMS entrantes reçues ce mois."
          label="Réponses SMS"
          value={String(overview.smsInboundThisMonth)}
          tone="green"
        />
        <MetricCard
          detail="Somme déclarée via validations existantes."
          label="Revenus récupérés"
          value={formatAdminCurrency(overview.recoveredValueCents)}
          tone="green"
        />
        <MetricCard
          detail={`${overview.businessesInactive} sans activité récente.`}
          label="Santé à surveiller"
          value={metricValue(overview.businessesWithSmsProblems)}
          tone="amber"
        />
      </div>

      <Panel
        description="Commerces classés comme problème selon erreurs SMS ou inactivité prolongée."
        title="Comptes à surveiller"
      >
        {businessWorkspace.businesses.length > 0 ? (
          <TableShell>
            <thead>
              <tr>
                <th className={tableHeadClass}>Commerce</th>
                <th className={tableHeadClass}>Owner</th>
                <th className={tableHeadClass}>Santé</th>
                <th className={tableHeadClass}>Dernière activité</th>
                <th className={tableHeadClass}>Montant estimé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {businessWorkspace.businesses.slice(0, 8).map((business) => (
                <tr key={business.id}>
                  <td className={`${tableCellClass} font-black`}>
                    <Link
                      className="text-[var(--primary-strong)] hover:underline"
                      href={`/platform-admin/businesses/${business.id}`}
                    >
                      {business.name}
                    </Link>
                    <p className="mt-1 text-xs font-bold text-[var(--muted)]">
                      /{business.slug}
                    </p>
                  </td>
                  <td className={tableCellClass}>
                    {business.ownerEmail ?? "Non disponible"}
                  </td>
                  <td className={tableCellClass}>{business.health}</td>
                  <td className={tableCellClass}>
                    {formatAdminDate(business.lastActivityAt)}
                  </td>
                  <td className={tableCellClass}>
                    {formatAdminCurrency(business.estimatedAmountDueCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <p className="text-sm font-bold text-[var(--muted)]">
            Aucun compte en problème selon les données disponibles.
          </p>
        )}
      </Panel>
    </div>
  );
}
