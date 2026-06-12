import { notFound } from "next/navigation";

import {
  DashboardPageHeader,
  EmptyState,
  Panel,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import { loadPlatformAdminBusinessDetail } from "@/lib/platform-admin/data";
import { formatAdminCurrency, formatAdminDate } from "@/lib/platform-admin/helpers";

type BusinessDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function DefinitionGrid({
  rows
}: {
  rows: Array<{ label: string; value: string | number | null }>;
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <div
          className="rounded-xl border border-[var(--line)] bg-[#fbfaf7] p-4"
          key={row.label}
        >
          <dt className="text-xs font-black uppercase tracking-[0.08em] text-[var(--muted)]">
            {row.label}
          </dt>
          <dd className="mt-2 break-words text-sm font-black">
            {row.value ?? "Non disponible"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default async function PlatformAdminBusinessDetailPage({
  params
}: BusinessDetailPageProps) {
  const { id } = await params;
  const detail = await loadPlatformAdminBusinessDetail(id);

  if (!detail) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Détail read-only cross-tenant pour diagnostic plateforme. Aucune action de modification n'est disponible."
        title={detail.business.name}
      />

      <Panel title="Identity">
        <DefinitionGrid
          rows={[
            { label: "Organization ID", value: detail.identity.id },
            { label: "Nom", value: detail.identity.name },
            { label: "Slug", value: detail.identity.slug },
            { label: "Langue", value: detail.identity.defaultLanguage },
            { label: "Timezone", value: detail.identity.timezone },
            { label: "Créé", value: formatAdminDate(detail.identity.createdAt) }
          ]}
        />
      </Panel>

      <Panel title="Owner / Team">
        {detail.team.length > 0 ? (
          <TableShell>
            <thead>
              <tr>
                <th className={tableHeadClass}>Membre</th>
                <th className={tableHeadClass}>Rôle</th>
                <th className={tableHeadClass}>Statut</th>
                <th className={tableHeadClass}>Créé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {detail.team.map((member) => (
                <tr key={`${member.userId}-${member.role}`}>
                  <td className={tableCellClass}>
                    <p className="font-black">
                      {member.name ?? member.email ?? member.userId}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {member.email ?? "Email non disponible"}
                    </p>
                  </td>
                  <td className={tableCellClass}>{member.role}</td>
                  <td className={tableCellClass}>{member.status}</td>
                  <td className={tableCellClass}>
                    {formatAdminDate(member.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <EmptyState
            description="Aucun membre actif ou profil lisible dans les données disponibles."
            title="Aucune équipe trouvée."
          />
        )}
      </Panel>

      <Panel title="Usage">
        <DefinitionGrid
          rows={[
            { label: "Clients", value: detail.usage.customers },
            { label: "Opt-in", value: detail.business.customersOptIn },
            { label: "Opt-out", value: detail.business.customersOptOut },
            { label: "Waitlist entries", value: detail.usage.waitlistEntries },
            { label: "Services", value: detail.usage.services },
            { label: "Appointments", value: detail.usage.appointments },
            { label: "Openings", value: detail.usage.openings },
            { label: "Opening offers", value: detail.usage.openingOffers },
            { label: "Réponses", value: detail.usage.responses },
            { label: "SMS outbound récents", value: detail.usage.smsOutbound },
            { label: "SMS inbound récents", value: detail.usage.smsInbound }
          ]}
        />
      </Panel>

      <Panel title="SMS Health">
        <DefinitionGrid
          rows={[
            { label: "Santé", value: detail.business.health },
            {
              label: "Delivered ce mois",
              value: detail.business.smsDeliveredThisMonth
            },
            {
              label: "Failed/undelivered ce mois",
              value:
                detail.business.smsFailedThisMonth +
                detail.business.smsUndeliveredThisMonth
            },
            { label: "Dernier error code", value: detail.smsHealth.lastErrorCode },
            {
              label: "Dernier callback",
              value: formatAdminDate(detail.smsHealth.lastCallbackAt)
            }
          ]}
        />
      </Panel>

      <Panel title="Derniers SMS avec problème">
        {detail.smsHealth.recentProblems.length > 0 ? (
          <TableShell>
            <thead>
              <tr>
                <th className={tableHeadClass}>Date</th>
                <th className={tableHeadClass}>Statut</th>
                <th className={tableHeadClass}>Error</th>
                <th className={tableHeadClass}>Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {detail.smsHealth.recentProblems.map((message) => (
                <tr key={message.id}>
                  <td className={tableCellClass}>
                    {formatAdminDate(message.created_at)}
                  </td>
                  <td className={tableCellClass}>{message.status}</td>
                  <td className={tableCellClass}>
                    {message.error_code ?? "Non disponible"}
                  </td>
                  <td className={`${tableCellClass} max-w-xl`}>
                    {message.error_message ?? message.body}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <EmptyState
            description="Aucun SMS failed ou undelivered dans les données récentes chargées."
            title="Aucun problème SMS récent."
          />
        )}
      </Panel>

      <Panel title="Recovery / Revenue">
        <DefinitionGrid
          rows={[
            {
              label: "Openings à valider",
              value: detail.recovery.openingsAwaitingValidation
            },
            { label: "Openings filled", value: detail.recovery.openingsFilled },
            {
              label: "Revenus récupérés",
              value: formatAdminCurrency(detail.recovery.recoveredValueCents)
            },
            {
              label: "Montant estimé dû",
              value: formatAdminCurrency(detail.recovery.estimatedAmountDueCents)
            }
          ]}
        />
      </Panel>

      <Panel title="Activité récente">
        {detail.recentAuditLogs.length > 0 ? (
          <TableShell>
            <thead>
              <tr>
                <th className={tableHeadClass}>Date</th>
                <th className={tableHeadClass}>Action</th>
                <th className={tableHeadClass}>Entité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {detail.recentAuditLogs.map((event) => (
                <tr key={event.id}>
                  <td className={tableCellClass}>
                    {formatAdminDate(event.created_at)}
                  </td>
                  <td className={tableCellClass}>{event.action}</td>
                  <td className={tableCellClass}>
                    {event.entity_type} / {event.entity_id ?? "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <EmptyState
            description="Aucun audit log récent disponible pour ce commerce."
            title="Aucune activité récente."
          />
        )}
      </Panel>
    </div>
  );
}
