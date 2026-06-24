import { normalizePhoneToE164 } from "@/lib/customers/phone";
import type { Locale } from "@/lib/i18n/types";
import type { Json } from "@/types/database";

export const onboardingStatuses = [
  "not_started",
  "in_progress",
  "submitted",
  "changes_requested",
  "ready_for_sms_setup",
  "completed"
] as const;

export type ClientOnboardingStatus = (typeof onboardingStatuses)[number];
export type SmsTone = "warm" | "professional" | "direct";

export type OnboardingServiceInput = {
  name: string;
  durationMinutes: number | null;
  valueCents: number | null;
};

export type ClientOnboardingInput = {
  businessName: string;
  businessType: string;
  bookingSystem: string | null;
  businessAddress: string | null;
  publicContactEmail: string | null;
  publicContactPhone: string | null;
  responsibleName: string;
  responsibleRole: string;
  responsibleEmail: string;
  responsiblePhone: string | null;
  services: OnboardingServiceInput[];
  averageAppointmentValueCents: number | null;
  currency: string;
  smsLanguage: Locale;
  smsTone: SmsTone;
  smsSenderLabel: string | null;
  smsQuietHoursStart: string;
  smsQuietHoursEnd: string;
  clientNotes: string | null;
  consentStatementAccepted: boolean;
  consentResponsibleName: string | null;
};

export type ClientOnboardingValidationResult =
  | {
      ok: true;
      value: ClientOnboardingInput;
    }
  | {
      ok: false;
      errors: string[];
      value: ClientOnboardingInput;
    };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const smsTones = new Set<SmsTone>(["warm", "professional", "direct"]);

function cleanText(value: FormDataEntryValue | string | null | undefined) {
  const text = typeof value === "string" ? value.trim() : "";

  return text.length > 0 ? text : null;
}

function requiredText(value: FormDataEntryValue | string | null | undefined) {
  return cleanText(value) ?? "";
}

function parseMoneyToCents(value: FormDataEntryValue | string | null | undefined) {
  const raw = requiredText(value).replace(",", ".");

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return Number.NaN;
  }

  return Math.round(parsed * 100);
}

function parseInteger(value: FormDataEntryValue | string | null | undefined) {
  const raw = requiredText(value);

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);

  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function parseLocale(value: FormDataEntryValue | string | null | undefined): Locale {
  return value === "en" ? "en" : "fr";
}

function parseSmsTone(value: FormDataEntryValue | string | null | undefined): SmsTone {
  return smsTones.has(value as SmsTone) ? (value as SmsTone) : "warm";
}

function validateEmail(errors: string[], label: string, value: string | null) {
  if (value && !emailPattern.test(value)) {
    errors.push(`${label} must be a valid email address.`);
  }
}

function validatePhone(errors: string[], label: string, value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = normalizePhoneToE164(value);

  if (!normalized.ok) {
    errors.push(`${label}: ${normalized.error}`);
    return null;
  }

  return normalized.phoneE164;
}

export function isClientOnboardingStatus(
  value: string | null | undefined
): value is ClientOnboardingStatus {
  return onboardingStatuses.includes(value as ClientOnboardingStatus);
}

export function getOnboardingStatusLabel(
  status: ClientOnboardingStatus,
  locale: Locale = "fr"
) {
  const labels: Record<Locale, Record<ClientOnboardingStatus, string>> = {
    fr: {
      not_started: "Non commencé",
      in_progress: "En cours",
      submitted: "Soumis",
      changes_requested: "Changements demandés",
      ready_for_sms_setup: "Prêt pour configuration SMS",
      completed: "Complété"
    },
    en: {
      not_started: "Not started",
      in_progress: "In progress",
      submitted: "Submitted",
      changes_requested: "Changes requested",
      ready_for_sms_setup: "Ready for SMS setup",
      completed: "Completed"
    }
  };

  return labels[locale][status];
}

export function parseOnboardingFormData(
  formData: FormData,
  { requireConsent = false }: { requireConsent?: boolean } = {}
): ClientOnboardingValidationResult {
  const errors: string[] = [];
  const services = [0, 1, 2, 3, 4]
    .map((index) => {
      const name = requiredText(formData.get(`service_${index}_name`));
      const durationMinutes = parseInteger(formData.get(`service_${index}_duration`));
      const valueCents = parseMoneyToCents(formData.get(`service_${index}_value`));

      return {
        name,
        durationMinutes,
        valueCents
      };
    })
    .filter(
      (service) =>
        service.name ||
        service.durationMinutes !== null ||
        service.valueCents !== null
    );
  const publicContactPhone = cleanText(formData.get("publicContactPhone"));
  const responsiblePhone = cleanText(formData.get("responsiblePhone"));
  const normalizedPublicPhone = validatePhone(
    errors,
    "Business phone",
    publicContactPhone
  );
  const normalizedResponsiblePhone = validatePhone(
    errors,
    "Responsible phone",
    responsiblePhone
  );
  const averageAppointmentValueCents = parseMoneyToCents(
    formData.get("averageAppointmentValue")
  );
  const smsQuietHoursStart = requiredText(formData.get("smsQuietHoursStart")) || "20:00";
  const smsQuietHoursEnd = requiredText(formData.get("smsQuietHoursEnd")) || "08:00";
  const publicContactEmail = cleanText(formData.get("publicContactEmail"));
  const responsibleEmail = requiredText(formData.get("responsibleEmail")).toLowerCase();
  const consentStatementAccepted =
    formData.get("consentStatementAccepted") === "on" ||
    formData.get("consentStatementAccepted") === "true";
  const value: ClientOnboardingInput = {
    businessName: requiredText(formData.get("businessName")),
    businessType: requiredText(formData.get("businessType")),
    bookingSystem: cleanText(formData.get("bookingSystem")),
    businessAddress: cleanText(formData.get("businessAddress")),
    publicContactEmail: publicContactEmail?.toLowerCase() ?? null,
    publicContactPhone: normalizedPublicPhone,
    responsibleName: requiredText(formData.get("responsibleName")),
    responsibleRole: requiredText(formData.get("responsibleRole")),
    responsibleEmail,
    responsiblePhone: normalizedResponsiblePhone,
    services,
    averageAppointmentValueCents: Number.isNaN(averageAppointmentValueCents)
      ? null
      : averageAppointmentValueCents,
    currency: (requiredText(formData.get("currency")) || "CAD").toUpperCase(),
    smsLanguage: parseLocale(formData.get("smsLanguage")),
    smsTone: parseSmsTone(formData.get("smsTone")),
    smsSenderLabel: cleanText(formData.get("smsSenderLabel")),
    smsQuietHoursStart,
    smsQuietHoursEnd,
    clientNotes: cleanText(formData.get("clientNotes")),
    consentStatementAccepted,
    consentResponsibleName: cleanText(formData.get("consentResponsibleName"))
  };

  if (value.businessName.length < 2) {
    errors.push("Business name is required.");
  }

  if (value.businessType.length < 2) {
    errors.push("Business type is required.");
  }

  validateEmail(errors, "Business email", value.publicContactEmail);

  if (value.responsibleName.length < 2) {
    errors.push("Responsible person name is required.");
  }

  if (value.responsibleRole.length < 2) {
    errors.push("Responsible person role is required.");
  }

  if (!value.responsibleEmail || !emailPattern.test(value.responsibleEmail)) {
    errors.push("Responsible person email must be valid.");
  }

  if (services.length === 0) {
    errors.push("At least one service is required.");
  }

  for (const service of services) {
    if (!service.name) {
      errors.push("Every service row must include a name.");
    }

    if (
      service.durationMinutes === null ||
      Number.isNaN(service.durationMinutes) ||
      service.durationMinutes < 5 ||
      service.durationMinutes > 720
    ) {
      errors.push(`Service "${service.name || "Unnamed"}" needs a valid duration.`);
    }

    if (service.valueCents === null || Number.isNaN(service.valueCents)) {
      errors.push(`Service "${service.name || "Unnamed"}" needs a valid value.`);
    }
  }

  if (
    averageAppointmentValueCents === null ||
    Number.isNaN(averageAppointmentValueCents) ||
    averageAppointmentValueCents <= 0
  ) {
    errors.push("Average appointment value must be greater than zero.");
  }

  if (value.currency.length !== 3) {
    errors.push("Currency must be a 3-letter code.");
  }

  if (value.smsSenderLabel && value.smsSenderLabel.length > 40) {
    errors.push("SMS sender label must be 40 characters or less.");
  }

  if (!timePattern.test(smsQuietHoursStart) || !timePattern.test(smsQuietHoursEnd)) {
    errors.push("SMS quiet hours must use HH:MM format.");
  }

  if (requireConsent && !consentStatementAccepted) {
    errors.push("SMS compliance consent must be accepted before submission.");
  }

  if (
    requireConsent &&
    (!value.consentResponsibleName || value.consentResponsibleName.length < 2)
  ) {
    errors.push("Consent responsible name is required before submission.");
  }

  return errors.length > 0 ? { ok: false, errors, value } : { ok: true, value };
}

export function onboardingServicesToJson(
  services: OnboardingServiceInput[]
): Json {
  return services.map((service) => ({
    name: service.name,
    durationMinutes: service.durationMinutes,
    valueCents: service.valueCents
  }));
}

export function onboardingServicesFromJson(value: Json): OnboardingServiceInput[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const row = item as Record<string, Json | undefined>;
      const name = typeof row.name === "string" ? row.name : "";
      const durationMinutes =
        typeof row.durationMinutes === "number" ? row.durationMinutes : null;
      const valueCents = typeof row.valueCents === "number" ? row.valueCents : null;

      return {
        name,
        durationMinutes,
        valueCents
      };
    })
    .filter((item): item is OnboardingServiceInput => Boolean(item));
}
