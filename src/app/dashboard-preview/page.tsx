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

export default function DashboardPreviewPage() {
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

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-4 py-8 text-[var(--foreground)]">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div className="rounded-2xl border border-[#f0d48a] bg-[#fff8df] p-4 text-sm font-bold text-[#6f4f00]">
          Demo data · Preview only. This page uses fictional clients and
          cancellations for sales demos. It is not the authenticated merchant
          dashboard.
        </div>

        <DashboardPageHeader
          action={
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white"
              href="/dashboard"
            >
              Retour dashboard reel
            </Link>
          }
          description={`Preview only for ${dashboardBusiness.name}: sample replies, recovered spots, recent activity and estimated value.`}
          title="Dashboard preview"
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            detail="Sample replies waiting for a manual decision."
            label="Reponses en attente"
            value={String(pendingReplies.length)}
            tone="amber"
          />
          <MetricCard
            detail="Sample appointments manually recovered."
            label="Rendez-vous recuperes"
            value={String(recovered.length)}
            tone="green"
          />
          <MetricCard
            detail="Estimated from demo service prices."
            label="Revenus estimes recuperes"
            value={formatCurrency(recoveredRevenue)}
            tone="green"
          />
          <MetricCard
            detail="Demo outbound count only."
            label="SMS envoyes"
            value={String(smsSent)}
            tone="violet"
          />
          <MetricCard
            detail="Demo replies divided by demo contacted clients."
            label="Taux de reponse"
            value={`${responseRate}%`}
          />
          <MetricCard
            detail="Demo route only."
            label="Mode"
            value="Demo"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel title="Reponses recentes demo">
            <TableShell>
              <thead>
                <tr>
                  <th className={tableHeadClass}>Ordre</th>
                  <th className={tableHeadClass}>Client</th>
                  <th className={tableHeadClass}>Reponse exacte</th>
                  <th className={tableHeadClass}>Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] bg-white">
                {dashboardReplies.map((reply) => {
                  const client = findClient(reply.clientId);
                  return (
                    <tr key={reply.id}>
                      <td className={tableCellClass}>{reply.order}</td>
                      <td className={tableCellClass}>{client?.name}</td>
                      <td className={tableCellClass}>{reply.rawBody}</td>
                      <td className={tableCellClass}>
                        <StatusBadge>{reply.status}</StatusBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableShell>
          </Panel>

          <Panel title="Annulations demo">
            <div className="grid gap-3">
              {dashboardCancellations.map((cancellation) => {
                const service = findService(cancellation.serviceId);
                return (
                  <article
                    className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4"
                    key={cancellation.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">
                          {cancellation.time} · {service?.name}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {cancellation.clientsContacted} demo contacts ·{" "}
                          {cancellation.replies} demo replies
                        </p>
                      </div>
                      <StatusBadge>{cancellation.status}</StatusBadge>
                    </div>
                  </article>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
