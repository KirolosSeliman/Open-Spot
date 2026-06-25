import Link from "next/link";
import { notFound } from "next/navigation";

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
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

type AdminOrganizationBillingPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    saved?: string;
  }>;
};

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency
  }).format(cents / 100);
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("en-CA") : "Not recorded";
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
      ? "bg-[var(--primary)] text-white"
      : tone === "danger"
        ? "border border-red-200 bg-red-50 text-red-700"
        : "border border-[var(--line)] bg-white text-[var(--foreground)]";

  return (
    <form action={action} className="grid gap-2">
      <input name="organizationId" type="hidden" value={organizationId} />
      <textarea
        className="min-h-20 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm"
        name="note"
        placeholder={notePlaceholder}
      />
      <button
        className={`min-h-11 rounded-full px-5 text-sm font-black ${buttonClass}`}
        type="submit"
      >
        {label}
      </button>
      {confirm ? (
        <label className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">
          <input
            className="mt-1"
            name="confirmCancel"
            required
            type="checkbox"
          />
          <span>{confirm}</span>
        </label>
      ) : null}
    </form>
  );
}

export default async function AdminOrganizationBillingPage({
  params,
  searchParams
}: AdminOrganizationBillingPageProps) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const access = await requireCurrentPlatformAdmin();

  if (access.status === "unconfigured") {
    return (
      <section className="grid gap-6">
        <h1 className="text-3xl font-black">Billing</h1>
        <Card>{access.message}</Card>
      </section>
    );
  }

  if (access.status !== "authorized") {
    notFound();
  }

  const panel = await loadManualBillingForAdmin({
    admin: access.admin,
    organizationId: id
  });

  if (!panel) {
    notFound();
  }

  const { billing, events } = panel;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            Manual billing
          </p>
          <h1 className="mt-2 text-3xl font-black">Billing</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Manual billing mode: mark the payment as received once it is
            confirmed in Stripe, Interac, or your external payment method.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex min-h-11 items-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black"
            href={`/admin/organizations/${id}`}
          >
            Back to overview
          </Link>
          <Link
            className="inline-flex min-h-11 items-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black"
            href={`/admin/organizations/${id}/billing`}
          >
            Refresh
          </Link>
        </div>
      </div>

      {query.error ? (
        <Card className="border-red-200 bg-red-50 text-red-800">
          <p className="font-black">Billing update failed</p>
          <p className="mt-1 text-sm">{query.error}</p>
        </Card>
      ) : null}
      {query.saved ? (
        <Card className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <p className="font-black">Billing changes saved.</p>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[0.7fr_0.3fr]">
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-black">Current billing status</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                SMS sending is available only when billing is paid, onboarding
                is completed, and SMS status is active.
              </p>
            </div>
            <Badge tone={getBillingStatusTone(billing.billingStatus)}>
              {getBillingStatusLabel(billing.billingStatus, "en")}
            </Badge>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Plan", billing.planName],
              ["Price", formatMoney(billing.monthlyPriceCents, billing.currency)],
              ["Interval", getBillingIntervalLabel(billing.billingInterval, "en")],
              ["Method", getPaymentMethodLabel(billing.paymentMethod, "en")],
              ["Last payment", formatDate(billing.lastPaymentAt)],
              ["Period start", formatDate(billing.currentPeriodStart)],
              ["Period end", formatDate(billing.currentPeriodEnd)],
              ["Next due", formatDate(billing.nextPaymentDueAt)]
            ].map(([label, value]) => (
              <div
                className="rounded-2xl border border-[var(--line)] bg-slate-50 p-4"
                key={label}
              >
                <p className="text-xs font-bold text-[var(--muted)]">{label}</p>
                <p className="mt-2 text-sm font-black">{value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-black">Payment link</h2>
          <p className="mt-2 break-all text-sm leading-6 text-[var(--muted)]">
            {billing.externalPaymentUrl ?? "No external URL stored."}
          </p>
          <div className="mt-4">
            <PaymentLinkActions url={billing.externalPaymentUrl} />
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-black">Plan and payment details</h2>
        <form action={updateManualBillingPlanAction} className="mt-5 grid gap-4 lg:grid-cols-2">
          <input name="organizationId" type="hidden" value={id} />
          <label className="grid gap-2 text-sm font-bold">
            Plan
            <select
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-bold"
              defaultValue={billing.planName}
              name="planName"
            >
              <option value="Founder Pilot">Founder Pilot</option>
              <option value="Starter">Starter</option>
              <option value="Pro">Pro</option>
              <option value="Custom">Custom</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Monthly price
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
              defaultValue={(billing.monthlyPriceCents / 100).toFixed(2)}
              min="0"
              name="monthlyPrice"
              step="0.01"
              type="number"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Currency
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm uppercase"
              defaultValue={billing.currency}
              maxLength={3}
              name="currency"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Interval
            <select
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-bold"
              defaultValue={billing.billingInterval}
              name="billingInterval"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="one_time">One-time</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Payment method
            <select
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-bold"
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
          <label className="grid gap-2 text-sm font-bold">
            External payment URL
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
              defaultValue={billing.externalPaymentUrl ?? ""}
              name="externalPaymentUrl"
              placeholder="https://..."
              type="url"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            External customer reference
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
              defaultValue={billing.externalCustomerReference ?? ""}
              name="externalCustomerReference"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Stripe customer ID
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
              defaultValue={billing.stripeCustomerId ?? ""}
              name="stripeCustomerId"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Stripe subscription ID
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
              defaultValue={billing.stripeSubscriptionId ?? ""}
              name="stripeSubscriptionId"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Stripe payment link ID
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
              defaultValue={billing.stripePaymentLinkId ?? ""}
              name="stripePaymentLinkId"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Stripe invoice ID
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
              defaultValue={billing.stripeInvoiceId ?? ""}
              name="stripeInvoiceId"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold lg:col-span-2">
            Internal notes
            <textarea
              className="min-h-28 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm"
              defaultValue={billing.internalNotes ?? ""}
              name="internalNotes"
              placeholder="Internal payment context. Never shown to clients."
            />
          </label>
          <button className="min-h-11 w-fit rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white" type="submit">
            Update plan / price
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-black">Status actions</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatusAction
            action={markBillingUnpaidAction}
            label="Set as unpaid"
            notePlaceholder="Reason for unpaid status"
            organizationId={id}
          />
          <StatusAction
            action={markPaymentLinkSentAction}
            label="Mark payment link sent"
            notePlaceholder="Where the payment link or invoice was sent"
            organizationId={id}
          />
          <StatusAction
            action={markBillingPaidAction}
            label="Mark as paid"
            notePlaceholder="Payment confirmation note"
            organizationId={id}
            tone="primary"
          />
          <StatusAction
            action={markBillingPastDueAction}
            label="Mark as past due"
            notePlaceholder="Past due reason"
            organizationId={id}
          />
          <StatusAction
            action={cancelManualBillingAction}
            confirm="Cancelling blocks new SMS sends. It does not delete organization data."
            label="Cancel subscription"
            notePlaceholder="Cancellation reason"
            organizationId={id}
            tone="danger"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black">Add internal billing note</h2>
        <form action={addManualBillingNoteAction} className="mt-4 grid gap-3">
          <input name="organizationId" type="hidden" value={id} />
          <textarea
            className="min-h-24 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm"
            name="note"
            placeholder="Internal note"
            required
          />
          <button className="min-h-11 w-fit rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black" type="submit">
            Add internal billing note
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-black">Billing history</h2>
        <div className="mt-5 grid gap-3">
          {events.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No billing events yet.</p>
          ) : (
            events.map((event) => (
              <div
                className="rounded-2xl border border-[var(--line)] bg-slate-50 p-4"
                key={event.id}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-black">{event.eventType}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {event.oldStatus ?? "—"} → {event.newStatus ?? "—"}
                    </p>
                    {event.note ? (
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {event.note}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-xs font-bold text-[var(--muted)]">
                    {formatDate(event.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </section>
  );
}
