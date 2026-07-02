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
  createServiceAction,
  toggleServiceActiveAction,
  updateServiceAction
} from "@/lib/dashboard/actions";
import { loadServices } from "@/lib/dashboard/operations-data";

type ServicesPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function formatCurrency(cents: number | null) {
  if (cents === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD"
  }).format(cents / 100);
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const [{ error }, services] = await Promise.all([
    searchParams,
    loadServices()
  ]);

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Ajoutez les services réels qui alimentent les annulations, les clients admissibles et les statistiques."
        title="Services"
      />
      <Panel title="Ajouter un service">
        {error ? (
          <p className="mb-4 rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
            {error}
          </p>
        ) : null}
        <form action={createServiceAction} className="grid gap-4 md:grid-cols-4">
          <label className="grid gap-2 text-sm font-bold md:col-span-2">
            Nom
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3"
              name="name"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Durée (min)
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3"
              min="1"
              name="durationMinutes"
              required
              type="number"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Prix
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3"
              min="0"
              name="normalPrice"
              step="0.01"
              type="number"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold md:col-span-4">
            Description
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3"
              name="description"
            />
          </label>
          <button
            className="min-h-11 self-end rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(79,125,243,0.2)] transition hover:bg-[var(--primary-strong)]"
            type="submit"
          >
            Ajouter le service
          </button>
        </form>
      </Panel>
      <Panel title="Catalogue de services">
        {services.length > 0 ? (
          <TableShell>
            <thead>
              <tr>
                <th className={tableHeadClass}>Nom du service</th>
                <th className={tableHeadClass}>Durée</th>
                <th className={tableHeadClass}>Prix estimé</th>
                <th className={tableHeadClass}>Statut</th>
                <th className={tableHeadClass}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {services.map((service) => (
                <tr key={service.id}>
                  <td className={tableCellClass}>
                    <form
                      action={updateServiceAction}
                      className="grid min-w-0 w-full gap-2 md:min-w-56"
                      id={`service-update-${service.id}`}
                    >
                      <input name="serviceId" type="hidden" value={service.id} />
                      <input
                        name="active"
                        type="hidden"
                        value={service.active ? "true" : "false"}
                      />
                      <label className="grid gap-1 text-xs font-bold">
                        Nom
                        <input
                          className="min-h-10 rounded-2xl border border-[var(--line)] bg-white px-3 text-sm"
                          defaultValue={service.name}
                          name="name"
                          required
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-bold">
                        Description
                        <input
                          className="min-h-10 rounded-2xl border border-[var(--line)] bg-white px-3 text-sm"
                          defaultValue={service.description ?? ""}
                          name="description"
                        />
                      </label>
                    </form>
                  </td>
                  <td className={tableCellClass}>
                    <label className="grid gap-1 text-xs font-bold">
                      Durée (min)
                      <input
                        className="min-h-10 w-24 rounded-2xl border border-[var(--line)] bg-white px-3 text-sm"
                        defaultValue={service.duration_minutes}
                        form={`service-update-${service.id}`}
                        min="1"
                        name="durationMinutes"
                        required
                        type="number"
                      />
                    </label>
                  </td>
                  <td className={tableCellClass}>
                    <label className="grid gap-1 text-xs font-bold">
                      CAD
                      <input
                        className="min-h-10 w-28 rounded-2xl border border-[var(--line)] bg-white px-3 text-sm"
                        defaultValue={
                          service.normal_price_cents === null
                            ? ""
                            : String(service.normal_price_cents / 100)
                        }
                        form={`service-update-${service.id}`}
                        min="0"
                        name="normalPrice"
                        step="0.01"
                        type="number"
                      />
                    </label>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatCurrency(service.normal_price_cents)}
                    </p>
                  </td>
                  <td className={tableCellClass}>
                    <StatusBadge>{service.active ? "Actif" : "Inactif"}</StatusBadge>
                  </td>
                  <td className={tableCellClass}>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="min-h-10 rounded-full bg-[var(--primary)] px-4 text-xs font-black text-white shadow-[0_10px_20px_rgba(79,125,243,0.18)] transition hover:bg-[var(--primary-strong)]"
                        form={`service-update-${service.id}`}
                        type="submit"
                      >
                        Enregistrer
                      </button>
                      <form action={toggleServiceActiveAction}>
                        <input name="serviceId" type="hidden" value={service.id} />
                        <input
                          name="active"
                          type="hidden"
                          value={service.active ? "false" : "true"}
                        />
                        <button
                          className="min-h-10 rounded-full border border-[var(--line)] bg-white px-4 text-xs font-black"
                          type="submit"
                        >
                          {service.active ? "Désactiver" : "Réactiver"}
                        </button>
                      </form>
                    </div>
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
