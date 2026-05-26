import {
  DashboardPageHeader,
  EmptyState,
  Panel,
  StatusBadge,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import { dashboardServices, formatCurrency } from "@/lib/dashboard/mock-data";

export default function ServicesPage() {
  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        action={
          <button
            className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-black text-white"
            type="button"
          >
            Add service
          </button>
        }
        description="Les services alimentent la génération automatique de SMS, la sélection de clients et les statistiques."
        title="Services"
      />
      <Panel title="Catalogue de services">
        {dashboardServices.length > 0 ? (
          <TableShell>
            <thead>
              <tr>
                <th className={tableHeadClass}>Service name</th>
                <th className={tableHeadClass}>Duration</th>
                <th className={tableHeadClass}>Estimated price</th>
                <th className={tableHeadClass}>Category</th>
                <th className={tableHeadClass}>Active/inactive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {dashboardServices.map((service) => (
                <tr key={service.id}>
                  <td className={`${tableCellClass} font-black`}>
                    {service.name}
                  </td>
                  <td className={tableCellClass}>
                    {service.durationMinutes} min
                  </td>
                  <td className={tableCellClass}>
                    {formatCurrency(service.estimatedPriceCents)}
                  </td>
                  <td className={tableCellClass}>{service.category}</td>
                  <td className={tableCellClass}>
                    <StatusBadge>{service.active ? "Actif" : "Inactif"}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <EmptyState
            description="Ajoutez les services vendus par le commerce afin de personnaliser les alertes SMS et les analyses."
            title="Aucun service configuré."
          />
        )}
      </Panel>
    </div>
  );
}
