"use client";

import {
  SmsArrowRightIcon,
  SmsPhoneIcon,
  SmsSendIcon,
  SmsShieldIcon
} from "@/components/admin/sms-configuration-icons";
import {
  assignTwilioPhoneNumberAction,
  syncTwilioSenderAction
} from "@/lib/admin/sms-sender-actions";
import type { SafeOrganizationSmsSenderView } from "@/lib/sms/organization-sender-types";
import { AdminActionForm } from "@/components/sms/sms-action-forms";
import {
  complianceLabel,
  formatSmsDate,
  senderStatusLabel,
  smsPageStyles
} from "@/components/sms/sms-shared";
import {
  SmsBadge,
  SmsCard,
  SmsCardHeader,
  SmsFieldRow
} from "@/components/sms/sms-ui";
import type { SmsConfigurationTab } from "@/components/sms/sms-shared";
import { useState } from "react";

type Props = {
  sender: SafeOrganizationSmsSenderView | null;
  organizationId: string;
  organizationName: string;
  isSuperAdmin: boolean;
  onNavigateTab: (tab: SmsConfigurationTab) => void;
};

function StatusCardButton({
  label,
  onClick
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="mt-5 flex w-full min-h-11 items-center justify-between rounded-xl border border-[#e1e9f5] bg-[#f8fbff] px-4 text-sm font-bold text-[#0b1328] transition hover:bg-[#eef5ff]"
      onClick={onClick}
      type="button"
    >
      {label}
      <SmsArrowRightIcon className="h-4 w-4 text-[#64748b]" />
    </button>
  );
}

export function SmsOverviewStatusCards({
  sender,
  organizationId,
  organizationName,
  isSuperAdmin,
  onNavigateTab
}: Props) {
  const [phoneNumberSid, setPhoneNumberSid] = useState("");

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <SmsCard>
        <SmsCardHeader
          badge={<SmsBadge label={senderStatusLabel(sender?.senderStatus)} />}
          icon={<SmsPhoneIcon className="h-5 w-5" />}
          title="Numéro dédié"
        />
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <SmsFieldRow label="Fournisseur" value={sender?.provider ?? "—"} />
          <SmsFieldRow label="Numéro actuel" value={sender?.phoneDisplay ?? "Non configuré"} />
          <SmsFieldRow
            label="Dernière synchronisation"
            value={formatSmsDate(sender?.lastSyncedAt)}
          />
        </dl>
        <StatusCardButton label="Gérer le numéro" onClick={() => onNavigateTab("number")} />
      </SmsCard>

      <SmsCard>
        <SmsCardHeader
          badge={
            <SmsBadge
              label={
                sender?.inboundWebhookConfigured && sender?.statusCallbackConfigured
                  ? "Configuré"
                  : "À vérifier"
              }
            />
          }
          icon={<SmsSendIcon className="h-5 w-5" />}
          title="Service d'envoi"
        />
        <dl className="mt-5 grid gap-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <dt className={smsPageStyles.label}>Webhook entrant</dt>
            <dd className="font-bold text-[#0b1328]">
              {sender?.inboundWebhookConfigured ? "Activé" : "Manquant"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <dt className={smsPageStyles.label}>Callback de statut</dt>
            <dd className="font-bold text-[#0b1328]">
              {sender?.statusCallbackConfigured ? "Activé" : "Manquant"}
            </dd>
          </div>
          <SmsFieldRow label="Pool d'envoi" value={sender?.phoneE164 ? "1 numéro" : "0 numéro"} />
          <SmsFieldRow
            label="Dernier callback"
            value={formatSmsDate(sender?.lastStatusCallbackAt)}
          />
        </dl>
        <StatusCardButton
          label="Configurer le service"
          onClick={() => onNavigateTab("sending")}
        />
      </SmsCard>

      <SmsCard>
        <SmsCardHeader
          badge={<SmsBadge label={complianceLabel(sender?.complianceStatus)} />}
          icon={<SmsShieldIcon className="h-5 w-5" />}
          title="Conformité"
        />
        <dl className="mt-5 grid gap-3">
          <SmsFieldRow label="Type de consentement" value="Opt-in explicite" />
          <SmsFieldRow
            label="Support STOP / AIDE"
            value={sender?.stopHelpStatus === "active" ? "Activé" : "À vérifier"}
          />
          <div className="grid gap-1">
            <dt className={smsPageStyles.label}>Statut de conformité</dt>
            <dd>
              <SmsBadge label={complianceLabel(sender?.complianceStatus)} />
            </dd>
          </div>
          <SmsFieldRow
            label="Dernière vérification"
            value={formatSmsDate(sender?.lastSyncedAt)}
          />
        </dl>
        <StatusCardButton
          label="Voir la conformité"
          onClick={() => onNavigateTab("compliance")}
        />
      </SmsCard>

      {isSuperAdmin ? (
        <div className="xl:col-span-3">
          <details className="rounded-2xl border border-[#e1e9f5] bg-[#f8fbff] px-4 py-3">
            <summary className="cursor-pointer text-sm font-bold text-[#64748b]">
              Actions super admin (numéro)
            </summary>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <AdminActionForm
                action={syncTwilioSenderAction}
                buttonClassName={smsPageStyles.secondaryButton}
                hideSubmit={false}
                organizationId={organizationId}
                organizationName={organizationName}
                submitLabel="Synchroniser"
              />
              <div className="grid gap-2">
                <input
                  className={smsPageStyles.input}
                  onChange={(event) => setPhoneNumberSid(event.target.value)}
                  placeholder="PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={phoneNumberSid}
                />
                <AdminActionForm
                  action={assignTwilioPhoneNumberAction}
                  buttonClassName={smsPageStyles.secondaryButton}
                  disabled={!phoneNumberSid}
                  organizationId={organizationId}
                  organizationName={organizationName}
                  submitLabel="Assigner le numéro"
                >
                  <input name="phoneNumberSid" type="hidden" value={phoneNumberSid} />
                </AdminActionForm>
              </div>
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}
