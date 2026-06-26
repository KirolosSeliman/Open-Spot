"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import type {
  BookCallRequestField,
  BookCallRequestLocale
} from "@/lib/book-call/validation";
import { cn } from "@/lib/utils/cn";

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
    selectPrompts: {
      businessType: "Sélectionner un type de commerce",
      currentBookingSystem: "Sélectionner votre système actuel",
      cancellationVolume: "Sélectionner une option"
    },
    helpers: {
      cancellationVolume: "Choisissez la fourchette qui correspond le mieux à votre réalité."
    },
    errors: {
      fullName: "Veuillez entrer votre nom complet.",
      businessName: "Veuillez entrer le nom de votre commerce.",
      email: "Veuillez entrer une adresse email valide.",
      phone: "Veuillez entrer un numéro de téléphone valide.",
      consentSmsEmail: "Veuillez accepter d’être contacté pour réserver un appel."
    },
    consent:
      "J’accepte d’être contacté par Open Spot par SMS et email au sujet de ma demande d’appel et du produit. Je comprends que je peux me désinscrire à tout moment.",
    consentNote:
      "Nous utiliserons vos informations seulement pour faire le suivi de votre demande Open Spot.",
    submit: "Réserver un appel",
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
    selectPrompts: {
      businessType: "Select a business type",
      currentBookingSystem: "Select your current system",
      cancellationVolume: "Select an option"
    },
    helpers: {
      cancellationVolume: "Choose the range that best matches your situation."
    },
    errors: {
      fullName: "Please enter your full name.",
      businessName: "Please enter your business name.",
      email: "Please enter a valid email address.",
      phone: "Please enter a valid phone number.",
      consentSmsEmail: "Please agree to be contacted to book a call."
    },
    consent:
      "I agree to be contacted by Open Spot by SMS and email about my call request and the product. I understand I can unsubscribe at any time.",
    consentNote:
      "We'll only use your details to follow up about Open Spot and your call request.",
    submit: "Book a call",
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

const bookingSystemOptions = {
  fr: [
    "Fresha",
    "Google Calendar",
    "Square",
    "Acuity Scheduling",
    "Vagaro",
    "Booker",
    "Mindbody",
    "Agenda papier",
    "Autre"
  ],
  en: [
    "Fresha",
    "Google Calendar",
    "Square",
    "Acuity Scheduling",
    "Vagaro",
    "Booker",
    "Mindbody",
    "Paper calendar",
    "Other"
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

const fieldClasses =
  "h-[54px] w-full rounded-[11px] border border-[#DDE5F0] bg-white px-[18px] text-[15px] font-medium text-[#07142F] outline-none transition placeholder:text-[#94A3B8] focus:border-[#2563FF] focus:ring-4 focus:ring-[#2563FF]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

const selectClasses = cn(
  fieldClasses,
  "appearance-none bg-[length:16px] bg-[position:right_16px_center] bg-no-repeat pr-11",
  "bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22%3E%3Cpath d=%22M6 9l6 6 6-6%22 stroke=%22%2394A3B8%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/svg%3E')]",
  "[&:has(option[value='']:checked)]:text-[#94A3B8]"
);

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isValidEmail(email: string) {
  if (email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isValidPhone(phone: string) {
  if (phone.length < 7 || phone.length > 25) return false;
  if (!/^[+\d\s().-]+$/.test(phone)) return false;
  const digitCount = phone.replace(/\D/g, "").length;
  return digitCount >= 7 && digitCount <= 15;
}

function validateClientForm(
  payload: {
    fullName: string;
    businessName: string;
    email: string;
    phone: string;
    consentSmsEmail: boolean;
  },
  locale: BookCallRequestLocale
): FormErrors {
  const errors: FormErrors = {};
  const messages = formCopy[locale].errors;

  if (payload.fullName.length < 2) {
    errors.fullName = messages.fullName;
  }

  if (payload.businessName.length < 2) {
    errors.businessName = messages.businessName;
  }

  if (!isValidEmail(payload.email)) {
    errors.email = messages.email;
  }

  if (!isValidPhone(payload.phone)) {
    errors.phone = messages.phone;
  }

  if (!payload.consentSmsEmail) {
    errors.consentSmsEmail = messages.consentSmsEmail;
  }

  return errors;
}

function mapServerErrors(
  fields: FormErrors,
  locale: BookCallRequestLocale
): FormErrors {
  const messages = formCopy[locale].errors;
  const mapped: FormErrors = {};

  for (const [key, value] of Object.entries(fields)) {
    if (!value) continue;

    if (key === "fullName" && locale === "fr") {
      mapped.fullName = messages.fullName;
    } else if (key === "businessName" && locale === "fr") {
      mapped.businessName = messages.businessName;
    } else if (key === "email" && locale === "fr") {
      mapped.email = messages.email;
    } else if (key === "phone" && locale === "fr") {
      mapped.phone = messages.phone;
    } else if (key === "consentSmsEmail" && locale === "fr") {
      mapped.consentSmsEmail = messages.consentSmsEmail;
    } else {
      mapped[key as BookCallRequestField] = value;
    }
  }

  return mapped;
}

type BookCallFieldProps = {
  children: ReactNode;
  className?: string;
  error?: string;
  helperText?: string;
  htmlFor?: string;
  label: string;
  required?: boolean;
  span?: "full" | "half";
};

function BookCallField({
  children,
  className,
  error,
  helperText,
  htmlFor,
  label,
  required = false,
  span = "half"
}: BookCallFieldProps) {
  return (
    <div
      className={cn(
        "grid gap-2",
        span === "full" && "sm:col-span-2",
        className
      )}
    >
      <label
        className="text-[15px] font-bold leading-none text-[#07142F]"
        htmlFor={htmlFor}
      >
        {label}
        {required ? <span className="text-[#DC2626]"> *</span> : null}
      </label>
      {helperText ? (
        <p className="text-[13px] font-medium leading-snug text-[#64748B]">{helperText}</p>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs font-semibold leading-5 text-[#DC2626]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
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

    const clientErrors = validateClientForm(payload, locale);

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setIsSubmitting(true);

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
        setErrors(mapServerErrors(result?.fields ?? {}, locale));
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
        className="rounded-[22px] border border-[#E2E8F0] bg-white p-8 shadow-[0_4px_24px_rgba(15,23,42,0.06)] sm:p-10"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ECFDF5] text-lg font-extrabold text-[#15803D]">
          ✓
        </div>
        <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-[#07142F]">
          {t.success}
        </h2>
        <p className="mt-3 text-sm font-medium leading-6 text-[#50617D]">
          {t.consentNote}
        </p>
      </div>
    );
  }

  return (
    <form
      className="rounded-[22px] border border-[#E2E8F0] bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] sm:p-9 lg:p-10"
      noValidate
      onSubmit={onSubmit}
    >
      <div className="grid gap-[26px] sm:grid-cols-2 sm:gap-x-7">
        <BookCallField
          error={errors.fullName}
          htmlFor="fullName"
          label={t.labels.fullName}
          required
        >
          <input
            autoComplete="name"
            className={fieldClasses}
            id="fullName"
            maxLength={120}
            name="fullName"
            type="text"
          />
        </BookCallField>

        <BookCallField
          error={errors.businessName}
          htmlFor="businessName"
          label={t.labels.businessName}
          required
        >
          <input
            autoComplete="organization"
            className={fieldClasses}
            id="businessName"
            maxLength={160}
            name="businessName"
            type="text"
          />
        </BookCallField>

        <BookCallField error={errors.email} htmlFor="email" label={t.labels.email} required>
          <input
            autoComplete="email"
            className={fieldClasses}
            id="email"
            maxLength={254}
            name="email"
            type="email"
          />
        </BookCallField>

        <BookCallField error={errors.phone} htmlFor="phone" label={t.labels.phone} required>
          <input
            autoComplete="tel"
            className={fieldClasses}
            id="phone"
            maxLength={25}
            name="phone"
            type="tel"
          />
        </BookCallField>

        <BookCallField
          error={errors.businessType}
          htmlFor="businessType"
          label={t.labels.businessType}
        >
          <select className={selectClasses} id="businessType" name="businessType" defaultValue="">
            <option disabled value="">
              {t.selectPrompts.businessType}
            </option>
            {businessTypeOptions[locale].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </BookCallField>

        <BookCallField
          error={errors.currentBookingSystem}
          htmlFor="currentBookingSystem"
          label={t.labels.currentBookingSystem}
        >
          <select
            className={selectClasses}
            id="currentBookingSystem"
            name="currentBookingSystem"
            defaultValue=""
          >
            <option disabled value="">
              {t.selectPrompts.currentBookingSystem}
            </option>
            {bookingSystemOptions[locale].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </BookCallField>

        <BookCallField
          error={errors.cancellationVolume}
          helperText={t.helpers.cancellationVolume}
          htmlFor="cancellationVolume"
          label={t.labels.cancellationVolume}
          span="full"
        >
          <select
            className={selectClasses}
            id="cancellationVolume"
            name="cancellationVolume"
            defaultValue=""
          >
            <option disabled value="">
              {t.selectPrompts.cancellationVolume}
            </option>
            {cancellationOptions[locale].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </BookCallField>

        <BookCallField
          error={errors.preferredTimeMessage}
          htmlFor="preferredTimeMessage"
          label={t.labels.preferredTimeMessage}
          span="full"
        >
          <textarea
            className={cn(
              fieldClasses,
              "min-h-[132px] resize-y py-4 leading-relaxed"
            )}
            id="preferredTimeMessage"
            maxLength={1000}
            name="preferredTimeMessage"
          />
        </BookCallField>
      </div>

      <input
        aria-hidden="true"
        autoComplete="off"
        className="hidden"
        name="website"
        tabIndex={-1}
        type="text"
      />

      <div className="mt-7 rounded-[12px] border border-[#DBEAFE] bg-[#EFF6FF] px-5 py-[18px]">
        <label className="flex items-start gap-3">
          <input
            className="mt-1 h-5 w-5 shrink-0 rounded border-[#DDE5F0] accent-[#2563FF]"
            name="consentSmsEmail"
            type="checkbox"
            value="true"
          />
          <span className="text-[14px] font-medium leading-[1.55] text-[#07142F]">
            {t.consent}
          </span>
        </label>
        {errors.consentSmsEmail ? (
          <p className="mt-2 pl-8 text-xs font-semibold text-[#DC2626]" role="alert">
            {errors.consentSmsEmail}
          </p>
        ) : null}
        <p className="mt-3 pl-8 text-xs font-medium leading-5 text-[#64748B]">
          {t.consentNote}
        </p>
      </div>

      {formError ? (
        <p
          aria-live="polite"
          className="mt-5 rounded-[12px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      <div className="mt-7 border-t border-[#E2E8F0] pt-7">
        <div className="flex justify-stretch sm:justify-end">
          <button
            className="inline-flex h-[58px] w-full min-w-0 items-center justify-center rounded-[11px] bg-[#2563FF] px-8 text-[16px] font-bold text-white shadow-[0_8px_24px_rgba(37,99,255,0.28)] transition hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-[0_12px_28px_rgba(37,99,255,0.34)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563FF] disabled:cursor-not-allowed disabled:opacity-60 sm:w-[260px]"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? t.submitting : t.submit}
          </button>
        </div>
      </div>
    </form>
  );
}
