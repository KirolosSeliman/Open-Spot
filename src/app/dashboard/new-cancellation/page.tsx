import {
  DashboardPageHeader,
  EmptyState,
  Panel
} from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/form-field";
import { createOpeningAction } from "@/lib/dashboard/actions";
import { loadOpeningCreationData } from "@/lib/dashboard/operations-data";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import { getRequestLocale } from "@/lib/i18n/locale";
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
  const locale = await getRequestLocale();
  const copy = getDashboardCopy(locale);
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
        description={copy.newCancellation.description}
        title={copy.newCancellation.title}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <Panel title={copy.newCancellation.detailsTitle}>
          {error ? (
            <p className="mb-4 rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
              {error}
            </p>
          ) : null}
          <form action={createOpeningAction} className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <FormField htmlFor="title" label={copy.newCancellation.titleLabel} required>
                <Input id="title" name="title" required />
              </FormField>
            </div>
            <FormField htmlFor="serviceId" label={copy.common.service}>
              <Select id="serviceId" name="serviceId">
                <option value="">{copy.newCancellation.anyService}</option>
                {data.services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField htmlFor="startTime" label={copy.common.start} required>
              <Input id="startTime" name="startTime" required type="datetime-local" />
            </FormField>
            <FormField htmlFor="endTime" label={copy.common.end} required>
              <Input id="endTime" name="endTime" required type="datetime-local" />
            </FormField>
            <FormField
              htmlFor="estimatedValue"
              label={copy.newCancellation.estimatedValue}
            >
              <Input
                id="estimatedValue"
                min="0"
                name="estimatedValue"
                placeholder="55.00"
                step="0.01"
                type="number"
              />
            </FormField>
            <FormField htmlFor="offerLabel" label={copy.newCancellation.offer}>
              <Input
                id="offerLabel"
                name="offerLabel"
                placeholder={copy.newCancellation.offerPlaceholder}
              />
            </FormField>
            <div className="md:col-span-2">
              <FormField
                htmlFor="internalNote"
                label={copy.newCancellation.internalNote}
              >
                <Textarea id="internalNote" name="internalNote" />
              </FormField>
            </div>
            <Button
              className="md:col-span-2"
              disabled={!canSendSmsAlerts}
              type="submit"
            >
              {getOpeningAlertButtonLabel(smsStatus, locale)}
            </Button>
          </form>
        </Panel>
        <Panel title={copy.newCancellation.eligibleCustomers}>
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
              description={copy.newCancellation.emptyEligibleDescription}
              title={copy.newCancellation.emptyEligibleTitle}
            />
          )}
          <p className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-800">
            {getOpeningAlertModeCopy(smsStatus, locale)}
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
