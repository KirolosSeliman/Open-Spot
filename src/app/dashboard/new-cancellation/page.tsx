import {
  DashboardPageHeader,
  EmptyState,
  Panel
} from "@/components/dashboard/dashboard-ui";
import { createOpeningAction } from "@/lib/dashboard/actions";
import { loadOpeningCreationData } from "@/lib/dashboard/operations-data";

type NewCancellationPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewCancellationPage({
  searchParams
}: NewCancellationPageProps) {
  const [{ error }, data] = await Promise.all([
    searchParams,
    loadOpeningCreationData()
  ]);

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Creez une opportunite d'annulation, preparez les clients admissibles et gardez la confirmation sous controle manuel."
        title="Nouvelle annulation"
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <Panel title="Details du creneau">
          {error ? (
            <p className="mb-4 rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
              {error}
            </p>
          ) : null}
          <form action={createOpeningAction} className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold md:col-span-2">
              Title
              <input
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                name="title"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Service
              <select
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                name="serviceId"
              >
                <option value="">Any service</option>
                {data.services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Start
              <input
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                name="startTime"
                required
                type="datetime-local"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              End
              <input
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                name="endTime"
                required
                type="datetime-local"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Offer label
              <input
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                name="offerLabel"
                placeholder="15% today only"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold md:col-span-2">
              Internal note
              <textarea
                className="min-h-24 rounded-xl border border-[var(--line)] bg-white px-3 py-2"
                name="internalNote"
              />
            </label>
            <button
              className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white md:col-span-2"
              type="submit"
            >
              Prepare opening
            </button>
          </form>
        </Panel>
        <Panel title="Clients admissibles">
          {data.eligibleCustomers.length > 0 ? (
            <div className="grid gap-3">
              {data.eligibleCustomers.map((customer) => (
                <div
                  className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4"
                  key={customer.id}
                >
                  <p className="font-black">{customer.full_name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {customer.phone_e164}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              description="Ajoutez des clients opted_in a la liste d'attente avant de preparer une alerte."
              title="Aucun client admissible."
            />
          )}
          <p className="mt-4 rounded-2xl bg-[#edf8f3] p-4 text-sm font-bold leading-6 text-[var(--primary-strong)]">
            Aucun SMS reel n&apos;est envoye ici. Open Spot cree l&apos;ouverture,
            prepare les clients opted-in admissibles, puis enregistre des SMS
            sortants avec le simulateur local.
          </p>
        </Panel>
      </div>
    </div>
  );
}
