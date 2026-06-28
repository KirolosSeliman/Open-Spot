"use client";

import type { SafeOrganizationSmsSenderView } from "@/lib/sms/organization-sender-types";
import {
  broadcastStatusLabel,
  complianceLabel,
  formatSmsDate,
  liveConfiguredLabel
} from "@/components/sms/sms-shared";
import { SmsBadge, SmsCard } from "@/components/sms/sms-ui";

function SummaryCard({
  title,
  value,
  badge
}: {
  title: string;
  value: string;
  badge: string;
}) {
  return (
    <SmsCard className="p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[#64748b]">{title}</p>
        <SmsBadge label={badge} />
      </div>
      <p className="mt-2 text-lg font-black text-[#0b1328]">{value}</p>
    </SmsCard>
  );
}

export function SmsOverviewStatusCards({
  sender
}: {
  sender: SafeOrganizationSmsSenderView | null;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <SummaryCard
        badge={liveConfiguredLabel(Boolean(sender?.phoneE164), sender?.livePhoneOk)}
        title="Numéro"
        value={sender?.phoneDisplay ?? "Non configuré"}
      />
      <SummaryCard
        badge={liveConfiguredLabel(
          Boolean(sender?.inboundWebhookConfigured && sender?.statusCallbackConfigured),
          sender?.liveWebhookOk && sender?.liveStatusCallbackOk
            ? true
            : sender?.liveWebhookOk === false || sender?.liveStatusCallbackOk === false
              ? false
              : undefined
        )}
        title="Envoi"
        value={
          sender?.twilioMessagingServiceSidMasked
            ? "Service configuré"
            : "Service manquant"
        }
      />
      <SummaryCard
        badge={broadcastStatusLabel(sender)}
        title="Production"
        value={
          sender?.senderStatus === "ready"
            ? "SMS actifs"
            : `Sync ${formatSmsDate(sender?.lastSyncedAt)}`
        }
      />
      <div className="sm:col-span-3">
        <p className="text-xs text-[#64748b]">
          Conformité : {complianceLabel(sender?.complianceStatus)} · Les réponses OUI ne
          confirment jamais automatiquement un rendez-vous.
        </p>
      </div>
    </div>
  );
}
