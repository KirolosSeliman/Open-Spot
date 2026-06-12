import Link from "next/link";

import {
  DashboardPageHeader,
  EmptyState,
  Panel,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import { loadPlatformAdminBusinesses } from "@/lib/platform-admin/data";
import { formatAdminCurrency, formatAdminDate } from "@/lib/platform-admin/helpers";

type BusinessesPageProps = {
  searchParams: Promise<{
    q?: string;
    health?: string;
    activity?: string;
    sort?: string;
  }>;
};

export default async function PlatformAdminBusinessesPage({
  searchParams
}: BusinessesPageProps) {
  const params = await searchParams;
  const { businesses, filters, totalCount, filteredCount } =
    await loadPlatformAdminBusinesses(params);

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Vue read-only de tous les commerces inscrits, avec recherche et filtres partageables par URL."
        title="Commerces"
      />

      <Panel title="Filtres">
        <form
          action="/platform-admin/businesses"
          className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]"
          method="get"
        >
          <label className="grid gap-2 text-sm font-bold">
            Recherche
            <input
              aria-label="Rechercher un commerce"
              autoComplete="off"
              className="min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3"
              defaultValue={filters.q}
              inputMode="search"
              maxLength={80}
              name="q"
              placeholder="Nom, slug, owner email..."
              type="search"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Santé
            <select
              className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
              defaultValue={filters.health}
              name="health"
            >
              <option value="all">Tous</option>
              <option value="ok">OK</option>
              <option value="warning">Attention</option>
              <option value="problem">Problème</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Activité
            <select
              className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
              defaultValue={filters.activity}
              name="activity"
            >
              <option value="all">Tous</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Tri
            <select
              className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
              defaultValue={filters.sort}
              name="sort"
            >
              <option value="created_desc">Création récente</option>
              <option value="activity_desc">Activité récente</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white"
              type="submit"
            >
              Filtrer
            </button>
            <Link
              className="inline-flex min-h-11 items-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black"
              href="/platform-admin/businesses"
            >
              Réinitialiser
            </Link>
          </div>
        </form>
        <p className="mt-4 text-xs font-bold text-[var(--muted)]">
          {filteredCount} commerce{filteredCount > 1 ? "s" : ""} affiché
          {filteredCount > 1 ? "s" : ""} sur {totalCount}.
        </p>
      </Panel>

      <Panel title="Liste des commerces">
        {businesses.length > 0 ? (
          <TableShell>
            <thead>
              <tr>
                <th className={tableHeadClass}>Commerce</th>
                <th className={tableHeadClass}>Owner</th>
                <th className={tableHeadClass}>Billing</th>
                <th className={tableHeadClass}>Clients</th>
                <th className={tableHeadClass}>SMS mois</th>
                <th className={tableHeadClass}>Openings</th>
                <th className={tableHeadClass}>Montant estimé</th>
                <th className={tableHeadClass}>Santé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {businesses.map((business) => (
                <tr key={business.id}>
                  <td className={`${tableCellClass} min-w-56`}>
                    <Link
                      className="font-black text-[var(--primary-strong)] hover:underline"
                      href={`/platform-admin/businesses/${business.id}`}
                    >
                      {business.name}
                    </Link>
                    <p className="mt-1 text-xs font-bold text-[var(--muted)]">
                      /{business.slug}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Créé: {formatAdminDate(business.createdAt)}
                    </p>
                  </td>
                  <td className={tableCellClass}>
                    {business.ownerEmail ?? "Non disponible"}
                  </td>
                  <td className={tableCellClass}>
                    <p>{business.billingStatus}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {business.subscriptionStatus}
                    </p>
                  </td>
                  <td className={tableCellClass}>
                    {business.customersTotal}
                    <p className="text-xs text-[var(--muted)]">
                      {business.customersOptIn} opt-in / {business.customersOptOut} opt-out
                    </p>
                  </td>
                  <td className={tableCellClass}>
                    {business.smsSentThisMonth}
                    <p className="text-xs text-[var(--muted)]">
                      {business.smsInboundThisMonth} inbound
                    </p>
                  </td>
                  <td className={tableCellClass}>
                    {business.openingsCreated}
                    <p className="text-xs text-[var(--muted)]">
                      {business.openingsAwaitingValidation} à valider
                    </p>
                  </td>
                  <td className={tableCellClass}>
                    {formatAdminCurrency(business.estimatedAmountDueCents)}
                  </td>
                  <td className={tableCellClass}>{business.health}</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <EmptyState
            description="Essayez une recherche plus large ou réinitialisez les filtres."
            title="Aucun commerce ne correspond à ces filtres."
          />
        )}
      </Panel>
    </div>
  );
}
