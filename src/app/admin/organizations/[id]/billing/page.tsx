import { notFound } from "next/navigation";

import {
  CompanyAnalyticsCharts,
  CompanyBillingKpiCards,
  formatCompanyMoney
} from "@/components/admin/company-detail/company-analytics-section";
import { CompanyBillingTermsForm } from "@/components/admin/company-detail/company-billing-terms-form";
import { CompanyDateRangeFilter } from "@/components/admin/company-detail/company-date-range-filter";
import { CompanyDetailHeader } from "@/components/admin/company-detail/company-detail-header";
import { CompanyDetailCard, CompanyDetailSectionTitle } from "@/components/admin/company-detail/company-detail-ui";
import { BillingPaymentReminderButton } from "@/components/admin/billing-payment-reminder-button";
import { PaymentLinkActions } from "@/components/admin/payment-link-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  addManualBillingNoteAction,
  cancelManualBillingAction,
  markBillingPaidAction,
  markBillingPastDueAction,
  markBillingUnpaidAction,
  markPaymentLinkSentAction,
  updateManualBillingPlanAction
} from "@/lib/billing/manual-billing-actions";
import { loadManualBillingForAdmin } from "@/lib/billing/manual-billing-data";
import {
  getBillingIntervalLabel,
  getBillingStatusLabel,
  getBillingStatusTone,
  getPaymentMethodLabel
} from "@/lib/billing/manual-billing";
import { loadCompanyDetailOverview } from "@/lib/admin/company-detail-data";
import { parseAdminDateRange } from "@/lib/admin/date-range";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";
import { loadBillingPaymentReminderContext } from "@/lib/sms/billing-payment-reminder";

function getSingleSearchParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

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
      ? "bg-[#2563ff] text-white"
      : tone === "danger"
        ? "border border-red-200 bg-red-50 text-red-700"
        : "border border-[#e2eaf5] bg-white text-[#0b1328]";

  return (
    <form action={action} className="grid gap-2">
      <input name="organizationId" type="hidden" value={organizationId} />
      <textarea
        className="min-h-20 rounded-[13px] border border-[#e2eaf5] bg-white px-4 py-3 text-sm"
        name="note"
        placeholder={notePlaceholder}
      />
      <button
        className={`min-h-11 rounded-[13px] px-5 text-sm font-bold ${buttonClass}`}
        type="submit"
      >
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

export default async function AdminOrganizationBillingPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const range = parseAdminDateRange({
    range: getSingleSearchParam(query.range),
    from: getSingleSearchParam(query.from),
    to: getSingleSearchParam(query.to)
  });
  const access = await requireCurrentPlatformAdmin();

  if (access.status === "unconfigured") {
    return (
      <section className="grid gap-6">
        <CompanyDetailHeader
          activeAction="billing"
          description={access.message}
          organizationId={id}
          refreshHref={`/admin/organizations/${id}/billing`}
          title="Facturation et analytique"
        />
      </section>
    );
  }

  if (access.status !== "authorized") {
    notFound();
  }

  const [detail, manualBillingPanel] = await Promise.all([
    loadCompanyDetailOverview({
      admin: access.admin,
      organizationId: id,
      range
    }),
    loadManualBillingForAdmin({
      admin: access.admin,
      organizationId: id
    })
  ]);

  if (!detail || !manualBillingPanel) {
    notFound();
  }

  const { overview, controlsPanel, estimatedTotalContributionCents } = detail;
  const { billing, events, organizationName } = manualBillingPanel;
  const canManageBilling = access.admin.role === "super_admin";
  const paymentReminder = await loadBillingPaymentReminderContext({
    organizationId: id,
    organizationName,
    billing
  });
  const currency = overview.billing.terms.currency;
  const refreshHref = `/admin/organizations/${id}/billing?range=${overview.range.rangeKey}`;

  return (
    <section className="grid gap-6">
      <CompanyDetailHeader
        activeAction="billing"
        description={`Gérez les conditions de facturation et suivez les performances financières et opérationnelles de ${overview.organization.name}.`}
        organizationId={id}
        refreshHref={refreshHref}
        title="Facturation et analytique"
      />

      {query.error ? (
        <CompanyDetailCard className="border-red-200 bg-red-50 text-red-800">
          <p className="font-bold">Échec de la mise à jour de la facturation</p>
          <p className="mt-1 text-sm">{query.error}</p>
        </CompanyDetailCard>
      ) : null}
      {query.saved ? (
        <CompanyDetailCard className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <p className="font-bold">Modifications de facturation enregistrées.</p>
        </CompanyDetailCard>
      ) : null}

      <CompanyBillingTermsForm
        canEdit={controlsPanel.permissions.canUpdateBillingTerms}
        notes={overview.billing.notes}
        organizationId={id}
        terms={overview.billing.terms}
      />

      <CompanyDateRangeFilter range={range} rangeKey={overview.range.rangeKey} />

      <CompanyBillingKpiCards
        estimatedContributionLabel={formatCompanyMoney(
          estimatedTotalContributionCents,
          currency
        )}
        estimatedSmsCostLabel={formatCompanyMoney(
          overview.billing.estimatedSmsCostInRangeCents,
          currency
        )}
        filledSpotFeesLabel={formatCompanyMoney(
          overview.billing.filledSpotFeesInRangeCents,
          currency
        )}
        filledSpotsInRange={overview.billing.filledSpotsInRange}
        monthlySubscriptionLabel={formatCompanyMoney(
          overview.billing.terms.monthlySubscriptionCents,
          currency
        )}
      />

      <div id="analytics">
        <CompanyAnalyticsCharts charts={overview.charts} currency={currency} />
      </div>

      {overview.billing.warnings.length > 0 ? (
        <CompanyDetailCard>
          {overview.billing.warnings.map((warning) => (
            <p className="text-sm text-[#64748b]" key={warning}>
              {warning}
            </p>
          ))}
        </CompanyDetailCard>
      ) : null}

      <CompanyDetailCard className="grid gap-6">
        <CompanyDetailSectionTitle>Facturation manuelle</CompanyDetailSectionTitle>
        <p className="text-sm leading-7 text-[#64748b]">
          Mode de facturation manuelle : marquez le paiement comme reçu une fois
          confirmé dans Stripe, Interac ou votre méthode externe.
        </p>

        <div className="grid gap-4 lg:grid-cols-[0.7fr_0.3fr]">
          <Card className="rounded-[24px] border-[#e2eaf5] shadow-none">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0b1328]">Statut de facturation actuel</h3>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">
                  L&apos;envoi SMS est disponible uniquement lorsque la facturation est
                  payée, l&apos;onboarding est complété et le statut SMS est actif.
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
                  className="rounded-[16px] border border-[#e2eaf5] bg-[#f8fbff] p-4"
                  key={label}
                >
                  <p className="text-xs font-semibold text-[#64748b]">{label}</p>
                  <p className="mt-2 text-sm font-bold text-[#0b1328]">{value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[24px] border-[#e2eaf5] shadow-none">
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
                    organizationId={id}
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
          </Card>
        </div>

        <Card className="rounded-[24px] border-[#e2eaf5] shadow-none">
          <h3 className="text-lg font-bold text-[#0b1328]">Plan et détails de paiement</h3>
          <form action={updateManualBillingPlanAction} className="mt-5 grid gap-4 lg:grid-cols-2">
            <input name="organizationId" type="hidden" value={id} />
            <label className="grid gap-2 text-sm font-semibold text-[#64748b]">
              Plan
              <select
                className="min-h-11 rounded-[13px] border border-[#e2eaf5] bg-white px-4 text-sm font-semibold"
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
                className="min-h-11 rounded-[13px] border border-[#e2eaf5] bg-white px-4 text-sm"
                defaultValue={(billing.monthlyPriceCents / 100).toFixed(2)}
                min="0"
                name="monthlyPrice"
                step="0.01"
                type="number"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[#64748b] lg:col-span-2">
              Notes internes
              <textarea
                className="min-h-28 rounded-[13px] border border-[#e2eaf5] bg-white px-4 py-3 text-sm"
                defaultValue={billing.internalNotes ?? ""}
                name="internalNotes"
                placeholder="Contexte interne de paiement. Jamais visible par les clients."
              />
            </label>
            <button
              className="min-h-11 w-fit rounded-[13px] bg-[#2563ff] px-5 text-sm font-bold text-white"
              type="submit"
            >
              Mettre à jour le plan / prix
            </button>
          </form>
        </Card>

        <Card className="rounded-[24px] border-[#e2eaf5] shadow-none">
          <h3 className="text-lg font-bold text-[#0b1328]">Actions de statut</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatusAction
              action={markBillingUnpaidAction}
              label="Marquer impayé"
              notePlaceholder="Raison du statut impayé"
              organizationId={id}
            />
            <StatusAction
              action={markPaymentLinkSentAction}
              label="Lien de paiement envoyé"
              notePlaceholder="Où le lien ou la facture a été envoyé"
              organizationId={id}
            />
            <StatusAction
              action={markBillingPaidAction}
              label="Marquer payé"
              notePlaceholder="Note de confirmation de paiement"
              organizationId={id}
              tone="primary"
            />
            <StatusAction
              action={markBillingPastDueAction}
              label="Marquer en retard"
              notePlaceholder="Raison du retard"
              organizationId={id}
            />
            <StatusAction
              action={cancelManualBillingAction}
              confirm="L'annulation bloque les nouveaux envois SMS. Aucune donnée n'est supprimée."
              label="Annuler l'abonnement"
              notePlaceholder="Raison de l'annulation"
              organizationId={id}
              tone="danger"
            />
          </div>
        </Card>

        <Card className="rounded-[24px] border-[#e2eaf5] shadow-none">
          <h3 className="text-lg font-bold text-[#0b1328]">Historique de facturation</h3>
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
        </Card>

        <Card className="rounded-[24px] border-[#e2eaf5] shadow-none">
          <h3 className="text-lg font-bold text-[#0b1328]">Ajouter une note interne</h3>
          <form action={addManualBillingNoteAction} className="mt-4 grid gap-3">
            <input name="organizationId" type="hidden" value={id} />
            <textarea
              className="min-h-24 rounded-[13px] border border-[#e2eaf5] bg-white px-4 py-3 text-sm"
              name="note"
              placeholder="Note interne"
              required
            />
            <button
              className="min-h-11 w-fit rounded-[13px] border border-[#e2eaf5] bg-white px-5 text-sm font-bold text-[#0b1328]"
              type="submit"
            >
              Ajouter une note interne
            </button>
          </form>
        </Card>
      </CompanyDetailCard>
    </section>
  );
}
