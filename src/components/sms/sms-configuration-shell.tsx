"use client";

import { useRouter } from "next/navigation";

import type { AdminSmsDiagnosticRow } from "@/lib/admin/sms-diagnostics";
import type {
  SmsActivationPrerequisite,
  SmsActivityMetrics,
  SmsRecentEvents,
  SmsTestDeliveryStep
} from "@/lib/sms/configuration-data";
import type { SafeOrganizationSmsSenderView } from "@/lib/sms/organization-sender-types";
import type { SmsSenderReadinessResult } from "@/lib/sms/sms-setup-readiness";
import { SmsActivityTab } from "@/components/sms/sms-activity-tab";
import {
  SmsAdvancedTab,
  SmsComplianceTab,
  SmsNumberTab,
  SmsSendingTab
} from "@/components/sms/sms-advanced-tab";
import { SmsChecklistCard } from "@/components/sms/sms-checklist-card";
import { SmsOverviewStatusCards } from "@/components/sms/sms-overview-status-cards";
import { SmsTestDeliveryResultsCard } from "@/components/sms/sms-test-delivery-results-card";
import { SmsTestMessageCard } from "@/components/sms/sms-test-message-card";
import type { SmsConfigurationTab } from "@/components/sms/sms-shared";
import { SmsTabs } from "@/components/sms/sms-tabs";
import { SmsNeutralTwilioBanner, SmsTrialBanner } from "@/components/sms/sms-ui";

type Props = {
  activeTab: SmsConfigurationTab;
  organizationId: string;
  organizationName: string;
  baseHref: string;
  sender: SafeOrganizationSmsSenderView | null;
  readiness: SmsSenderReadinessResult;
  recentActivity: AdminSmsDiagnosticRow[];
  journalRows: AdminSmsDiagnosticRow[];
  metrics: SmsActivityMetrics;
  events: SmsRecentEvents;
  testSteps: SmsTestDeliveryStep[];
  prerequisites: SmsActivationPrerequisite[];
  isSuperAdmin: boolean;
  realSmsEnabled: boolean;
  activityFilters: {
    q: string;
    status: string;
    direction: string;
    from: string;
    to: string;
    page: number;
  };
};

export function SmsConfigurationShell({
  activeTab,
  organizationId,
  organizationName,
  baseHref,
  sender,
  readiness,
  recentActivity,
  journalRows,
  metrics,
  events,
  testSteps,
  prerequisites,
  isSuperAdmin,
  realSmsEnabled,
  activityFilters
}: Props) {
  const router = useRouter();

  const testBlocked =
    !isSuperAdmin || !realSmsEnabled || !readiness.canSendTest || !sender?.phoneE164;

  const testBlockedReason = testBlocked
    ? "Test bloqué : vérifiez le numéro dédié, les webhooks, ALLOW_REAL_SMS_SENDS et vos droits super_admin."
    : undefined;

  function navigateTab(tab: SmsConfigurationTab) {
    router.push(`${baseHref}?tab=${tab}`);
  }

  const showTrialBanner =
    activeTab === "overview" || activeTab === "advanced" ? sender?.isTrialAccount : false;

  return (
    <div className="grid gap-6">
      <SmsTabs activeTab={activeTab} />

      {showTrialBanner ? <SmsTrialBanner /> : null}
      {!sender && activeTab === "overview" ? <SmsNeutralTwilioBanner /> : null}

      {activeTab === "overview" ? (
        <div className="grid gap-4">
          <SmsOverviewStatusCards
            isSuperAdmin={isSuperAdmin}
            onNavigateTab={navigateTab}
            organizationId={organizationId}
            organizationName={organizationName}
            sender={sender}
          />
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <SmsTestMessageCard
              defaultPhone={sender?.phoneE164}
              disabled={testBlocked}
              disabledReason={testBlockedReason}
              organizationId={organizationId}
            />
            <SmsChecklistCard
              linkLabel="Voir tous les détails"
              onNavigateTab={navigateTab}
              readiness={readiness}
            />
          </div>
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
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="grid gap-4">
            <SmsTestMessageCard
              defaultPhone={sender?.phoneE164}
              disabled={testBlocked}
              disabledReason={testBlockedReason}
              organizationId={organizationId}
            />
            <SmsTestDeliveryResultsCard steps={testSteps} />
          </div>
          <SmsChecklistCard
            linkLabel="Voir la conformité"
            linkTab="compliance"
            onNavigateTab={navigateTab}
            readiness={readiness}
            showProgress
          />
        </div>
      ) : null}

      {activeTab === "activity" ? (
        <SmsActivityTab
          baseHref={baseHref}
          events={events}
          filters={activityFilters}
          metrics={metrics}
          rows={journalRows}
        />
      ) : null}

      {activeTab === "advanced" ? (
        <SmsAdvancedTab
          isSuperAdmin={isSuperAdmin}
          onNavigateActivity={() => navigateTab("activity")}
          organizationId={organizationId}
          organizationName={organizationName}
          prerequisites={prerequisites}
          readiness={readiness}
          recentActivity={recentActivity}
          sender={sender}
        />
      ) : null}
    </div>
  );
}
