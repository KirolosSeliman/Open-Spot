export const bookCallRequestStatuses = [
  "new",
  "contacted",
  "qualified",
  "closed",
  "spam",
  "converted"
] as const;

export type BookCallRequestStatus = (typeof bookCallRequestStatuses)[number];
export type BookCallRequestLocale = "fr" | "en";

export type BookCallRequestInput = {
  locale: BookCallRequestLocale;
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  businessType?: string;
  currentBookingSystem?: string;
  cancellationVolume?: string;
  preferredTimeMessage?: string;
  consentSmsEmail: boolean;
  website?: string;
};

export type BookCallRequestValidatedInput = {
  locale: BookCallRequestLocale;
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  businessType: string | null;
  currentBookingSystem: string | null;
  cancellationVolume: string | null;
  preferredTimeMessage: string | null;
  consentSmsEmail: true;
};

export type BookCallRequestField =
  | keyof BookCallRequestInput
  | "_form";

export type BookCallRequestFieldErrors = Partial<
  Record<BookCallRequestField, string>
>;

export type BookCallRequestValidationResult =
  | {
      ok: true;
      value: BookCallRequestValidatedInput;
      isSpam: false;
    }
  | {
      ok: true;
      value: null;
      isSpam: true;
    }
  | {
      ok: false;
      fields: BookCallRequestFieldErrors;
    };

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function booleanValue(value: unknown) {
  return value === true || value === "true";
}

function optionalText(value: unknown, maxLength: number) {
  const text = stringValue(value);

  return {
    text,
    isValid: text.length <= maxLength,
    value: text || null
  };
}

export function isBookCallRequestStatus(
  value: unknown
): value is BookCallRequestStatus {
  return bookCallRequestStatuses.includes(value as BookCallRequestStatus);
}

export function validateBookCallRequestStatus(value: unknown) {
  const status = stringValue(value);

  return isBookCallRequestStatus(status) ? status : null;
}

export function validateBookCallInternalNotes(value: unknown) {
  const notes = stringValue(value);

  if (notes.length > 2000) {
    return null;
  }

  return notes || null;
}

export function normalizeBookCallPhone(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isValidEmail(email: string) {
  if (email.length > 254) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isValidPhone(phone: string) {
  if (phone.length < 7 || phone.length > 25) {
    return false;
  }

  if (!/^[+\d\s().-]+$/.test(phone)) {
    return false;
  }

  const digitCount = phone.replace(/\D/g, "").length;

  return digitCount >= 7 && digitCount <= 15;
}

export function validateBookCallRequestInput(
  raw: Partial<Record<keyof BookCallRequestInput, unknown>>
): BookCallRequestValidationResult {
  const website = stringValue(raw.website);

  if (website) {
    return {
      ok: true,
      value: null,
      isSpam: true
    };
  }

  const locale = raw.locale === "en" ? "en" : "fr";
  const fullName = stringValue(raw.fullName);
  const businessName = stringValue(raw.businessName);
  const email = stringValue(raw.email).toLowerCase();
  const phone = normalizeBookCallPhone(stringValue(raw.phone));
  const businessType = optionalText(raw.businessType, 120);
  const currentBookingSystem = optionalText(raw.currentBookingSystem, 160);
  const cancellationVolume = optionalText(raw.cancellationVolume, 120);
  const preferredTimeMessage = optionalText(raw.preferredTimeMessage, 1000);
  const fields: BookCallRequestFieldErrors = {};

  if (fullName.length < 2 || fullName.length > 120) {
    fields.fullName = "Full name must be between 2 and 120 characters.";
  }

  if (businessName.length < 2 || businessName.length > 160) {
    fields.businessName = "Business name must be between 2 and 160 characters.";
  }

  if (!isValidEmail(email)) {
    fields.email = "Enter a valid email address.";
  }

  if (!isValidPhone(phone)) {
    fields.phone = "Enter a valid phone number.";
  }

  if (!businessType.isValid) {
    fields.businessType = "Business type must be 120 characters or fewer.";
  }

  if (!currentBookingSystem.isValid) {
    fields.currentBookingSystem =
      "Current booking system must be 160 characters or fewer.";
  }

  if (!cancellationVolume.isValid) {
    fields.cancellationVolume =
      "Cancellation volume must be 120 characters or fewer.";
  }

  if (!preferredTimeMessage.isValid) {
    fields.preferredTimeMessage =
      "Message must be 1000 characters or fewer.";
  }

  if (!booleanValue(raw.consentSmsEmail)) {
    fields.consentSmsEmail =
      "Please agree to be contacted about your Open Spot call request.";
  }

  if (Object.keys(fields).length > 0) {
    return {
      ok: false,
      fields
    };
  }

  return {
    ok: true,
    isSpam: false,
    value: {
      locale,
      fullName,
      businessName,
      email,
      phone,
      businessType: businessType.value,
      currentBookingSystem: currentBookingSystem.value,
      cancellationVolume: cancellationVolume.value,
      preferredTimeMessage: preferredTimeMessage.value,
      consentSmsEmail: true
    }
  };
}

export function buildBookCallRequestInsert({
  input,
  sourceUrl,
  userAgent
}: {
  input: BookCallRequestValidatedInput;
  sourceUrl?: string | null;
  userAgent?: string | null;
}) {
  return {
    locale: input.locale,
    full_name: input.fullName,
    business_name: input.businessName,
    email: input.email,
    phone: input.phone,
    business_type: input.businessType,
    current_booking_system: input.currentBookingSystem,
    cancellation_volume: input.cancellationVolume,
    preferred_time_message: input.preferredTimeMessage,
    consent_sms_email: true,
    status: "new" as const,
    source_path: "/book-call/questions",
    source_url: sourceUrl || null,
    user_agent: userAgent || null
  };
}
