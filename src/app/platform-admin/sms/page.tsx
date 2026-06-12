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
import { loadPlatformAdminSmsHealth } from "@/lib/platform-admin/data";
import { formatAdminDate } from "@/lib/platform-admin/helpers";

export default async function PlatformAdminSmsPage() {
  const sms = await loadPlatformAdminSmsHealth();

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Diagnostic read-only des SMS sortants, entrants, callbacks et erreurs récentes."
        title="Santé SMS"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="SMS sortants créés aujourd'hui."
          label="Outbound today"
          value={String(sms.outboundTodayCount)}
        />
        <MetricCard
          detail={`${sms.deliveredThisMonthCount} delivered ce mois.`}
          label="Outbound ce mois"
          value={String(sms.outboundThisMonthCount)}
          tone="violet"
        />
        <MetricCard
          detail="Réponses entrantes enregistrées ce mois."
          label="Inbound ce mois"
          value={String(sms.inboundThisMonthCount)}
          tone="green"
        />
        <MetricCard
          detail={`${sms.undeliveredThisMonthCount} undelivered ce mois.`}
          label="Failed ce mois"
          value={String(sms.failedThisMonthCount)}
          tone="amber"
        />
        <MetricCard
          detail="Messages sortants sans callback final connu."
          label="Sans callback"
          value={String(sms.messagesWithoutCallbackCount)}
          tone="amber"
        />
        <MetricCard
          detail="Consentements opt-out enregistrés."
          label="Opt-outs"
          value={String(sms.optOutCount)}
        />
      </div>

      <Panel title="Par commerce">
        {sms.businesses.length > 0 ? (
          <TableShell>
            <thead>
              <tr>
                <th className={tableHeadClass}>Commerce</th>
                <th className={tableHeadClass}>Outbound</th>
                <th className={tableHeadClass}>Inbound</th>
                <th className={tableHeadClass}>Delivered</th>
                <th className={tableHeadClass}>Failed/undelivered</th>
                <th className={tableHeadClass}>Dernière activité</th>
                <th className={tableHeadClass}>Santé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {sms.businesses.map((business) => (
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
                  <td className={tableCellClass}>{business.smsSentThisMonth}</td>
                  <td className={tableCellClass}>{business.smsInboundThisMonth}</td>
                  <td className={tableCellClass}>
                    {business.smsDeliveredThisMonth}
                  </td>
                  <td className={tableCellClass}>
                    {business.smsFailedThisMonth +
                      business.smsUndeliveredThisMonth}
                  </td>
                  <td className={tableCellClass}>
                    {formatAdminDate(business.lastActivityAt)}
                  </td>
                  <td className={tableCellClass}>{business.health}</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <EmptyState
            description="Aucun commerce ou message SMS disponible."
            title="Aucune donnée SMS."
          />
        )}
      </Panel>

      <Panel title="Derniers error codes Twilio / provider">
        {sms.recentErrors.length > 0 ? (
          <TableShell>
            <thead>
              <tr>
                <th className={tableHeadClass}>Date</th>
                <th className={tableHeadClass}>Commerce</th>
                <th className={tableHeadClass}>Code</th>
                <th className={tableHeadClass}>Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {sms.recentErrors.map((error) => (
                <tr key={`${error.organizationId}-${error.createdAt}-${error.errorCode}`}>
                  <td className={tableCellClass}>
                    {formatAdminDate(error.createdAt)}
                  </td>
                  <td className={tableCellClass}>{error.organizationId}</td>
                  <td className={tableCellClass}>
                    {error.errorCode ?? "Non disponible"}
                  </td>
                  <td className={tableCellClass}>
                    {error.errorMessage ?? "Non disponible"}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <EmptyState
            description="Aucun error_code récent dans les SMS chargés."
            title="Aucune erreur provider récente."
          />
        )}
      </Panel>
    </div>
  );
}
