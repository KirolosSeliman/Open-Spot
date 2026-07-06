"use client";

import { useState } from "react";

import { EligibleCustomersPanel } from "@/components/dashboard/new-cancellation/eligible-customers-panel";
import type {
  EligibleCustomersCopy,
  NewCancellationFormCopy
} from "@/components/dashboard/new-cancellation/new-cancellation-copy";
import { NewCancellationFormCard } from "@/components/dashboard/new-cancellation/new-cancellation-form-card";
import type { DashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";

type Service = {
  id: string;
  name: string;
};

type EligibleCustomer = {
  id: string;
  full_name: string;
  phone_e164: string;
};

type NewCancellationWorkspaceProps = {
  canSendSmsAlerts: boolean;
  commonCopy: Pick<DashboardCopy["common"], "service" | "start" | "end">;
  eligibleCopy: EligibleCustomersCopy;
  error?: string;
  formCopy: NewCancellationFormCopy;
  customers: EligibleCustomer[];
  locale: Locale;
  services: Service[];
  smsBlockingReasons: string[];
};

export function NewCancellationWorkspace({
  canSendSmsAlerts,
  commonCopy,
  eligibleCopy,
  error,
  formCopy,
  customers,
  locale,
  services,
  smsBlockingReasons
}: NewCancellationWorkspaceProps) {
  const [excludedCustomerIds, setExcludedCustomerIds] = useState<string[]>([]);

  function onToggleExcludedCustomer(customerId: string) {
    setExcludedCustomerIds((current) =>
      current.includes(customerId)
        ? current.filter((id) => id !== customerId)
        : [...current, customerId]
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-8">
      <NewCancellationFormCard
        canSendSmsAlerts={canSendSmsAlerts}
        commonCopy={commonCopy}
        copy={formCopy}
        error={error}
        excludedCustomerIds={excludedCustomerIds}
        services={services}
        smsBlockingReasons={smsBlockingReasons}
      />
      <EligibleCustomersPanel
        copy={eligibleCopy}
        customers={customers}
        excludedCustomerIds={excludedCustomerIds}
        locale={locale}
        onToggleExcludedCustomer={onToggleExcludedCustomer}
      />
    </div>
  );
}
