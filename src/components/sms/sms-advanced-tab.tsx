"use client";

import { useState } from "react";

import type { AdminSmsDiagnosticRow } from "@/lib/admin/sms-diagnostics";
import type { SmsActivationPrerequisite } from "@/lib/sms/configuration-data";
import type { SafeOrganizationSmsSenderView } from "@/lib/sms/organization-sender-types";
import type { SmsSenderReadinessResult } from "@/lib/sms/sms-setup-readiness";
import {
  SmsArrowInIcon,
  SmsArrowOutIcon,
  SmsBellIcon,
  SmsChartIcon,
  SmsCopyIcon,
  SmsExternalLinkIcon,
  SmsSendIcon,
  SmsShieldIcon
} from "@/components/admin/sms-configuration-icons";
import { AdminActionForm, SmsInlineForm } from "@/components/sms/sms-action-forms";
import {
  activateSmsForOrganizationAction,
  approveSmsComplianceAction,
  assignTwilioPhoneNumberAction,
  blockSmsForOrganizationAction,
  configureTwilioWebhooksAction,
  connectTwilioSubaccountAction,
  createOrUpdateMessagingServiceAction,
  createTwilioSubaccountAction,
  pauseSmsForOrganizationAction,
  syncTwilioSenderAction
} from "@/lib/admin/sms-sender-actions";
import {
  broadcastStatusLabel,
  complianceLabel,
  formatSmsDate,
  prerequisiteStatusLabel,
  rowStatusLabel,
  senderStatusLabel,
  smsPageStyles
} from "@/components/sms/sms-shared";
import {
  SmsBadge,
  SmsCard,
  SmsCardHeader,
  SmsEmptyState,
  SmsFieldRow,
  SmsFooterLink
} from "@/components/sms/sms-ui";

type Props = {
  sender: SafeOrganizationSmsSenderView | null;
  readiness: SmsSenderReadinessResult;
  prerequisites: SmsActivationPrerequisite[];
  recentActivity: AdminSmsDiagnosticRow[];
  organizationId: string;
  organizationName: string;
  isSuperAdmin: boolean;
  onNavigateActivity: () => void;
};

export function SmsAdvancedTab({
  sender,
  readiness,
  prerequisites,
  recentActivity,
  organizationId,
  organizationName,
  isSuperAdmin,
  onNavigateActivity
}: Props) {
  const [subaccountSid, setSubaccountSid] = useState("");
  const [copied, setCopied] = useState(false);

  const maskedSid = sender?.twilioSubaccountSidMasked ?? "—";

  async function copySid() {
    if (!maskedSid || maskedSid === "—") {
      return;
    }

    try {
      await navigator.clipboard.writeText(maskedSid);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <div className="grid gap-4">
        {isSuperAdmin ? (
          <SmsCard>
            <SmsCardHeader
              icon={<SmsSendIcon className="h-5 w-5" />}
              title="Configuration Twilio avancée"
            />
            <div className="mt-5 flex flex-wrap gap-3">
              <AdminActionForm
                action={createTwilioSubaccountAction}
                buttonClassName={smsPageStyles.primaryButton}
                organizationId={organizationId}
                organizationName={organizationName}
                submitLabel="Créer un sous-compte Twilio"
              />
              <div className="grid gap-2 sm:min-w-[280px]">
                <input
                  className={smsPageStyles.input}
                  onChange={(event) => setSubaccountSid(event.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={subaccountSid}
                />
                <AdminActionForm
                  action={connectTwilioSubaccountAction}
                  buttonClassName={smsPageStyles.secondaryButton}
                  disabled={!subaccountSid}
                  organizationId={organizationId}
                  organizationName={organizationName}
                  submitLabel="Connecter un sous-compte"
                >
                  <input name="subaccountSid" type="hidden" value={subaccountSid} />
                </AdminActionForm>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              <label className={smsPageStyles.label}>
                Twilio Account SID (Lecture seule)
              </label>
              <div className="flex items-center gap-2">
                <input
                  className={smsPageStyles.input}
                  readOnly
                  value={maskedSid}
                />
                <button
                  className={smsPageStyles.secondaryButton}
                  onClick={copySid}
                  type="button"
                >
                  <SmsCopyIcon className="h-4 w-4" />
                  {copied ? "Copié" : "Copier"}
                </button>
              </div>
            </div>

            {sender?.isTrialAccount ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-[#fff7ed] px-4 py-3 text-sm text-amber-900">
                Compte Twilio en mode essai
                {sender.twilioSubaccountSidMasked
                  ? " • Sous-compte connecté."
                  : " • Sous-compte non connecté."}{" "}
                <a
                  className="inline-flex items-center gap-1 font-bold underline"
                  href="https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account"
                  rel="noreferrer"
                  target="_blank"
                >
                  En savoir plus
                  <SmsExternalLinkIcon className="h-4 w-4" />
                </a>
              </div>
            ) : null}
          </SmsCard>
        ) : null}

        {isSuperAdmin ? (
          <SmsCard>
            <SmsCardHeader
              badge={<SmsBadge label={broadcastStatusLabel(sender)} />}
              icon={<SmsSendIcon className="h-5 w-5" />}
              title="Actions de diffusion SMS"
            />
            <p className="mt-4 text-sm text-[#64748b]">
              Statut actuel :{" "}
              <span className="font-bold text-[#0b1328]">
                {broadcastStatusLabel(sender)}
              </span>
            </p>
            <p className="mt-2 text-sm text-[#64748b]">
              Les SMS ne peuvent pas être envoyés en production tant que tous les
              prérequis ne sont pas validés.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <SmsInlineForm
                action={activateSmsForOrganizationAction}
                disabled={!readiness.canActivate}
                organizationId={organizationId}
                submitLabel="Activer les SMS pour cette compagnie"
              />
              <SmsInlineForm
                action={pauseSmsForOrganizationAction}
                buttonVariant="secondary"
                organizationId={organizationId}
                submitLabel="Mettre en pause"
              />
              <SmsInlineForm
                action={blockSmsForOrganizationAction}
                buttonVariant="destructive"
                organizationId={organizationId}
                submitLabel="Bloquer"
              />
            </div>
            {!readiness.canActivate && readiness.blockingReasons.length > 0 ? (
              <ul className="mt-4 list-disc pl-5 text-sm text-[#64748b]">
                {readiness.blockingReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
          </SmsCard>
        ) : null}

        <SmsCard>
          <SmsCardHeader
            icon={<SmsChartIcon className="h-5 w-5" />}
            title="Activité SMS récente"
          />
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e1e9f5] text-xs uppercase tracking-wide text-[#64748b]">
                  <th className="px-3 py-2">Date et heure</th>
                  <th className="px-3 py-2">Direction</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2">Aperçu du message</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((row) => (
                  <tr className="border-b border-[#e1e9f5]" key={row.id}>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {formatSmsDate(row.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-2">
                        {row.direction === "outbound" ? (
                          <SmsArrowOutIcon className="h-4 w-4 text-[#16a34a]" />
                        ) : (
                          <SmsArrowInIcon className="h-4 w-4 text-[#2563ff]" />
                        )}
                        {row.direction === "outbound" ? "Sortant" : "Entrant"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <SmsBadge label={rowStatusLabel(row)} />
                    </td>
                    <td className="px-3 py-3">{row.customerName ?? "—"}</td>
                    <td className="max-w-xs px-3 py-3 truncate">{row.bodyPreview}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentActivity.length === 0 ? (
              <div className="mt-4">
                <SmsEmptyState
                  description="Les messages apparaîtront ici dès qu'ils seront enregistrés."
                  title="Aucune activité SMS récente"
                />
              </div>
            ) : null}
          </div>
          <SmsFooterLink onClick={onNavigateActivity}>
            Voir toute l&apos;activité →
          </SmsFooterLink>
        </SmsCard>
      </div>

      <div className="grid gap-4">
        <SmsCard>
          <SmsCardHeader
            icon={<SmsShieldIcon className="h-5 w-5" />}
            title="Prérequis avant activation"
          />
          <ul className="mt-5 grid gap-3">
            {prerequisites.map((item) => (
              <li
                className="flex items-start justify-between gap-3 rounded-2xl border border-[#e1e9f5] px-4 py-3"
                key={item.key}
              >
                <div>
                  <p className="text-sm font-black text-[#0b1328]">{item.label}</p>
                  <p className="mt-1 text-xs text-[#64748b]">{item.description}</p>
                </div>
                <SmsBadge label={prerequisiteStatusLabel(item.status)} />
              </li>
            ))}
          </ul>
        </SmsCard>

        <SmsCard>
          <SmsCardHeader
            icon={<SmsBellIcon className="h-5 w-5" />}
            title="Rappels importants"
          />
          <ul className="mt-5 grid gap-4 text-sm">
            <li>
              <p className="font-black text-[#0b1328]">Consentement explicite requis</p>
              <p className="mt-1 text-[#64748b]">
                Le SMS ne peut être envoyé qu&apos;après un opt-in explicite du client.
              </p>
            </li>
            <li>
              <p className="font-black text-[#0b1328]">Confirmation manuelle</p>
              <p className="mt-1 text-[#64748b]">
                Les réponses positives ne confirment jamais automatiquement un rendez-vous.
              </p>
            </li>
            <li>
              <p className="font-black text-[#0b1328]">Réponse STOP</p>
              <p className="mt-1 text-[#64748b]">
                Le client peut se désabonner à tout moment en répondant STOP.
              </p>
            </li>
          </ul>
        </SmsCard>
      </div>
    </div>
  );
}

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
  const [phoneNumberSid, setPhoneNumberSid] = useState("");

  return (
    <SmsCard>
      <SmsCardHeader
        badge={<SmsBadge label={senderStatusLabel(sender?.senderStatus)} />}
        icon={<SmsSendIcon className="h-5 w-5" />}
        title="Numéro dédié"
      />
      <dl className="mt-5 grid gap-4 md:grid-cols-2">
        <SmsFieldRow label="Fournisseur" value={sender?.provider ?? "—"} />
        <SmsFieldRow label="Numéro actuel" value={sender?.phoneDisplay ?? "Non configuré"} />
        <SmsFieldRow label="Statut" value={senderStatusLabel(sender?.senderStatus)} />
        <SmsFieldRow
          label="Dernière synchronisation"
          value={formatSmsDate(sender?.lastSyncedAt)}
        />
        <SmsFieldRow
          label="Mode Twilio"
          value={
            sender?.isTrialAccount
              ? "Mode essai"
              : sender
                ? "Production"
                : "Non disponible"
          }
        />
      </dl>

      {isSuperAdmin ? (
        <div className="mt-6 grid gap-3 border-t border-[#e1e9f5] pt-5">
          <AdminActionForm
            action={syncTwilioSenderAction}
            buttonClassName={smsPageStyles.secondaryButton}
            organizationId={organizationId}
            organizationName={organizationName}
            submitLabel="Synchroniser le numéro"
          />
          <input
            className={smsPageStyles.input}
            onChange={(event) => setPhoneNumberSid(event.target.value)}
            placeholder="PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            value={phoneNumberSid}
          />
          <AdminActionForm
            action={assignTwilioPhoneNumberAction}
            buttonClassName={smsPageStyles.primaryButton}
            disabled={!phoneNumberSid}
            organizationId={organizationId}
            organizationName={organizationName}
            submitLabel="Assigner le numéro Twilio"
          >
            <input name="phoneNumberSid" type="hidden" value={phoneNumberSid} />
          </AdminActionForm>
        </div>
      ) : null}
    </SmsCard>
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
      <dl className="mt-5 grid gap-4 md:grid-cols-2">
        <SmsFieldRow
          label="Webhook entrant"
          value={sender?.inboundWebhookConfigured ? "Activé" : "Manquant"}
        />
        <SmsFieldRow
          label="Callback de statut"
          value={sender?.statusCallbackConfigured ? "Activé" : "Manquant"}
        />
        <SmsFieldRow label="Fournisseur" value={sender?.provider ?? "—"} />
        <SmsFieldRow
          label="Pool d'envoi"
          value={sender?.phoneE164 ? "1 numéro" : "0 numéro"}
        />
        <SmsFieldRow
          label="Dernier callback"
          value={formatSmsDate(sender?.lastStatusCallbackAt)}
        />
      </dl>

      {isSuperAdmin ? (
        <div className="mt-6 grid gap-3 border-t border-[#e1e9f5] pt-5 md:grid-cols-2">
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
            submitLabel="Configurer les webhooks"
          />
        </div>
      ) : null}
    </SmsCard>
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
    <SmsCard>
      <SmsCardHeader
        badge={<SmsBadge label={complianceLabel(sender?.complianceStatus)} />}
        icon={<SmsShieldIcon className="h-5 w-5" />}
        title="Conformité SMS"
      />
      <dl className="mt-5 grid gap-4 md:grid-cols-2">
        <SmsFieldRow label="Type de consentement" value="Opt-in explicite" />
        <SmsFieldRow
          label="Support STOP / AIDE"
          value={sender?.stopHelpStatus === "active" ? "Activé" : "À vérifier"}
        />
        <SmsFieldRow
          label="Statut de conformité"
          value={complianceLabel(sender?.complianceStatus)}
        />
        <SmsFieldRow
          label="Dernière vérification"
          value={formatSmsDate(sender?.lastSyncedAt)}
        />
      </dl>

      {isSuperAdmin ? (
        <div className="mt-6 border-t border-[#e1e9f5] pt-5">
          <AdminActionForm
            action={approveSmsComplianceAction}
            buttonClassName={smsPageStyles.primaryButton}
            organizationId={organizationId}
            organizationName={organizationName}
            submitLabel="Approuver la conformité SMS"
          />
        </div>
      ) : null}
    </SmsCard>
  );
}
