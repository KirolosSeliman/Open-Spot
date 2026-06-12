import Link from "next/link";

import {
  DashboardPageHeader,
  EmptyState,
  MetricCard,
  Panel,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import { loadPlatformAdminBillingOverview } from "@/lib/platform-admin/data";
import { formatAdminCurrency } from "@/lib/platform-admin/helpers";

export default async function PlatformAdminBillingPage() {
  const billing = await loadPlatformAdminBillingOverview();

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Première version read-only. Les montants sont des estimations opérationnelles, pas des factures officielles."
        title="Facturation estimée"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          detail="Somme estimée depuis commission_records ou validations existantes."
          label="Montant estimé dû"
          value={formatAdminCurrency(billing.totalEstimatedDueCents)}
          tone="amber"
        />
        <MetricCard
          detail="Revenus récupérés déclarés par validation manuelle."
          label="Revenus récupérés"
          value={formatAdminCurrency(billing.totalRecoveredValueCents)}
          tone="green"
        />
        <MetricCard
          detail="Aucune collecte de paiement ou facture officielle dans cette version."
          label="Statut"
          value="Estimated"
        />
      </div>

      <Panel title="Par commerce">
        {billing.businesses.length > 0 ? (
          <TableShell>
            <thead>
              <tr>
                <th className={tableHeadClass}>Commerce</th>
                <th className={tableHeadClass}>Plan / statut</th>
                <th className={tableHeadClass}>SMS mois</th>
                <th className={tableHeadClass}>Revenus récupérés</th>
                <th className={tableHeadClass}>Montant estimé dû</th>
                <th className={tableHeadClass}>Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {billing.businesses.map((business) => (
                <tr key={business.id}>
                  <td className={tableCellClass}>
                    <Link
                      className="font-black text-[var(--primary-strong)] hover:underline"
                      href={`/platform-admin/businesses/${business.id}`}
                    >
                      {business.name}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      /{business.slug}
                    </p>
                  </td>
                  <td className={tableCellClass}>
                    <p>{business.billingStatus}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {business.subscriptionStatus}
                    </p>
                  </td>
                  <td className={tableCellClass}>{business.smsSentThisMonth}</td>
                  <td className={tableCellClass}>
                    {formatAdminCurrency(business.recoveredValueCents)}
                  </td>
                  <td className={tableCellClass}>
                    {formatAdminCurrency(business.estimatedAmountDueCents)}
                  </td>
                  <td className={tableCellClass}>
                    {business.estimatedAmountDueCents === null
                      ? "unknown"
                      : "estimated"}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <EmptyState
            description="Aucun commerce disponible pour calculer une estimation."
            title="Aucune donnée de facturation estimée."
          />
        )}
      </Panel>
    </div>
  );
}
