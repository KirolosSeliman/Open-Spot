import { BillingPaymentReminderButton } from "@/components/admin/billing-payment-reminder-button";
import { PaymentLinkActions } from "@/components/admin/payment-link-actions";
import {
  companyDetailInputClassName,
  companyDetailPrimaryButtonClassName,
  companyDetailSecondaryButtonClassName,
  CompanyDetailCard,
  CompanyDetailSectionTitle
} from "@/components/admin/company-detail/company-detail-ui";
import { Badge } from "@/components/ui/badge";
import {
  addManualBillingNoteAction,
  cancelManualBillingAction,
  markBillingPaidAction,
  markBillingPastDueAction,
  markBillingUnpaidAction,
  markPaymentLinkSentAction,
  updateManualBillingPlanAction
} from "@/lib/billing/manual-billing-actions";
import {
  getBillingIntervalLabel,
  getBillingStatusLabel,
  getBillingStatusTone,
  getPaymentMethodLabel
} from "@/lib/billing/manual-billing";
import type { BillingEvent, ManualBillingSummary } from "@/lib/billing/manual-billing-data";
import type { loadBillingPaymentReminderContext } from "@/lib/sms/billing-payment-reminder";

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency
  }).format(cents / 100);
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("fr-CA") : "Non enregistré";
}

function StatusAction({
  action,
  organizationId,
  label,
  notePlaceholder,
  tone = "default",
  confirm
}: {
  action: (formData: FormData) => void | Promise<void>;
  organizationId: string;
  label: string;
  notePlaceholder: string;
  tone?: "default" | "primary" | "danger";
  confirm?: string;
}) {
  const buttonClass =
    tone === "primary"
      ? companyDetailPrimaryButtonClassName
      : tone === "danger"
        ? "inline-flex min-h-11 items-center justify-center rounded-[13px] border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-700"
        : companyDetailSecondaryButtonClassName;

  return (
    <form action={action} className="grid gap-2">
      <input name="organizationId" type="hidden" value={organizationId} />
      <textarea
        className={`${companyDetailInputClassName} min-h-20 py-3`}
        name="note"
        placeholder={notePlaceholder}
      />
      <button className={buttonClass} type="submit">
        {label}
      </button>
      {confirm ? (
        <label className="flex items-start gap-2 rounded-[13px] border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">
          <input className="mt-1" name="confirmCancel" required type="checkbox" />
          <span>{confirm}</span>
        </label>
      ) : null}
    </form>
  );
}

type ManualBillingPanelProps = {
  organizationId: string;
  organizationName: string;
  billing: ManualBillingSummary;
  events: BillingEvent[];
  paymentReminder: Awaited<ReturnType<typeof loadBillingPaymentReminderContext>>;
  canManageBilling: boolean;
};

export function CompanyManualBillingPanel({
  organizationId,
  organizationName,
  billing,
  events,
  paymentReminder,
  canManageBilling
}: ManualBillingPanelProps) {
  return (
    <div className="grid gap-6">
      <CompanyDetailCard>
        <CompanyDetailSectionTitle>Facturation manuelle</CompanyDetailSectionTitle>
        <p className="mt-2 text-sm leading-7 text-[#64748b]">
          Marquez le paiement comme reçu une fois confirmé dans Stripe, Interac ou
          votre méthode externe.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-[0.7fr_0.3fr]">
          <div className="rounded-[20px] border border-[#e2eaf5] bg-[#f8fbff] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0b1328]">Statut de facturation actuel</h3>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">
                  L&apos;envoi SMS est disponible uniquement lorsque la facturation est
                  payée et le statut SMS est actif.
                </p>
              </div>
              <Badge tone={getBillingStatusTone(billing.billingStatus)}>
                {getBillingStatusLabel(billing.billingStatus, "fr")}
              </Badge>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Plan", billing.planName],
                ["Prix", formatMoney(billing.monthlyPriceCents, billing.currency)],
                ["Intervalle", getBillingIntervalLabel(billing.billingInterval, "fr")],
                ["Méthode", getPaymentMethodLabel(billing.paymentMethod, "fr")],
                ["Dernier paiement", formatDate(billing.lastPaymentAt)],
                ["Début période", formatDate(billing.currentPeriodStart)],
                ["Fin période", formatDate(billing.currentPeriodEnd)],
                ["Prochaine échéance", formatDate(billing.nextPaymentDueAt)]
              ].map(([label, value]) => (
                <div
                  className="rounded-[14px] border border-[#e2eaf5] bg-white p-4"
                  key={label}
                >
                  <p className="text-xs font-semibold text-[#64748b]">{label}</p>
                  <p className="mt-2 text-sm font-bold text-[#0b1328]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] border border-[#e2eaf5] bg-[#f8fbff] p-5">
            <h3 className="text-lg font-bold text-[#0b1328]">Lien de paiement</h3>
            <p className="mt-2 break-all text-sm leading-6 text-[#64748b]">
              {billing.externalPaymentUrl ?? "Aucune URL externe enregistrée."}
            </p>
            <div className="mt-4">
              <PaymentLinkActions url={billing.externalPaymentUrl} />
            </div>
            <div className="mt-6 border-t border-[#e2eaf5] pt-6">
              <h4 className="text-sm font-bold uppercase tracking-[0.12em] text-[#2563ff]">
                Rappel SMS
              </h4>
              <div className="mt-4">
                {canManageBilling ? (
                  <BillingPaymentReminderButton
                    amountDue={paymentReminder.amountDue}
                    billingPeriod={paymentReminder.billingPeriod}
                    canSend={paymentReminder.canSend}
                    contactName={paymentReminder.contact?.contactName ?? null}
                    contactPhone={paymentReminder.contact?.phoneDisplay ?? null}
                    disabledReason={paymentReminder.disabledReason}
                    lastReminderSentAt={paymentReminder.lastReminderSentAt}
                    messagePreview={paymentReminder.messagePreview}
                    organizationId={organizationId}
                    organizationName={organizationName}
                  />
                ) : (
                  <p className="text-sm font-semibold text-[#64748b]">
                    Seuls les administrateurs Open Spot autorisés peuvent envoyer un
                    rappel de paiement.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CompanyDetailCard>

      <CompanyDetailCard>
        <CompanyDetailSectionTitle>Plan et détails de paiement</CompanyDetailSectionTitle>
        <form action={updateManualBillingPlanAction} className="mt-5 grid gap-4 lg:grid-cols-2">
          <input name="organizationId" type="hidden" value={organizationId} />
          <label className="grid gap-2 text-sm font-semibold text-[#64748b]">
            Plan
            <select
              className={companyDetailInputClassName}
              defaultValue={billing.planName}
              name="planName"
            >
              <option value="Founder Pilot">Founder Pilot</option>
              <option value="Starter">Starter</option>
              <option value="Pro">Pro</option>
              <option value="Custom">Custom</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#64748b]">
            Prix mensuel
            <input
              className={companyDetailInputClassName}
              defaultValue={(billing.monthlyPriceCents / 100).toFixed(2)}
              min="0"
              name="monthlyPrice"
              step="0.01"
              type="number"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#64748b]">
            Devise
            <input
              className={companyDetailInputClassName}
              defaultValue={billing.currency}
              maxLength={3}
              name="currency"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#64748b]">
            Intervalle
            <select
              className={companyDetailInputClassName}
              defaultValue={billing.billingInterval}
              name="billingInterval"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="one_time">One-time</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#64748b]">
            Méthode de paiement
            <select
              className={companyDetailInputClassName}
              defaultValue={billing.paymentMethod}
              name="paymentMethod"
            >
              <option value="manual_external">Manual external</option>
              <option value="stripe_payment_link">Stripe Payment Link</option>
              <option value="stripe_invoice">Stripe Invoice</option>
              <option value="interac">Interac</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#64748b]">
            URL de paiement externe
            <input
              className={companyDetailInputClassName}
              defaultValue={billing.externalPaymentUrl ?? ""}
              name="externalPaymentUrl"
              placeholder="https://..."
              type="url"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#64748b]">
            Référence client externe
            <input
              className={companyDetailInputClassName}
              defaultValue={billing.externalCustomerReference ?? ""}
              name="externalCustomerReference"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#64748b]">
            Stripe customer ID
            <input
              className={companyDetailInputClassName}
              defaultValue={billing.stripeCustomerId ?? ""}
              name="stripeCustomerId"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#64748b]">
            Stripe subscription ID
            <input
              className={companyDetailInputClassName}
              defaultValue={billing.stripeSubscriptionId ?? ""}
              name="stripeSubscriptionId"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#64748b]">
            Stripe payment link ID
            <input
              className={companyDetailInputClassName}
              defaultValue={billing.stripePaymentLinkId ?? ""}
              name="stripePaymentLinkId"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#64748b]">
            Stripe invoice ID
            <input
              className={companyDetailInputClassName}
              defaultValue={billing.stripeInvoiceId ?? ""}
              name="stripeInvoiceId"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#64748b] lg:col-span-2">
            Notes internes
            <textarea
              className={`${companyDetailInputClassName} min-h-28 py-3`}
              defaultValue={billing.internalNotes ?? ""}
              name="internalNotes"
              placeholder="Contexte interne de paiement. Jamais visible par les clients."
            />
          </label>
          <button className={`${companyDetailPrimaryButtonClassName} w-fit`} type="submit">
            Mettre à jour le plan / prix
          </button>
        </form>
      </CompanyDetailCard>

      <CompanyDetailCard>
        <CompanyDetailSectionTitle>Actions de statut</CompanyDetailSectionTitle>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatusAction
            action={markBillingUnpaidAction}
            label="Marquer impayé"
            notePlaceholder="Raison du statut impayé"
            organizationId={organizationId}
          />
          <StatusAction
            action={markPaymentLinkSentAction}
            label="Lien de paiement envoyé"
            notePlaceholder="Où le lien ou la facture a été envoyé"
            organizationId={organizationId}
          />
          <StatusAction
            action={markBillingPaidAction}
            label="Marquer payé"
            notePlaceholder="Note de confirmation de paiement"
            organizationId={organizationId}
            tone="primary"
          />
          <StatusAction
            action={markBillingPastDueAction}
            label="Marquer en retard"
            notePlaceholder="Raison du retard"
            organizationId={organizationId}
          />
          <StatusAction
            action={cancelManualBillingAction}
            confirm="L'annulation bloque les nouveaux envois SMS. Aucune donnée n'est supprimée."
            label="Annuler l'abonnement"
            notePlaceholder="Raison de l'annulation"
            organizationId={organizationId}
            tone="danger"
          />
        </div>
      </CompanyDetailCard>

      <CompanyDetailCard>
        <CompanyDetailSectionTitle>Ajouter une note interne</CompanyDetailSectionTitle>
        <form action={addManualBillingNoteAction} className="mt-4 grid gap-3">
          <input name="organizationId" type="hidden" value={organizationId} />
          <textarea
            className={`${companyDetailInputClassName} min-h-24 py-3`}
            name="note"
            placeholder="Note interne"
            required
          />
          <button className={`${companyDetailSecondaryButtonClassName} w-fit`} type="submit">
            Ajouter une note interne
          </button>
        </form>
      </CompanyDetailCard>

      <CompanyDetailCard>
        <CompanyDetailSectionTitle>Historique de facturation</CompanyDetailSectionTitle>
        <div className="mt-5 grid gap-3">
          {events.length === 0 ? (
            <p className="text-sm text-[#64748b]">Aucun événement de facturation.</p>
          ) : (
            events.map((event) => (
              <div
                className="rounded-[16px] border border-[#e2eaf5] bg-[#f8fbff] p-4"
                key={event.id}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold text-[#0b1328]">{event.eventType}</p>
                    <p className="mt-1 text-sm text-[#64748b]">
                      {event.oldStatus ?? "—"} → {event.newStatus ?? "—"}
                    </p>
                    {event.note ? (
                      <p className="mt-2 text-sm leading-6 text-[#64748b]">{event.note}</p>
                    ) : null}
                  </div>
                  <p className="text-xs font-semibold text-[#64748b]">
                    {formatDate(event.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CompanyDetailCard>
    </div>
  );
}
