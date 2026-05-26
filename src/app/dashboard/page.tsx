import Link from "next/link";

import {
  DashboardPageHeader,
  MetricCard,
  Panel,
  StatusBadge,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import {
  dashboardBusiness,
  dashboardCancellations,
  dashboardReplies,
  findClient,
  findService,
  formatCurrency
} from "@/lib/dashboard/mock-data";

export default function DashboardPage() {
  const recovered = dashboardCancellations.filter(
    (cancellation) => cancellation.status === "Récupérée"
  );
  const pendingReplies = dashboardReplies.filter(
    (reply) => reply.status === "En attente"
  );
  const smsSent = dashboardCancellations.reduce(
    (total, cancellation) => total + cancellation.clientsContacted,
    0
  );
  const recoveredRevenue = recovered.reduce(
    (total, cancellation) => total + cancellation.estimatedValueCents,
    0
  );
  const responseRate =
    smsSent === 0 ? 0 : Math.round((dashboardReplies.length / smsSent) * 100);
  const notRecovered = dashboardCancellations.filter(
    (cancellation) => cancellation.status === "Non récupérée"
  );

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        action={
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white shadow-[0_16px_32px_rgba(35,117,107,0.2)] transition hover:bg-[var(--primary-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            href="/dashboard/new-cancellation"
          >
            Nouvelle annulation
          </Link>
        }
        description={`Vue complète de ${dashboardBusiness.name} : réponses SMS, créneaux récupérés, activité récente et valeur estimée.`}
        title="Tableau de bord"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          detail="Réponses à traiter dans l'ordre de réception."
          label="Réponses en attente"
          value={String(pendingReplies.length)}
          tone="amber"
        />
        <MetricCard
          detail="Confirmés manuellement par l'équipe."
          label="Rendez-vous récupérés"
          value={String(recovered.length)}
          tone="green"
        />
        <MetricCard
          detail="Valeur illustrative basée sur les prix estimés."
          label="Revenus estimés récupérés"
          value={formatCurrency(recoveredRevenue)}
          tone="green"
        />
        <MetricCard
          detail="Aucun envoi réel sans provider SMS configuré."
          label="SMS envoyés"
          value={String(smsSent)}
          tone="violet"
        />
        <MetricCard
          detail="Réponses reçues divisées par clients contactés."
          label="Taux de réponse"
          value={`${responseRate}%`}
        />
        <MetricCard
          detail="Créneaux fermés sans confirmation."
          label="Annulations non récupérées"
          value={String(notRecovered.length)}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          description="Les réponses exactes restent visibles. L'interprétation est seulement une aide."
          title="Réponses récentes"
        >
          <TableShell>
            <thead>
              <tr>
                <th className={tableHeadClass}>Ordre</th>
                <th className={tableHeadClass}>Client</th>
                <th className={tableHeadClass}>Réponse exacte</th>
                <th className={tableHeadClass}>Reçu à</th>
                <th className={tableHeadClass}>Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {dashboardReplies.map((reply) => {
                const client = findClient(reply.clientId);
                return (
                  <tr key={reply.id}>
                    <td className={tableCellClass}>{reply.order}</td>
                    <td className={tableCellClass}>
                      <div className="font-bold">{client?.name}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {reply.phone}
                      </div>
                    </td>
                    <td className={tableCellClass}>{reply.rawBody}</td>
                    <td className={tableCellClass}>
                      {new Date(reply.receivedAt).toLocaleTimeString("fr-CA", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className={tableCellClass}>
                      <StatusBadge>{reply.status}</StatusBadge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        </Panel>

        <Panel
          description="Les annulations les plus récentes avec leur statut commercial."
          title="Annulations récentes"
        >
          <div className="grid gap-3">
            {dashboardCancellations.map((cancellation) => {
              const service = findService(cancellation.serviceId);
              const confirmed = findClient(cancellation.confirmedClientId);
              return (
                <Link
                  className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4 transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                  href={`/dashboard/cancellations/${cancellation.id}`}
                  key={cancellation.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black">
                        {cancellation.time} · {service?.name}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {cancellation.clientsContacted} contactés ·{" "}
                        {cancellation.replies} réponses
                      </p>
                    </div>
                    <StatusBadge>{cancellation.status}</StatusBadge>
                  </div>
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    Confirmé : {confirmed?.name ?? "Aucun client confirmé"}
                  </p>
                </Link>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Performance mensuelle">
          <div className="space-y-4">
            {[
              ["Créneaux récupérés", "78%"],
              ["Réponses reçues", "54%"],
              ["SMS avec consentement", "92%"]
            ].map(([label, width]) => (
              <div key={label}>
                <div className="flex justify-between text-sm font-bold">
                  <span>{label}</span>
                  <span>{width}</span>
                </div>
                <div className="mt-2 h-3 rounded-full bg-[#edf1ec]">
                  <div
                    className="h-3 rounded-full bg-[var(--primary)]"
                    style={{ width }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Activité SMS récente">
          <div className="grid gap-3">
            {dashboardCancellations.flatMap((cancellation) =>
              cancellation.activity.map((activity) => (
                <div
                  className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4"
                  key={activity.id}
                >
                  <p className="font-bold">{activity.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {activity.detail}
                  </p>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
