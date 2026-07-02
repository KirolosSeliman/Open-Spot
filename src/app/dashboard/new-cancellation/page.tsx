import { EligibleCustomersPanel } from "@/components/dashboard/new-cancellation/eligible-customers-panel";
import {
  pickEligibleCustomersCopy,
  pickNewCancellationFormCopy
} from "@/components/dashboard/new-cancellation/new-cancellation-copy";
import { NewCancellationFormCard } from "@/components/dashboard/new-cancellation/new-cancellation-form-card";
import { loadOpeningCreationData } from "@/lib/dashboard/operations-data";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import { getRequestLocale } from "@/lib/i18n/locale";
import { getSmsRuntimeStatus } from "@/lib/sms/runtime-status";

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
    <div className="min-w-0 rounded-[28px] bg-[#f8fafc] p-[clamp(12px,4vw,20px)] sm:p-6 lg:p-8">
      <header className="mb-8 lg:mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0052ff]">
          {copy.newCancellation.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
          {copy.newCancellation.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#64748b]">
          {copy.newCancellation.descriptionLine1}
          <br />
          {copy.newCancellation.descriptionLine2}
        </p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-8">
        <NewCancellationFormCard
          canSendSmsAlerts={canSendSmsAlerts}
          commonCopy={{
            service: copy.common.service,
            start: copy.common.start,
            end: copy.common.end
          }}
          copy={pickNewCancellationFormCopy(copy.newCancellation)}
          error={error}
          services={data.services}
          smsBlockingReasons={smsBlockingReasons}
        />
        <EligibleCustomersPanel
          copy={pickEligibleCustomersCopy(copy.newCancellation)}
          customers={data.eligibleCustomers}
          locale={locale}
        />
      </div>
    </div>
  );
}
