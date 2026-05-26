import {
  DashboardPageHeader,
  EmptyState,
  Panel,
  StatusBadge,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import { dashboardClients } from "@/lib/dashboard/mock-data";

export default function ClientsPage() {
  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        action={
          <div className="flex flex-wrap gap-2">
            {["Add client", "Import CSV", "Export CSV"].map((label) => (
              <button
                className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-black"
                key={label}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        }
        description="Gérez les clients admissibles aux alertes SMS, leur consentement, leurs services d'intérêt et leur statut."
        title="Clients"
      />
      <Panel title="Gestion clients">
        {dashboardClients.length > 0 ? (
          <TableShell>
            <thead>
              <tr>
                <th className={tableHeadClass}>Name</th>
                <th className={tableHeadClass}>Phone</th>
                <th className={tableHeadClass}>Email</th>
                <th className={tableHeadClass}>Language</th>
                <th className={tableHeadClass}>Interested services</th>
                <th className={tableHeadClass}>Consent</th>
                <th className={tableHeadClass}>Status</th>
                <th className={tableHeadClass}>Last response</th>
                <th className={tableHeadClass}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {dashboardClients.map((client) => (
                <tr key={client.id}>
                  <td className={tableCellClass}>
                    <div className="font-black">{client.name}</div>
                    <div className="text-xs text-[var(--muted)]">
                      Ajouté le {client.dateAdded} · {client.signupSource}
                    </div>
                  </td>
                  <td className={tableCellClass}>{client.phone}</td>
                  <td className={tableCellClass}>{client.email ?? "—"}</td>
                  <td className={tableCellClass}>
                    {client.preferredLanguage.toUpperCase()}
                  </td>
                  <td className={tableCellClass}>
                    {client.interestedServices.join(", ")}
                  </td>
                  <td className={tableCellClass}>{client.smsConsent}</td>
                  <td className={tableCellClass}>
                    <StatusBadge>{client.status}</StatusBadge>
                  </td>
                  <td className={tableCellClass}>{client.lastResponse}</td>
                  <td className={tableCellClass}>
                    <div className="flex flex-wrap gap-2">
                      {["Edit", "Archive", "Unsubscribe"].map((action) => (
                        <button
                          className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-bold"
                          key={action}
                          type="button"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <EmptyState
            description="Importez un CSV ou ajoutez un client manuellement pour commencer à bâtir votre liste avec consentement SMS."
            title="Aucun client pour le moment."
          />
        )}
      </Panel>
    </div>
  );
}
