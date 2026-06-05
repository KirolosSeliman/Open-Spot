import {
  DashboardPageHeader,
  EmptyState,
  ManualValidationNotice,
  Panel
} from "@/components/dashboard/dashboard-ui";
import { createOpeningAction } from "@/lib/dashboard/actions";
import { loadOpeningCreationData } from "@/lib/dashboard/operations-data";
import {
  getOpeningAlertButtonLabel,
  getOpeningAlertModeCopy,
  getSmsRuntimeStatus
} from "@/lib/sms/runtime-status";

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
  const smsStatus = getSmsRuntimeStatus();
  const canSendSmsAlerts =
    smsStatus.canSendOpeningAlerts && data.smsPersistence.ready;
  const smsBlockingReasons = [
    ...smsStatus.blockingReasons,
    ...data.smsPersistence.blockingReasons
  ];

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Creez une opportunite d'annulation, preparez les clients admissibles et gardez la confirmation sous controle manuel."
        title="Nouvelle annulation"
      />
      <ManualValidationNotice>
        Aucune confirmation automatique: l&apos;alerte SMS prepare les reponses, puis
        le commercant choisit manuellement qui confirmer.
      </ManualValidationNotice>
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
              className="min-h-11 rounded-full bg-[linear-gradient(135deg,#155eef,#0b5fff)] px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(21,94,239,0.18)] disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
              disabled={!canSendSmsAlerts}
              type="submit"
            >
              {getOpeningAlertButtonLabel(smsStatus)}
            </button>
          </form>
        </Panel>
        <Panel title="Clients admissibles">
          {data.eligibleCustomers.length > 0 ? (
            <div className="grid gap-3">
              {data.eligibleCustomers.map((customer) => (
                <div
                  className="rounded-[1.25rem] border border-[#e2e8f0] bg-[#f8fafc] p-4"
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
          <p className="mt-4 rounded-[1.25rem] border border-[#bfdbfe] bg-[#eff6ff] p-4 text-sm font-bold leading-6 text-[#1d4ed8]">
            {getOpeningAlertModeCopy(smsStatus)}
          </p>
          {smsBlockingReasons.length > 0 ? (
            <ul className="mt-3 grid gap-2 text-sm font-bold text-[#8a1f17]">
              {smsBlockingReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
