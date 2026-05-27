import Link from "next/link";

import {
  DashboardPageHeader,
  EmptyState,
  Panel,
  StatusBadge,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import {
  dashboardCancellations,
  findClient,
  findService,
  formatCurrency
} from "@/lib/dashboard/mock-data";

export default function CancellationsPage() {
  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Historique des places disponibles, des clients contactés, des réponses et de la valeur estimée."
        title="Ouvertures"
      />
      <Panel title="Historique">
        {dashboardCancellations.length > 0 ? (
          <TableShell>
            <thead>
              <tr>
                <th className={tableHeadClass}>Date</th>
                <th className={tableHeadClass}>Heure</th>
                <th className={tableHeadClass}>Service</th>
                <th className={tableHeadClass}>Clients contactés</th>
                <th className={tableHeadClass}>Réponses</th>
                <th className={tableHeadClass}>Client confirmé</th>
                <th className={tableHeadClass}>Statut</th>
                <th className={tableHeadClass}>Valeur estimée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {dashboardCancellations.map((cancellation) => {
                const service = findService(cancellation.serviceId);
                const client = findClient(cancellation.confirmedClientId);
                return (
                  <tr key={cancellation.id}>
                    <td className={tableCellClass}>
                      <Link
                        className="font-bold underline-offset-4 hover:underline"
                        href={`/dashboard/cancellations/${cancellation.id}`}
                      >
                        {cancellation.date}
                      </Link>
                    </td>
                    <td className={tableCellClass}>{cancellation.time}</td>
                    <td className={tableCellClass}>{service?.name}</td>
                    <td className={tableCellClass}>
                      {cancellation.clientsContacted}
                    </td>
                    <td className={tableCellClass}>{cancellation.replies}</td>
                    <td className={tableCellClass}>
                      {client?.name ?? "Aucun"}
                    </td>
                    <td className={tableCellClass}>
                      <StatusBadge>{cancellation.status}</StatusBadge>
                    </td>
                    <td className={tableCellClass}>
                      {formatCurrency(cancellation.estimatedValueCents)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        ) : (
          <EmptyState
            description="Créez une première ouverture pour suivre les clients contactés, les réponses reçues et la décision de confirmation."
            title="Aucune ouverture pour le moment."
          />
        )}
      </Panel>
    </div>
  );
}
