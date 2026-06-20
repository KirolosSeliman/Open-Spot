"use client";

import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/form-field";
import {
  consentText,
  potentialClientBusinessTypes,
  potentialClientContactMethods
} from "@/lib/potential-clients/validation";

type FormErrors = Partial<Record<string, string>>;

const contactMethodLabels = {
  sms: "SMS",
  email: "Email",
  either: "Either"
} as const;

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function RequestCallForm() {
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [consented, setConsented] = useState(false);
  const sourcePath = useMemo(
    () => (typeof window === "undefined" ? "/book-call" : window.location.pathname),
    []
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setErrors({});
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: getString(formData, "fullName"),
      businessName: getString(formData, "businessName"),
      email: getString(formData, "email"),
      phone: getString(formData, "phone"),
      businessType: getString(formData, "businessType"),
      preferredContactMethod: getString(formData, "preferredContactMethod"),
      message: getString(formData, "message"),
      consentToContact: formData.get("consentToContact") === "true",
      sourcePath,
      honeypot: getString(formData, "company")
    };

    try {
      const response = await fetch("/api/potential-clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        setErrors(result.errors ?? {});
        setFormError(
          result.error ??
            "Something went wrong. Please try again, or contact us directly."
        );
        return;
      }

      setSubmitted(true);
    } catch {
      setFormError("Something went wrong. Please try again, or contact us directly.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-[2rem] border border-[var(--line)] bg-white p-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)] sm:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-2xl text-[var(--primary)]">
          ✓
        </div>
        <h2 className="mt-6 text-3xl font-black tracking-tight text-[var(--foreground)]">
          Request received.
        </h2>
        <p className="mt-4 text-base font-semibold leading-7 text-[var(--muted)]">
          Thanks for your interest in Open Spot. We&apos;ll contact you shortly by SMS
          or email to schedule your call.
        </p>
        <p className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold leading-6 text-blue-800">
          You&apos;ll also receive a confirmation email with a summary of your request.
        </p>
      </div>
    );
  }

  return (
    <form
      className="rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_34px_92px_rgba(15,23,42,0.1)] sm:p-10"
      onSubmit={onSubmit}
    >
      <div>
        <p className="text-sm font-black text-[var(--primary)]">
          Request a 15-minute call
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-[var(--foreground)]">
          Tell us how to reach you.
        </h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-[var(--muted)]">
          We&apos;ll text or email you shortly to find the best time.
        </p>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <FormField error={errors.fullName} htmlFor="fullName" label="Full name" required>
          <Input
            autoComplete="name"
            id="fullName"
            maxLength={100}
            name="fullName"
            placeholder="Sarah Martin"
            required
          />
        </FormField>
        <FormField
          error={errors.businessName}
          htmlFor="businessName"
          label="Business name"
          required
        >
          <Input
            autoComplete="organization"
            id="businessName"
            maxLength={120}
            name="businessName"
            placeholder="Studio Elise"
            required
          />
        </FormField>
        <FormField error={errors.email} htmlFor="email" label="Email" required>
          <Input
            autoComplete="email"
            id="email"
            maxLength={160}
            name="email"
            placeholder="sarah@studioelise.com"
            required
            type="email"
          />
        </FormField>
        <FormField error={errors.phone} htmlFor="phone" label="Phone number" required>
          <Input
            autoComplete="tel"
            id="phone"
            name="phone"
            placeholder="(514) 555-0198"
            required
            type="tel"
          />
        </FormField>
        <FormField
          error={errors.businessType}
          htmlFor="businessType"
          label="Business type"
          required
        >
          <Select id="businessType" name="businessType" required defaultValue="">
            <option disabled value="">
              Select your business type
            </option>
            {potentialClientBusinessTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          error={errors.preferredContactMethod}
          htmlFor="preferredContactMethod"
          label="Preferred contact"
          required
        >
          <Select
            id="preferredContactMethod"
            name="preferredContactMethod"
            required
            defaultValue="either"
          >
            {potentialClientContactMethods.map((method) => (
              <option key={method} value={method}>
                {contactMethodLabels[method]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="mt-4">
        <FormField
          error={errors.message}
          htmlFor="message"
          label="Message / preferred time"
        >
          <Textarea
            id="message"
            maxLength={500}
            name="message"
            placeholder="Tell us when you are usually available or what you want help with."
          />
        </FormField>
      </div>

      <input
        aria-hidden="true"
        autoComplete="off"
        className="hidden"
        name="company"
        tabIndex={-1}
        type="text"
      />

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
        <label className="flex items-start gap-3 text-sm font-semibold leading-6 text-[var(--foreground)]">
          <input
            checked={consented}
            className="mt-1 h-5 w-5 rounded border-[var(--line)] accent-[var(--primary)]"
            name="consentToContact"
            onChange={(event) => setConsented(event.target.checked)}
            required
            type="checkbox"
            value="true"
          />
          <span>{consentText}</span>
        </label>
        {errors.consentToContact ? (
          <p className="mt-2 text-xs font-bold text-[var(--danger)]">
            {errors.consentToContact}
          </p>
        ) : null}
        <p className="mt-3 text-xs font-bold leading-5 text-[var(--muted)]">
          We&apos;ll only use your details to follow up about Open Spot and your call
          request.
        </p>
      </div>

      {formError ? (
        <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {formError}
        </p>
      ) : null}

      <Button
        className="mt-6 min-h-14 w-full rounded-2xl text-base"
        disabled={!consented}
        isLoading={isSubmitting}
        loadingText="Sending request..."
        type="submit"
      >
        Request my call
      </Button>
    </form>
  );
}
