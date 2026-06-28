"use client";

import { useState } from "react";

import { SmsTwilioNumberPicker } from "@/components/admin/sms-twilio-number-picker";
import type { SafeOrganizationSmsSenderView } from "@/lib/sms/organization-sender-types";
import type { SmsSenderReadinessResult } from "@/lib/sms/sms-setup-readiness";
import {
  activateSmsForOrganizationAction,
  approveSmsComplianceAction,
  blockSmsForOrganizationAction,
  configureTwilioWebhooksAction,
  connectTwilioSubaccountAction,
  createOrUpdateMessagingServiceAction,
  createTwilioSubaccountAction,
  pauseSmsForOrganizationAction,
  syncTwilioSenderAction,
  verifyTwilioConfigurationAction
} from "@/lib/admin/sms-sender-actions";
import { AdminActionForm, SmsInlineForm } from "@/components/sms/sms-action-forms";
import {
  broadcastStatusLabel,
  complianceLabel,
  formatSmsDate,
  liveConfiguredLabel,
  smsPageStyles
} from "@/components/sms/sms-shared";
import { SmsBadge, SmsCard } from "@/components/sms/sms-ui";

export function SmsNumberTab({
  sender,
  organizationId,
  organizationName,
  isSuperAdmin
}: {
  sender: SafeOrganizationSmsSenderView | null;
  organizationId: string;
  organizationName: string;
  isSuperAdmin: boolean;
}) {
  const [subaccountSid, setSubaccountSid] = useState("");

  return (
    <div className="grid gap-4">
      <SmsCard className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-black text-[#0b1328]">Numéro dédié</p>
            <p className="mt-1 text-lg font-black">{sender?.phoneDisplay ?? "Non configuré"}</p>
            <p className="mt-1 text-xs text-[#64748b]">
              Sync {formatSmsDate(sender?.lastSyncedAt)}
            </p>
          </div>
          <SmsBadge
            label={liveConfiguredLabel(Boolean(sender?.phoneE164), sender?.livePhoneOk)}
          />
        </div>
      </SmsCard>

      {isSuperAdmin ? (
        <>
          <SmsCard className="grid gap-3 p-4">
            <p className="text-sm font-black text-[#0b1328]">Sous-compte Twilio</p>
            <p className="text-sm text-[#64748b]">
              {sender?.twilioSubaccountSidMasked ?? "Non connecté"}
            </p>
            <div className="flex flex-wrap gap-2">
              <AdminActionForm
                action={createTwilioSubaccountAction}
                buttonClassName={smsPageStyles.secondaryButton}
                organizationId={organizationId}
                organizationName={organizationName}
                submitLabel="Créer sous-compte"
              />
            </div>
            <input
              className={smsPageStyles.input}
              onChange={(event) => setSubaccountSid(event.target.value)}
              placeholder="AC… (SID sous-compte)"
              value={subaccountSid}
            />
            <AdminActionForm
              action={connectTwilioSubaccountAction}
              buttonClassName={smsPageStyles.secondaryButton}
              disabled={!subaccountSid}
              organizationId={organizationId}
              organizationName={organizationName}
              submitLabel="Connecter"
            >
              <input name="subaccountSid" type="hidden" value={subaccountSid} />
            </AdminActionForm>
          </SmsCard>

          <SmsCard className="grid gap-3 p-4">
            <AdminActionForm
              action={syncTwilioSenderAction}
              buttonClassName={smsPageStyles.secondaryButton}
              organizationId={organizationId}
              organizationName={organizationName}
              submitLabel="Synchroniser"
            />
            <SmsTwilioNumberPicker organizationId={organizationId} />
          </SmsCard>
        </>
      ) : null}
    </div>
  );
}

export function SmsSendingTab({
  sender,
  organizationId,
  organizationName,
  isSuperAdmin
}: {
  sender: SafeOrganizationSmsSenderView | null;
  organizationId: string;
  organizationName: string;
  isSuperAdmin: boolean;
}) {
  return (
    <div className="grid gap-4">
      <SmsCard className="p-4">
        <p className="text-sm font-black text-[#0b1328]">Service & webhooks</p>
        <ul className="mt-3 grid gap-2 text-sm">
          <li className="flex justify-between gap-3">
            <span className="text-[#64748b]">Messaging Service</span>
            <SmsBadge
              label={liveConfiguredLabel(
                Boolean(sender?.twilioMessagingServiceSidMasked),
                sender?.liveMessagingServiceOk
              )}
            />
          </li>
          <li className="flex justify-between gap-3">
            <span className="text-[#64748b]">Webhook entrant</span>
            <SmsBadge
              label={liveConfiguredLabel(
                Boolean(sender?.inboundWebhookConfigured),
                sender?.liveWebhookOk
              )}
            />
          </li>
          <li className="flex justify-between gap-3">
            <span className="text-[#64748b]">Callback statut</span>
            <SmsBadge
              label={liveConfiguredLabel(
                Boolean(sender?.statusCallbackConfigured),
                sender?.liveStatusCallbackOk
              )}
            />
          </li>
        </ul>
      </SmsCard>

      {isSuperAdmin ? (
        <SmsCard className="flex flex-wrap gap-2 p-4">
          <AdminActionForm
            action={createOrUpdateMessagingServiceAction}
            buttonClassName={smsPageStyles.primaryButton}
            organizationId={organizationId}
            organizationName={organizationName}
            submitLabel="Configurer le service"
          />
          <AdminActionForm
            action={configureTwilioWebhooksAction}
            buttonClassName={smsPageStyles.secondaryButton}
            organizationId={organizationId}
            organizationName={organizationName}
            submitLabel="Configurer webhooks"
          />
          <AdminActionForm
            action={verifyTwilioConfigurationAction}
            buttonClassName={smsPageStyles.secondaryButton}
            organizationId={organizationId}
            organizationName={organizationName}
            submitLabel="Vérifier live"
          />
        </SmsCard>
      ) : null}
    </div>
  );
}

export function SmsComplianceTab({
  sender,
  organizationId,
  organizationName,
  isSuperAdmin
}: {
  sender: SafeOrganizationSmsSenderView | null;
  organizationId: string;
  organizationName: string;
  isSuperAdmin: boolean;
}) {
  return (
    <SmsCard className="grid gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-[#0b1328]">Conformité SMS</p>
        <SmsBadge label={complianceLabel(sender?.complianceStatus)} />
      </div>
      <p className="text-sm text-[#64748b]">
        Opt-in explicite requis. STOP désabonne le client. Réponse OUI = validation manuelle
        commerçant.
      </p>
      {isSuperAdmin ? (
        <AdminActionForm
          action={approveSmsComplianceAction}
          organizationId={organizationId}
          organizationName={organizationName}
          submitLabel="Approuver la conformité"
        />
      ) : null}
    </SmsCard>
  );
}

export function SmsAdvancedTab({
  sender,
  readiness,
  organizationId,
  organizationName,
  isSuperAdmin
}: {
  sender: SafeOrganizationSmsSenderView | null;
  readiness: SmsSenderReadinessResult;
  organizationId: string;
  organizationName: string;
  isSuperAdmin: boolean;
}) {
  if (!isSuperAdmin) {
    return (
      <SmsCard className="p-4 text-sm text-[#64748b]">
        Statut : {broadcastStatusLabel(sender)}
      </SmsCard>
    );
  }

  return (
    <SmsCard className="grid gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-[#0b1328]">Diffusion SMS</p>
        <SmsBadge label={broadcastStatusLabel(sender)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <SmsInlineForm
          action={activateSmsForOrganizationAction}
          disabled={!readiness.canActivate}
          organizationId={organizationId}
          organizationName={organizationName}
          submitLabel="Activer SMS"
        />
        <SmsInlineForm
          action={pauseSmsForOrganizationAction}
          buttonVariant="secondary"
          organizationId={organizationId}
          organizationName={organizationName}
          submitLabel="Pause"
        />
        <SmsInlineForm
          action={blockSmsForOrganizationAction}
          buttonVariant="destructive"
          organizationId={organizationId}
          organizationName={organizationName}
          submitLabel="Bloquer"
        />
      </div>

      {!readiness.canActivate && readiness.blockingReasons.length > 0 ? (
        <ul className="text-sm text-[#64748b]">
          {readiness.blockingReasons.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      ) : null}
    </SmsCard>
  );
}
