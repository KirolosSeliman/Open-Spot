"use client";

import type { AdminSmsDiagnosticRow } from "@/lib/admin/sms-diagnostics";
import type {
  SmsActivityMetrics,
  SmsTestDeliveryStep
} from "@/lib/sms/configuration-data";
import type { SafeOrganizationSmsSenderView } from "@/lib/sms/organization-sender-types";
import type { SmsSenderReadinessResult } from "@/lib/sms/sms-setup-readiness";
import { SafeTwilioErrorDisplay } from "@/components/admin/sms-safe-error-display";
import {
  SmsAdvancedTab,
  SmsComplianceTab,
  SmsNumberTab,
  SmsSendingTab
} from "@/components/sms/sms-advanced-tab";
import { SmsActivityTab } from "@/components/sms/sms-activity-tab";
import { SmsChecklistCard } from "@/components/sms/sms-checklist-card";
import { SmsOverviewStatusCards } from "@/components/sms/sms-overview-status-cards";
import { SmsTestDeliveryResultsCard } from "@/components/sms/sms-test-delivery-results-card";
import { SmsTestMessageCard } from "@/components/sms/sms-test-message-card";
import type { SmsConfigurationTab } from "@/components/sms/sms-shared";
import { SmsTabs } from "@/components/sms/sms-tabs";
import { SmsTrialBanner } from "@/components/sms/sms-ui";

type Props = {
  activeTab: SmsConfigurationTab;
  organizationId: string;
  organizationName: string;
  baseHref: string;
  sender: SafeOrganizationSmsSenderView | null;
  readiness: SmsSenderReadinessResult;
  journalRows: AdminSmsDiagnosticRow[];
  metrics: SmsActivityMetrics;
  testSteps: SmsTestDeliveryStep[];
  isSuperAdmin: boolean;
  realSmsEnabled: boolean;
  activityFilters: {
    q: string;
    direction: string;
    from: string;
    to: string;
  };
};

export function SmsConfigurationShell({
  activeTab,
  organizationId,
  organizationName,
  baseHref,
  sender,
  readiness,
  journalRows,
  metrics,
  testSteps,
  isSuperAdmin,
  realSmsEnabled,
  activityFilters
}: Props) {
  const testBlocked =
    !isSuperAdmin || !realSmsEnabled || !readiness.canSendTest || !sender?.phoneE164;

  const testBlockedReason = testBlocked
    ? "Test bloqué : numéro, service d'envoi, webhooks et ALLOW_REAL_SMS_SENDS requis."
    : undefined;

  return (
    <div className="grid gap-5">
      <SmsTabs activeTab={activeTab} />

      {sender?.isTrialAccount ? <SmsTrialBanner /> : null}

      {sender?.lastError ? (
        <SafeTwilioErrorDisplay error={sender.lastError} title="Erreur Twilio" />
      ) : null}

      {activeTab === "overview" ? (
        <div className="grid gap-4">
          <SmsOverviewStatusCards sender={sender} />
          <SmsChecklistCard readiness={readiness} />
        </div>
      ) : null}

      {activeTab === "number" ? (
        <SmsNumberTab
          isSuperAdmin={isSuperAdmin}
          organizationId={organizationId}
          organizationName={organizationName}
          sender={sender}
        />
      ) : null}

      {activeTab === "sending" ? (
        <SmsSendingTab
          isSuperAdmin={isSuperAdmin}
          organizationId={organizationId}
          organizationName={organizationName}
          sender={sender}
        />
      ) : null}

      {activeTab === "compliance" ? (
        <SmsComplianceTab
          isSuperAdmin={isSuperAdmin}
          organizationId={organizationId}
          organizationName={organizationName}
          sender={sender}
        />
      ) : null}

      {activeTab === "tests" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SmsTestMessageCard
            defaultPhone={sender?.phoneE164}
            disabled={testBlocked}
            disabledReason={testBlockedReason}
            organizationId={organizationId}
          />
          <SmsTestDeliveryResultsCard steps={testSteps} />
        </div>
      ) : null}

      {activeTab === "activity" ? (
        <SmsActivityTab
          baseHref={baseHref}
          filters={activityFilters}
          metrics={metrics}
          rows={journalRows}
        />
      ) : null}

      {activeTab === "advanced" ? (
        <SmsAdvancedTab
          isSuperAdmin={isSuperAdmin}
          organizationId={organizationId}
          organizationName={organizationName}
          readiness={readiness}
          sender={sender}
        />
      ) : null}
    </div>
  );
}
