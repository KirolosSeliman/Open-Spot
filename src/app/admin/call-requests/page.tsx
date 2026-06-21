import { CallRequestsTable } from "@/components/admin/call-requests-table";
import {
  DashboardPageHeader,
  MetricCard,
  Panel
} from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { loadBookCallRequests } from "@/lib/admin/call-requests";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";
import { bookCallRequestStatuses } from "@/lib/book-call/validation";

type CallRequestsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const statusLabels = {
  new: "Nouveau",
  contacted: "Contacte",
  qualified: "Qualifie",
  closed: "Ferme",
  spam: "Spam"
} as const;

function firstParam(
  value: string | string[] | undefined,
  fallback = ""
) {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default async function CallRequestsPage({
  searchParams
}: CallRequestsPageProps) {
  await requireCurrentPlatformAdmin();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const status = firstParam(resolvedSearchParams.status, "all");
  const q = firstParam(resolvedSearchParams.q);
  const notice = firstParam(resolvedSearchParams.notice);
  const errorMessage = firstParam(resolvedSearchParams.error);
  const { filteredRequests, stats, error } = await loadBookCallRequests({
    q,
    status
  });

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Consultez les demandes d'appel Open Spot, contactez les commerces et gardez le statut de suivi a jour sans confirmer automatiquement de rendez-vous."
        title="Demandes d'appel"
      />

      {notice ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {notice}
        </p>
      ) : null}
      {errorMessage || error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          {errorMessage || error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard detail="Toutes les demandes sauvegardees" label="Total" value={String(stats.total)} />
        <MetricCard detail="Demandes a traiter" label="Nouvelles" tone="violet" value={String(stats.new)} />
        <MetricCard detail="Suivi deja commence" label="Contactees" value={String(stats.contacted)} />
        <MetricCard detail="Demandes pretes pour vente" label="Qualifiees" tone="green" value={String(stats.qualified)} />
      </div>

      <Panel
        description="Les liens SMS et email servent au suivi manuel seulement. Aucun SMS marketing et aucune confirmation de rendez-vous ne sont envoyes automatiquement depuis cette page."
        title="Boite de demandes"
      >
        <form className="mb-5 grid gap-3 md:grid-cols-[1fr_14rem_auto]" method="get">
          <input
            className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-semibold"
            defaultValue={q}
            name="q"
            placeholder="Rechercher nom, commerce, email, telephone..."
          />
          <select
            className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-bold"
            defaultValue={status}
            name="status"
          >
            <option value="all">Tous les statuts</option>
            {bookCallRequestStatuses.map((requestStatus) => (
              <option key={requestStatus} value={requestStatus}>
                {statusLabels[requestStatus]}
              </option>
            ))}
          </select>
          <Button type="submit">Filtrer</Button>
        </form>

        <CallRequestsTable requests={filteredRequests} />
      </Panel>
    </div>
  );
}
