"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/form-field";
import type {
  BookCallRequestField,
  BookCallRequestLocale
} from "@/lib/book-call/validation";

type FormErrors = Partial<Record<BookCallRequestField, string>>;

const formCopy = {
  fr: {
    labels: {
      fullName: "Nom complet",
      businessName: "Nom du commerce",
      email: "Email",
      phone: "Téléphone",
      businessType: "Type de commerce",
      currentBookingSystem: "Système de rendez-vous actuel",
      cancellationVolume: "Volume d’annulations",
      preferredTimeMessage: "Message / disponibilités préférées"
    },
    placeholders: {
      fullName: "Sarah Martin",
      businessName: "Studio Elise",
      email: "sarah@studioelise.com",
      phone: "(514) 555-0198",
      businessType: "Salon de coiffure",
      currentBookingSystem: "Fresha, Google Calendar, Square, agenda papier...",
      cancellationVolume: "Ex: 3 à 8 annulations par semaine",
      preferredTimeMessage:
        "Indiquez vos disponibilités habituelles ou ce que vous voulez clarifier pendant l’appel."
    },
    consent:
      "J’accepte d’être contacté par Open Spot par SMS et email au sujet de ma demande d’appel et du produit. Je comprends que je peux me désinscrire à tout moment.",
    consentNote:
      "Nous utiliserons vos informations seulement pour faire le suivi de votre demande Open Spot.",
    submit: "Demander mon appel",
    submitting: "Envoi en cours...",
    success: "Demande reçue. Nous allons vous recontacter bientôt.",
    generalError:
      "Une erreur est survenue. Vérifiez vos informations et réessayez."
  },
  en: {
    labels: {
      fullName: "Full name",
      businessName: "Business name",
      email: "Email",
      phone: "Phone",
      businessType: "Business type",
      currentBookingSystem: "Current booking system",
      cancellationVolume: "Cancellation volume",
      preferredTimeMessage: "Message / preferred time"
    },
    placeholders: {
      fullName: "Sarah Martin",
      businessName: "Studio Elise",
      email: "sarah@studioelise.com",
      phone: "(514) 555-0198",
      businessType: "Hair salon",
      currentBookingSystem: "Fresha, Google Calendar, Square, paper calendar...",
      cancellationVolume: "Example: 3 to 8 cancellations per week",
      preferredTimeMessage:
        "Tell us when you are usually available or what you want help with."
    },
    consent:
      "I agree to be contacted by Open Spot by SMS and email about my call request and the product. I understand I can unsubscribe at any time.",
    consentNote:
      "We'll only use your details to follow up about Open Spot and your call request.",
    submit: "Request my call",
    submitting: "Sending request...",
    success: "Request received. We'll follow up soon.",
    generalError: "Something went wrong. Please check your information and try again."
  }
} as const;

const businessTypeOptions = {
  fr: [
    "Salon de coiffure",
    "Barbier",
    "Clinique beaute",
    "Spa",
    "Onglerie",
    "Massotherapie",
    "Physiotherapie",
    "Autre commerce sur rendez-vous"
  ],
  en: [
    "Hair salon",
    "Barber",
    "Beauty clinic",
    "Spa",
    "Nail studio",
    "Massage studio",
    "Physiotherapy clinic",
    "Other appointment-based business"
  ]
} as const;

const cancellationOptions = {
  fr: [
    "1 à 2 par semaine",
    "3 à 5 par semaine",
    "6 à 10 par semaine",
    "Plus de 10 par semaine",
    "Variable / a clarifier"
  ],
  en: [
    "1 to 2 per week",
    "3 to 5 per week",
    "6 to 10 per week",
    "More than 10 per week",
    "Variable / not sure"
  ]
} as const;

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function BookCallRequestForm({
  locale
}: {
  locale: BookCallRequestLocale;
}) {
  const t = formCopy[locale];
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      locale,
      fullName: getString(formData, "fullName"),
      businessName: getString(formData, "businessName"),
      email: getString(formData, "email"),
      phone: getString(formData, "phone"),
      businessType: getString(formData, "businessType"),
      currentBookingSystem: getString(formData, "currentBookingSystem"),
      cancellationVolume: getString(formData, "cancellationVolume"),
      preferredTimeMessage: getString(formData, "preferredTimeMessage"),
      consentSmsEmail: formData.get("consentSmsEmail") === "true",
      website: getString(formData, "website")
    };

    try {
      const response = await fetch("/api/book-call-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.ok) {
        setErrors(result?.fields ?? {});
        setFormError(result?.fields?._form ?? t.generalError);
        return;
      }

      setSubmitted(true);
      setErrors({});
      setFormError("");
    } catch {
      setFormError(t.generalError);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        aria-live="polite"
        className="rounded-[1.75rem] border border-emerald-200 bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] sm:p-8"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl font-black text-emerald-700">
          OK
        </div>
        <h2 className="mt-5 text-2xl font-black tracking-tight text-[var(--foreground)]">
          {t.success}
        </h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-[var(--muted)]">
          {t.consentNote}
        </p>
      </div>
    );
  }

  return (
    <form
      className="rounded-[1.75rem] border border-[var(--line)] bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.08)] sm:p-7"
      noValidate
      onSubmit={onSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField error={errors.fullName} htmlFor="fullName" label={t.labels.fullName} required>
          <Input
            autoComplete="name"
            id="fullName"
            maxLength={120}
            name="fullName"
            placeholder={t.placeholders.fullName}
            required
          />
        </FormField>
        <FormField error={errors.businessName} htmlFor="businessName" label={t.labels.businessName} required>
          <Input
            autoComplete="organization"
            id="businessName"
            maxLength={160}
            name="businessName"
            placeholder={t.placeholders.businessName}
            required
          />
        </FormField>
        <FormField error={errors.email} htmlFor="email" label={t.labels.email} required>
          <Input
            autoComplete="email"
            id="email"
            maxLength={254}
            name="email"
            placeholder={t.placeholders.email}
            required
            type="email"
          />
        </FormField>
        <FormField error={errors.phone} htmlFor="phone" label={t.labels.phone} required>
          <Input
            autoComplete="tel"
            id="phone"
            maxLength={25}
            name="phone"
            placeholder={t.placeholders.phone}
            required
            type="tel"
          />
        </FormField>
        <FormField error={errors.businessType} htmlFor="businessType" label={t.labels.businessType}>
          <Select id="businessType" name="businessType" defaultValue="">
            <option value="">{t.placeholders.businessType}</option>
            {businessTypeOptions[locale].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          error={errors.currentBookingSystem}
          htmlFor="currentBookingSystem"
          label={t.labels.currentBookingSystem}
        >
          <Input
            id="currentBookingSystem"
            maxLength={160}
            name="currentBookingSystem"
            placeholder={t.placeholders.currentBookingSystem}
          />
        </FormField>
        <FormField
          error={errors.cancellationVolume}
          htmlFor="cancellationVolume"
          label={t.labels.cancellationVolume}
        >
          <Select id="cancellationVolume" name="cancellationVolume" defaultValue="">
            <option value="">{t.placeholders.cancellationVolume}</option>
            {cancellationOptions[locale].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="mt-4">
        <FormField
          error={errors.preferredTimeMessage}
          htmlFor="preferredTimeMessage"
          label={t.labels.preferredTimeMessage}
        >
          <Textarea
            id="preferredTimeMessage"
            maxLength={1000}
            name="preferredTimeMessage"
            placeholder={t.placeholders.preferredTimeMessage}
          />
        </FormField>
      </div>

      <input
        aria-hidden="true"
        autoComplete="off"
        className="hidden"
        name="website"
        tabIndex={-1}
        type="text"
      />

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
        <label className="flex items-start gap-3 text-sm font-semibold leading-6 text-[var(--foreground)]">
          <input
            className="mt-1 h-5 w-5 rounded border-[var(--line)] accent-[var(--primary)]"
            name="consentSmsEmail"
            required
            type="checkbox"
            value="true"
          />
          <span>{t.consent}</span>
        </label>
        {errors.consentSmsEmail ? (
          <p className="mt-2 text-xs font-bold text-[var(--danger)]">
            {errors.consentSmsEmail}
          </p>
        ) : null}
        <p className="mt-3 text-xs font-bold leading-5 text-[var(--muted)]">
          {t.consentNote}
        </p>
      </div>

      {formError ? (
        <p
          aria-live="polite"
          className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
        >
          {formError}
        </p>
      ) : null}

      <Button
        className="mt-6 min-h-14 w-full rounded-2xl text-base"
        isLoading={isSubmitting}
        loadingText={t.submitting}
        type="submit"
      >
        {t.submit}
      </Button>
    </form>
  );
}
