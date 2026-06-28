"use client";

import { useState, useTransition, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminSmsDiagnosticRow } from "@/lib/admin/sms-diagnostics";
import type { SmsSenderReadinessResult } from "@/lib/sms/sms-setup-readiness";
import type { SafeOrganizationSmsSenderView } from "@/lib/sms/organization-sender-types";
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
  runFullSmsSetupTestAction,
  sendSmsSetupTestAction,
  syncTwilioSenderAction,
  type SmsSenderActionResult
} from "@/lib/admin/sms-sender-actions";
import { DEFAULT_ORGANIZATION_TEST_SMS_BODY } from "@/lib/sms/organization-sms-copy";

type Props = {
  organizationId: string;
  organizationName: string;
  sender: SafeOrganizationSmsSenderView | null;
  readiness: SmsSenderReadinessResult;
  recentActivity: AdminSmsDiagnosticRow[];
  isSuperAdmin: boolean;
  realSmsEnabled: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  dateStyle: "medium",
  timeStyle: "short"
});

function formatRelativeDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return dateFormatter.format(new Date(value));
}

function statusTone(status: string) {
  if (["ready", "active", "approved", "Actif", "Approuvé", "Configuré"].includes(status)) {
    return "success" as const;
  }

  if (["paused", "pending", "À vérifier", "À configurer"].includes(status)) {
    return "warning" as const;
  }

  if (["blocked", "failed", "error", "Erreur"].includes(status)) {
    return "danger" as const;
  }

  return "info" as const;
}

function senderStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "ready":
      return "Actif";
    case "paused":
      return "En pause";
    case "blocked":
      return "Bloqué";
    case "number_missing":
    case "webhook_missing":
    case "test_required":
    case "compliance_pending":
      return "À configurer";
    default:
      return "À configurer";
  }
}

function complianceLabel(status: string | null | undefined) {
  switch (status) {
    case "approved":
      return "Approuvé";
    case "not_required":
      return "Non requis";
    case "rejected":
    case "blocked":
      return "Bloqué";
    default:
      return "À vérifier";
  }
}

function ActionFeedback({ result }: { result: SmsSenderActionResult | null }) {
  if (!result) {
    return null;
  }

  return (
    <p
      className={`text-sm font-bold ${result.ok ? "text-emerald-700" : "text-red-700"}`}
    >
      {result.message}
    </p>
  );
}

function AdminActionForm({
  action,
  organizationId,
  organizationName,
  children,
  disabled = false,
  className = "grid gap-3"
}: {
  action: (formData: FormData) => Promise<SmsSenderActionResult>;
  organizationId: string;
  organizationName: string;
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const [result, setResult] = useState<SmsSenderActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className={className}
      action={(formData) => {
        startTransition(async () => {
          setResult(await action(formData));
        });
      }}
    >
      <input name="organizationId" type="hidden" value={organizationId} />
      <input name="organizationName" type="hidden" value={organizationName} />
      {children}
      <ActionFeedback result={result} />
      <Button disabled={disabled || isPending} isLoading={isPending} type="submit">
        Continuer
      </Button>
    </form>
  );
}

export function SmsConfigurationDashboard({
  organizationId,
  organizationName,
  sender,
  readiness,
  recentActivity,
  isSuperAdmin,
  realSmsEnabled
}: Props) {
  const [testPhone, setTestPhone] = useState(sender?.phoneE164 ?? "");
  const [testMessage, setTestMessage] = useState(DEFAULT_ORGANIZATION_TEST_SMS_BODY);
  const [phoneNumberSid, setPhoneNumberSid] = useState("");
  const [subaccountSid, setSubaccountSid] = useState("");
  const testBlocked =
    !isSuperAdmin || !realSmsEnabled || !readiness.canSendTest || !sender?.phoneE164;

  return (
    <div className="grid gap-6">
      {sender?.isTrialAccount ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Compte Twilio en mode essai : l&apos;envoi réel peut être limité aux numéros
          vérifiés. Passez en compte payant avant production.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black">📞 Numéro dédié</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Fournisseur Twilio</p>
            </div>
            <Badge tone={statusTone(senderStatusLabel(sender?.senderStatus))}>
              {senderStatusLabel(sender?.senderStatus)}
            </Badge>
          </div>
          <dl className="mt-5 grid gap-3 text-sm">
            <div>
              <dt className="font-bold text-[var(--muted)]">Numéro actuel</dt>
              <dd className="mt-1 font-black">{sender?.phoneDisplay ?? "Non configuré"}</dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--muted)]">Fournisseur</dt>
              <dd className="mt-1">Twilio</dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--muted)]">Dernière synchronisation</dt>
              <dd className="mt-1">{formatRelativeDate(sender?.lastSyncedAt ?? null)}</dd>
            </div>
          </dl>
          {isSuperAdmin ? (
            <div className="mt-5 grid gap-3">
              <AdminActionForm
                action={syncTwilioSenderAction}
                organizationId={organizationId}
                organizationName={organizationName}
                className="grid gap-2"
              >
                <Button className="w-full" type="submit" variant="outline">
                  Synchroniser
                </Button>
              </AdminActionForm>
              <input
                className="min-h-11 rounded-2xl border border-[var(--line)] px-4 text-sm"
                onChange={(event) => setPhoneNumberSid(event.target.value)}
                placeholder="PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={phoneNumberSid}
              />
              <form
                action={async (formData) => {
                  formData.set("phoneNumberSid", phoneNumberSid);
                  await assignTwilioPhoneNumberAction(formData);
                }}
              >
                <input name="organizationId" type="hidden" value={organizationId} />
                <Button className="w-full" disabled={!phoneNumberSid} type="submit" variant="outline">
                  Gérer le numéro
                </Button>
              </form>
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black">✈️ Service d&apos;envoi</p>
            </div>
            <Badge
              tone={statusTone(
                sender?.inboundWebhookConfigured && sender?.statusCallbackConfigured
                  ? "Configuré"
                  : "À configurer"
              )}
            >
              {sender?.inboundWebhookConfigured && sender?.statusCallbackConfigured
                ? "Configuré"
                : "À configurer"}
            </Badge>
          </div>
          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="font-bold text-[var(--muted)]">Webhook entrant</dt>
              <dd>{sender?.inboundWebhookConfigured ? "✓ Configuré" : "Manquant"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="font-bold text-[var(--muted)]">Callback de statut</dt>
              <dd>{sender?.statusCallbackConfigured ? "✓ Configuré" : "Manquant"}</dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--muted)]">Pool d&apos;envoi</dt>
              <dd className="mt-1">{sender?.phoneE164 ? "1 numéro" : "0 numéro"}</dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--muted)]">Dernier callback</dt>
              <dd className="mt-1">
                {formatRelativeDate(sender?.lastStatusCallbackAt ?? null)}
              </dd>
            </div>
          </dl>
          {isSuperAdmin ? (
            <div className="mt-5 grid gap-2">
              <AdminActionForm
                action={createOrUpdateMessagingServiceAction}
                organizationId={organizationId}
                organizationName={organizationName}
              >
                <Button className="w-full" type="submit" variant="outline">
                  Configurer le service
                </Button>
              </AdminActionForm>
              <AdminActionForm
                action={configureTwilioWebhooksAction}
                organizationId={organizationId}
                organizationName={organizationName}
              >
                <Button className="w-full" type="submit" variant="outline">
                  Configurer les intégrations
                </Button>
              </AdminActionForm>
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black">🛡️ Conformité</p>
            </div>
            <Badge tone={statusTone(complianceLabel(sender?.complianceStatus))}>
              {complianceLabel(sender?.complianceStatus)}
            </Badge>
          </div>
          <dl className="mt-5 grid gap-3 text-sm">
            <div>
              <dt className="font-bold text-[var(--muted)]">Type de consentement</dt>
              <dd className="mt-1">Opt-in explicite</dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--muted)]">Support STOP / AIDE</dt>
              <dd className="mt-1">
                {sender?.stopHelpStatus === "active" ? "Activé" : "À vérifier"}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--muted)]">Statut de conformité</dt>
              <dd className="mt-1">
                <Badge tone={statusTone(complianceLabel(sender?.complianceStatus))}>
                  {complianceLabel(sender?.complianceStatus)}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--muted)]">Dernière vérification</dt>
              <dd className="mt-1">{formatRelativeDate(sender?.lastSyncedAt ?? null)}</dd>
            </div>
          </dl>
          {isSuperAdmin ? (
            <AdminActionForm
              action={approveSmsComplianceAction}
              organizationId={organizationId}
              organizationName={organizationName}
              className="mt-5"
            >
              <Button className="w-full" type="submit" variant="outline">
                Voir les détails de conformité
              </Button>
            </AdminActionForm>
          ) : null}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-black">💬 Message de test</p>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-2 text-sm">
              <span className="font-bold text-[var(--muted)]">Numéro de téléphone</span>
              <input
                className="min-h-11 rounded-2xl border border-[var(--line)] px-4"
                disabled={!isSuperAdmin}
                onChange={(event) => setTestPhone(event.target.value)}
                value={testPhone}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-bold text-[var(--muted)]">Aperçu du message</span>
              <textarea
                className="min-h-28 rounded-2xl border border-[var(--line)] px-4 py-3"
                disabled={!isSuperAdmin}
                onChange={(event) => setTestMessage(event.target.value)}
                value={testMessage}
              />
              <span className="text-xs text-[var(--muted)]">
                {testMessage.length} / 160 caractères
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <form
                action={async (formData) => {
                  formData.set("testPhoneE164", testPhone);
                  formData.set("testMessageBody", testMessage);
                  await sendSmsSetupTestAction(formData);
                }}
              >
                <input name="organizationId" type="hidden" value={organizationId} />
                <Button disabled={testBlocked} type="submit">
                  Envoyer un SMS test
                </Button>
              </form>
              <form
                action={async (formData) => {
                  formData.set("testPhoneE164", testPhone);
                  formData.set("testMessageBody", testMessage);
                  await runFullSmsSetupTestAction(formData);
                }}
              >
                <input name="organizationId" type="hidden" value={organizationId} />
                <Button disabled={testBlocked} type="submit" variant="outline">
                  Lancer le test complet
                </Button>
              </form>
            </div>
            {testBlocked ? (
              <p className="text-xs text-[var(--muted)]">
                Test bloqué : vérifiez le numéro dédié, les webhooks, ALLOW_REAL_SMS_SENDS et
                vos droits super_admin.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-black">🛡️ Checklist SMS</p>
          <ul className="mt-4 grid gap-3">
            {readiness.checks.map((check) => (
              <li
                className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--line)] px-4 py-3"
                key={check.key}
              >
                <div>
                  <p className="text-sm font-black">{check.label}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{check.description}</p>
                </div>
                <Badge tone={statusTone(check.status === "active" ? "Actif" : "Manquant")}>
                  {check.status === "active"
                    ? "Actif"
                    : check.status === "pending"
                      ? "À vérifier"
                      : "Manquant"}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {isSuperAdmin ? (
        <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-black">Configuration Twilio avancée</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <AdminActionForm
              action={createTwilioSubaccountAction}
              organizationId={organizationId}
              organizationName={organizationName}
            >
              <Button type="submit" variant="outline">
                Créer un sous-compte Twilio
              </Button>
            </AdminActionForm>
            <div className="grid gap-2">
              <input
                className="min-h-11 rounded-2xl border border-[var(--line)] px-4 text-sm"
                onChange={(event) => setSubaccountSid(event.target.value)}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={subaccountSid}
              />
              <form
                action={async (formData) => {
                  formData.set("subaccountSid", subaccountSid);
                  await connectTwilioSubaccountAction(formData);
                }}
              >
                <input name="organizationId" type="hidden" value={organizationId} />
                <Button disabled={!subaccountSid} type="submit" variant="outline">
                  Connecter un sous-compte
                </Button>
              </form>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <form
              action={async (formData) => {
                await activateSmsForOrganizationAction(formData);
              }}
            >
              <input name="organizationId" type="hidden" value={organizationId} />
              <Button disabled={!readiness.canActivate} type="submit">
                Activer les SMS pour cette compagnie
              </Button>
            </form>
            <form
              action={async (formData) => {
                await pauseSmsForOrganizationAction(formData);
              }}
            >
              <input name="organizationId" type="hidden" value={organizationId} />
              <Button type="submit" variant="outline">
                Mettre en pause
              </Button>
            </form>
            <form
              action={async (formData) => {
                await blockSmsForOrganizationAction(formData);
              }}
            >
              <input name="organizationId" type="hidden" value={organizationId} />
              <Button type="submit" variant="destructive">
                Bloquer
              </Button>
            </form>
          </div>
          {!readiness.canActivate && readiness.blockingReasons.length > 0 ? (
            <ul className="mt-4 list-disc pl-5 text-sm text-[var(--muted)]">
              {readiness.blockingReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-black">📈 Activité SMS récente</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-xs uppercase tracking-wide text-[var(--muted)]">
                  <th className="px-3 py-2">Date et heure</th>
                  <th className="px-3 py-2">Direction</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2">Aperçu du message</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((row) => (
                  <tr className="border-b border-[var(--line)]" key={row.id}>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {dateFormatter.format(new Date(row.createdAt))}
                    </td>
                    <td className="px-3 py-3">
                      {row.direction === "outbound" ? "Sortant" : "Entrant"}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                    </td>
                    <td className="px-3 py-3">{row.customerName ?? "—"}</td>
                    <td className="px-3 py-3 max-w-xs truncate">{row.bodyPreview}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentActivity.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted)]">Aucune activité SMS récente.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-black">🔔 Rappels importants</p>
          <ul className="mt-4 grid gap-4 text-sm">
            <li>
              <p className="font-black">Consentement requis</p>
              <p className="mt-1 text-[var(--muted)]">
                Le SMS ne peut être envoyé qu&apos;après un opt-in explicite.
              </p>
            </li>
            <li>
              <p className="font-black">Confirmation manuelle</p>
              <p className="mt-1 text-[var(--muted)]">
                Les réponses positives ne confirment jamais automatiquement un rendez-vous.
              </p>
            </li>
            <li>
              <p className="font-black">Réponse STOP</p>
              <p className="mt-1 text-[var(--muted)]">
                Le client peut se désabonner à tout moment en répondant STOP.
              </p>
            </li>
            <li>
              <p className="font-black">Heures d&apos;envoi</p>
              <p className="mt-1 text-[var(--muted)]">
                Évitez d&apos;envoyer des SMS entre 21h00 et 8h00.
              </p>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
