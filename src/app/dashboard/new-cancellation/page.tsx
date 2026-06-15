import {
  DashboardPageHeader,
  EmptyState,
  Panel
} from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/form-field";
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
        description="Creez une ouverture de derniere minute, preparez les clients admissibles et gardez la confirmation sous controle manuel."
        title="Nouvelle annulation"
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <Panel title="Details du creneau">
          {error ? (
            <p className="mb-4 rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
              {error}
            </p>
          ) : null}
          <form action={createOpeningAction} className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <FormField htmlFor="title" label="Titre" required>
                <Input id="title" name="title" required />
              </FormField>
            </div>
            <FormField htmlFor="serviceId" label="Service">
              <Select id="serviceId" name="serviceId">
                <option value="">Any service</option>
                {data.services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField htmlFor="startTime" label="Debut" required>
              <Input id="startTime" name="startTime" required type="datetime-local" />
            </FormField>
            <FormField htmlFor="endTime" label="Fin" required>
              <Input id="endTime" name="endTime" required type="datetime-local" />
            </FormField>
            <FormField htmlFor="estimatedValue" label="Valeur recuperee estimee">
              <Input
                id="estimatedValue"
                min="0"
                name="estimatedValue"
                placeholder="55.00"
                step="0.01"
                type="number"
              />
            </FormField>
            <FormField htmlFor="offerLabel" label="Offre">
              <Input
                id="offerLabel"
                name="offerLabel"
                placeholder="15% today only"
              />
            </FormField>
            <div className="md:col-span-2">
              <FormField htmlFor="internalNote" label="Note interne">
                <Textarea id="internalNote" name="internalNote" />
              </FormField>
            </div>
            <Button
              className="md:col-span-2"
              disabled={!canSendSmsAlerts}
              type="submit"
            >
              {getOpeningAlertButtonLabel(smsStatus)}
            </Button>
          </form>
        </Panel>
        <Panel title="Clients admissibles">
          {data.eligibleCustomers.length > 0 ? (
            <div className="grid gap-3">
              {data.eligibleCustomers.map((customer) => (
                <div
                  className="rounded-2xl border border-[var(--line)] bg-slate-50 p-4"
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
          <p className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-800">
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
