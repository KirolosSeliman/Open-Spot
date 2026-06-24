"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input, Select, Textarea } from "@/components/ui/form-field";
import { getOnboardingStatusLabel } from "@/lib/organization/client-onboarding";
import type { ClientOnboardingRecord } from "@/lib/organization/onboarding-records";

type ClientOnboardingFlowProps = {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  saved?: boolean;
  submitted?: boolean;
  token: string;
  record: ClientOnboardingRecord;
};

const steps = [
  "Welcome",
  "Business",
  "Responsible",
  "Services",
  "SMS",
  "Consent",
  "Review"
] as const;

function moneyValue(cents: number | null) {
  return cents === null ? "" : (cents / 100).toFixed(2);
}

function StatusNotice({
  record,
  saved,
  submitted
}: {
  record: ClientOnboardingRecord;
  saved?: boolean;
  submitted?: boolean;
}) {
  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
        Onboarding submitted. Open Spot will review it before SMS setup is enabled.
      </div>
    );
  }

  if (saved) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-800">
        Draft saved. You can keep editing this secure onboarding link.
      </div>
    );
  }

  if (record.status === "changes_requested" && record.requestedChanges) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-black">Changes requested by Open Spot</p>
        <p className="mt-1 leading-6">{record.requestedChanges}</p>
      </div>
    );
  }

  return null;
}

export function ClientOnboardingFlow({
  action,
  error,
  saved,
  submitted,
  token,
  record
}: ClientOnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const serviceRows = useMemo(() => {
    const rows = record.services.length > 0 ? record.services : [];

    return Array.from({ length: 5 }, (_, index) => rows[index] ?? null);
  }, [record.services]);
  const isFinalStep = step === steps.length - 1;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(79,125,243,0.14),transparent_30rem),#f7f9fd] px-4 py-6 text-[var(--foreground)] sm:py-10">
      <main className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.42fr_0.58fr]">
        <aside className="rounded-[2rem] bg-[var(--dark)] p-5 text-white shadow-[0_24px_80px_rgba(8,11,18,0.24)] lg:sticky lg:top-6 lg:h-fit">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-white/48">
            Open Spot onboarding
          </p>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
            Configure SMS recovery safely.
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/68">
            We collect the operational details needed to prepare SMS alerts,
            compliance, and manual reply handling for {record.organization.name}.
          </p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-xs font-bold text-white/55">Current status</p>
            <p className="mt-1 text-lg font-black">
              {getOnboardingStatusLabel(record.status, "en")}
            </p>
          </div>
          <nav aria-label="Onboarding steps" className="mt-6 grid gap-2">
            {steps.map((label, index) => (
              <button
                className={`rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
                  index === step
                    ? "bg-white text-[var(--foreground)]"
                    : "bg-white/[0.06] text-white/62 hover:bg-white/[0.1]"
                }`}
                key={label}
                onClick={() => setStep(index)}
                type="button"
              >
                {index + 1}. {label}
              </button>
            ))}
          </nav>
        </aside>

        <Card className="p-5 sm:p-7">
          <div className="grid gap-4">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {error}
              </div>
            ) : null}
            <StatusNotice record={record} saved={saved} submitted={submitted} />
          </div>

          <form action={action} className="mt-6 grid gap-7">
            <input name="token" type="hidden" value={token} />

            <section className={step === 0 ? "grid gap-5" : "hidden"}>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--primary)]">
                    Step 1
                  </p>
                  <h2 className="mt-2 text-2xl font-black">Welcome</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    This form prepares your Open Spot workspace for last-minute
                    cancellation alerts. SMS replies only identify interested
                    clients; your team still chooses and confirms the person
                    manually in your booking system.
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-slate-50 p-4">
                  <p className="text-sm font-black">Before you start</p>
                  <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--muted)]">
                    <li>Have your main services and average values nearby.</li>
                    <li>Choose who owns SMS compliance for your business.</li>
                    <li>Do not include private client data in this form.</li>
                  </ul>
                </div>
            </section>

            <section className={step === 1 ? "grid gap-5" : "hidden"}>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--primary)]">
                    Step 2
                  </p>
                  <h2 className="mt-2 text-2xl font-black">Business information</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField htmlFor="businessName" label="Business name" required>
                    <Input
                      defaultValue={record.businessName}
                      id="businessName"
                      name="businessName"
                    />
                  </FormField>
                  <FormField htmlFor="businessType" label="Business type" required>
                    <Input
                      defaultValue={record.businessType}
                      id="businessType"
                      name="businessType"
                      placeholder="Clinic, salon, studio..."
                    />
                  </FormField>
                  <FormField htmlFor="bookingSystem" label="Booking system">
                    <Input
                      defaultValue={record.bookingSystem ?? ""}
                      id="bookingSystem"
                      name="bookingSystem"
                      placeholder="Square, Fresha, Google Calendar..."
                    />
                  </FormField>
                  <FormField htmlFor="publicContactEmail" label="Public email">
                    <Input
                      defaultValue={record.publicContactEmail ?? ""}
                      id="publicContactEmail"
                      name="publicContactEmail"
                      type="email"
                    />
                  </FormField>
                  <FormField htmlFor="publicContactPhone" label="Business phone">
                    <Input
                      defaultValue={record.publicContactPhone ?? ""}
                      id="publicContactPhone"
                      name="publicContactPhone"
                      placeholder="514-555-0100"
                    />
                  </FormField>
                  <FormField htmlFor="businessAddress" label="Business address">
                    <Input
                      defaultValue={record.businessAddress ?? ""}
                      id="businessAddress"
                      name="businessAddress"
                    />
                  </FormField>
                </div>
            </section>

            <section className={step === 2 ? "grid gap-5" : "hidden"}>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--primary)]">
                    Step 3
                  </p>
                  <h2 className="mt-2 text-2xl font-black">Account responsible person</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField htmlFor="responsibleName" label="Full name" required>
                    <Input
                      defaultValue={record.responsibleName}
                      id="responsibleName"
                      name="responsibleName"
                    />
                  </FormField>
                  <FormField htmlFor="responsibleRole" label="Role" required>
                    <Input
                      defaultValue={record.responsibleRole}
                      id="responsibleRole"
                      name="responsibleRole"
                    />
                  </FormField>
                  <FormField htmlFor="responsibleEmail" label="Email" required>
                    <Input
                      defaultValue={record.responsibleEmail}
                      id="responsibleEmail"
                      name="responsibleEmail"
                      type="email"
                    />
                  </FormField>
                  <FormField htmlFor="responsiblePhone" label="Phone">
                    <Input
                      defaultValue={record.responsiblePhone ?? ""}
                      id="responsiblePhone"
                      name="responsiblePhone"
                    />
                  </FormField>
                </div>
            </section>

            <section className={step === 3 ? "grid gap-5" : "hidden"}>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--primary)]">
                    Step 4
                  </p>
                  <h2 className="mt-2 text-2xl font-black">Services and value</h2>
                </div>
                <div className="grid gap-3">
                  {serviceRows.map((service, index) => (
                    <div
                      className="grid gap-3 rounded-2xl border border-[var(--line)] bg-slate-50 p-4 sm:grid-cols-[1fr_8rem_8rem]"
                      key={index}
                    >
                      <FormField label={`Service ${index + 1}`}>
                        <Input
                          defaultValue={service?.name ?? ""}
                          name={`service_${index}_name`}
                          placeholder="Facial, haircut, consultation..."
                        />
                      </FormField>
                      <FormField label="Minutes">
                        <Input
                          defaultValue={service?.durationMinutes ?? ""}
                          min={5}
                          name={`service_${index}_duration`}
                          type="number"
                        />
                      </FormField>
                      <FormField label="Value">
                        <Input
                          defaultValue={moneyValue(service?.valueCents ?? null)}
                          min={0}
                          name={`service_${index}_value`}
                          step="0.01"
                          type="number"
                        />
                      </FormField>
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    htmlFor="averageAppointmentValue"
                    label="Average appointment value"
                    required
                  >
                    <Input
                      defaultValue={moneyValue(record.averageAppointmentValueCents)}
                      id="averageAppointmentValue"
                      min={0}
                      name="averageAppointmentValue"
                      step="0.01"
                      type="number"
                    />
                  </FormField>
                  <FormField htmlFor="currency" label="Currency">
                    <Input
                      defaultValue={record.currency}
                      id="currency"
                      maxLength={3}
                      name="currency"
                    />
                  </FormField>
                </div>
            </section>

            <section className={step === 4 ? "grid gap-5" : "hidden"}>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--primary)]">
                    Step 5
                  </p>
                  <h2 className="mt-2 text-2xl font-black">SMS preferences</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField htmlFor="smsLanguage" label="Default SMS language">
                    <Select
                      defaultValue={record.smsLanguage}
                      id="smsLanguage"
                      name="smsLanguage"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </Select>
                  </FormField>
                  <FormField htmlFor="smsTone" label="SMS tone">
                    <Select defaultValue={record.smsTone} id="smsTone" name="smsTone">
                      <option value="warm">Warm</option>
                      <option value="professional">Professional</option>
                      <option value="direct">Direct</option>
                    </Select>
                  </FormField>
                  <FormField
                    helperText="Used only inside the message body. Sender numbers are configured by Open Spot."
                    htmlFor="smsSenderLabel"
                    label="Business label in SMS"
                  >
                    <Input
                      defaultValue={record.smsSenderLabel ?? ""}
                      id="smsSenderLabel"
                      maxLength={40}
                      name="smsSenderLabel"
                    />
                  </FormField>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField htmlFor="smsQuietHoursStart" label="Do not text after">
                      <Input
                        defaultValue={record.smsQuietHoursStart}
                        id="smsQuietHoursStart"
                        name="smsQuietHoursStart"
                        type="time"
                      />
                    </FormField>
                    <FormField htmlFor="smsQuietHoursEnd" label="Do not text before">
                      <Input
                        defaultValue={record.smsQuietHoursEnd}
                        id="smsQuietHoursEnd"
                        name="smsQuietHoursEnd"
                        type="time"
                      />
                    </FormField>
                  </div>
                </div>
                <FormField htmlFor="clientNotes" label="Notes for Open Spot">
                  <Textarea
                    defaultValue={record.clientNotes ?? ""}
                    id="clientNotes"
                    name="clientNotes"
                    placeholder="Anything the setup team should know before SMS activation."
                  />
                </FormField>
            </section>

            <section className={step === 5 ? "grid gap-5" : "hidden"}>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--primary)]">
                    Step 6
                  </p>
                  <h2 className="mt-2 text-2xl font-black">SMS consent and compliance</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    Open Spot sends alerts only to clients with explicit SMS
                    consent. Replies are collected for your review; they do not
                    automatically book or confirm a client.
                  </p>
                </div>
                <label className="flex gap-3 rounded-2xl border border-[var(--line)] bg-slate-50 p-4 text-sm leading-6">
                  <input
                    className="mt-1 h-4 w-4"
                    defaultChecked={record.consentStatementAccepted}
                    name="consentStatementAccepted"
                    type="checkbox"
                  />
                  <span>
                    I confirm that our business is responsible for collecting and
                    maintaining client SMS consent, honoring opt-outs, and manually
                    confirming any appointment after reviewing replies.
                  </span>
                </label>
                <FormField
                  htmlFor="consentResponsibleName"
                  label="Compliance responsible name"
                  required
                >
                  <Input
                    defaultValue={record.consentResponsibleName ?? ""}
                    id="consentResponsibleName"
                    name="consentResponsibleName"
                  />
                </FormField>
            </section>

            <section className={step === 6 ? "grid gap-5" : "hidden"}>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--primary)]">
                    Step 7
                  </p>
                  <h2 className="mt-2 text-2xl font-black">Final review</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    Save a draft if anything is missing. Submit only when the
                    details are accurate enough for SMS setup review.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--line)] bg-slate-50 p-4">
                    <p className="text-xs font-bold text-[var(--muted)]">Business</p>
                    <p className="mt-1 font-black">{record.businessName}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-slate-50 p-4">
                    <p className="text-xs font-bold text-[var(--muted)]">Manual rule</p>
                    <p className="mt-1 font-black">Replies never auto-confirm.</p>
                  </div>
                </div>
            </section>

            <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <Button
                  disabled={step === 0}
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                  type="button"
                  variant="outline"
                >
                  Back
                </Button>
                <Button
                  disabled={isFinalStep}
                  onClick={() =>
                    setStep((current) => Math.min(steps.length - 1, current + 1))
                  }
                  type="button"
                  variant="secondary"
                >
                  Next
                </Button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button name="intent" type="submit" value="save" variant="outline">
                  Save draft
                </Button>
                <Button name="intent" type="submit" value="submit">
                  Submit for review
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
