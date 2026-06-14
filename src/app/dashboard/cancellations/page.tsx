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
import { loadOpenings } from "@/lib/dashboard/operations-data";
import { formatOpeningStatus } from "@/lib/dashboard/status-labels";

function formatCurrency(cents: number | null) {
  if (cents === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD"
  }).format(cents / 100);
}

export default async function CancellationsPage() {
  const openings = await loadOpenings();

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        action={
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white"
            href="/dashboard/new-cancellation"
          >
            Nouvelle annulation
          </Link>
        }
        description="Historique reel des opportunites d'annulation de cette organisation."
        title="Annulations"
      />
      <Panel title="Historique">
        {openings.length > 0 ? (
          <TableShell>
            <thead>
              <tr>
                <th className={tableHeadClass}>Title</th>
                <th className={tableHeadClass}>Start</th>
                <th className={tableHeadClass}>End</th>
                <th className={tableHeadClass}>Status</th>
                <th className={tableHeadClass}>Estimated value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {openings.map((opening) => (
                <tr key={opening.id}>
                  <td className={tableCellClass}>
                    <Link
                      className="font-bold underline-offset-4 hover:underline"
                      href={`/dashboard/cancellations/${opening.id}`}
                    >
                      {opening.title}
                    </Link>
                  </td>
                  <td className={tableCellClass}>
                    {new Date(opening.start_time).toLocaleString("fr-CA")}
                  </td>
                  <td className={tableCellClass}>
                    {new Date(opening.end_time).toLocaleString("fr-CA")}
                  </td>
                  <td className={tableCellClass}>
                    <StatusBadge>{formatOpeningStatus(opening.status, "fr")}</StatusBadge>
                  </td>
                  <td className={tableCellClass}>
                    {formatCurrency(opening.displayValueCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <EmptyState
            description="Creez une premiere annulation pour suivre les clients contactes, les reponses recues et la decision de confirmation."
            title="Aucune annulation pour le moment."
          />
        )}
      </Panel>
    </div>
  );
}
