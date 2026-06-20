export const consentText =
  "I agree to be contacted by Open Spot by SMS and email about booking a call and learning more about the product. I understand I can unsubscribe at any time.";

export const potentialClientBusinessTypes = [
  "Hair salon",
  "Barber",
  "Beauty clinic",
  "Spa",
  "Nail studio",
  "Massage studio",
  "Med spa",
  "Physiotherapy clinic",
  "Other appointment-based business"
] as const;

export const potentialClientStatuses = [
  "new",
  "contacted",
  "call_booked",
  "qualified",
  "not_a_fit",
  "won",
  "lost",
  "archived"
] as const;

export const potentialClientContactMethods = ["sms", "email", "either"] as const;
export const potentialClientContactChannels = ["sms", "email", "phone", "other"] as const;

export type PotentialClientBusinessType =
  (typeof potentialClientBusinessTypes)[number];
export type PotentialClientStatus = (typeof potentialClientStatuses)[number];
export type PotentialClientContactMethod =
  (typeof potentialClientContactMethods)[number];
export type PotentialClientContactChannel =
  (typeof potentialClientContactChannels)[number];

type RawPotentialClientInput = {
  fullName?: unknown;
  businessName?: unknown;
  email?: unknown;
  phone?: unknown;
  businessType?: unknown;
  preferredContactMethod?: unknown;
  message?: unknown;
  consentToContact?: unknown;
  sourcePath?: unknown;
  honeypot?: unknown;
};

export type PotentialClientValidatedInput = {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  phoneNormalized: string | null;
  businessType: PotentialClientBusinessType;
  preferredContactMethod: PotentialClientContactMethod;
  message: string | null;
  consentToContact: true;
  consentText: string;
  sourcePath: string | null;
  isSpam: boolean;
};

export type PotentialClientValidationResult =
  | {
      ok: true;
      value: PotentialClientValidatedInput;
    }
  | {
      ok: false;
      errors: Partial<Record<keyof RawPotentialClientInput, string>>;
    };

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 160;
}

export function normalizeNorthAmericanPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return null;
}

function isContactMethod(value: string): value is PotentialClientContactMethod {
  return potentialClientContactMethods.includes(
    value as PotentialClientContactMethod
  );
}

function isBusinessType(value: string): value is PotentialClientBusinessType {
  return potentialClientBusinessTypes.includes(value as PotentialClientBusinessType);
}

export function validatePotentialClientInput(
  raw: RawPotentialClientInput
): PotentialClientValidationResult {
  const fullName = stringValue(raw.fullName);
  const businessName = stringValue(raw.businessName);
  const email = stringValue(raw.email).toLowerCase();
  const phone = stringValue(raw.phone);
  const businessType = stringValue(raw.businessType);
  const preferredContactMethod = stringValue(raw.preferredContactMethod);
  const message = stringValue(raw.message);
  const sourcePath = stringValue(raw.sourcePath);
  const honeypot = stringValue(raw.honeypot);
  const errors: Partial<Record<keyof RawPotentialClientInput, string>> = {};
  const phoneNormalized = normalizeNorthAmericanPhone(phone);

  if (fullName.length < 2 || fullName.length > 100) {
    errors.fullName = "Full name must be between 2 and 100 characters.";
  }

  if (businessName.length < 2 || businessName.length > 120) {
    errors.businessName = "Business name must be between 2 and 120 characters.";
  }

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!phoneNormalized) {
    errors.phone = "Enter a valid phone number.";
  }

  if (!isBusinessType(businessType)) {
    errors.businessType = "Choose a business type.";
  }

  if (!isContactMethod(preferredContactMethod)) {
    errors.preferredContactMethod = "Choose a preferred contact method.";
  }

  if (message.length > 500) {
    errors.message = "Message must be 500 characters or fewer.";
  }

  if (raw.consentToContact !== true && raw.consentToContact !== "true") {
    errors.consentToContact =
      "Please agree to be contacted so we can follow up about your call request.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors
    };
  }

  return {
    ok: true,
    value: {
      fullName,
      businessName,
      email,
      phone,
      phoneNormalized,
      businessType: businessType as PotentialClientBusinessType,
      preferredContactMethod:
        preferredContactMethod as PotentialClientContactMethod,
      message: message || null,
      consentToContact: true,
      consentText,
      sourcePath: sourcePath || null,
      isSpam: Boolean(honeypot)
    }
  };
}

export function buildPotentialClientInsert({
  input,
  ip,
  now = new Date(),
  userAgent
}: {
  input: PotentialClientValidatedInput;
  ip?: string | null;
  now?: Date;
  userAgent?: string | null;
}) {
  return {
    full_name: input.fullName,
    business_name: input.businessName,
    email: input.email,
    phone: input.phone,
    phone_normalized: input.phoneNormalized,
    business_type: input.businessType,
    preferred_contact_method: input.preferredContactMethod,
    message: input.message,
    status: "new" as const,
    source: "book_call_page",
    source_path: input.sourcePath,
    consent_to_contact: true,
    consent_text: input.consentText,
    consented_at: now.toISOString(),
    consent_ip: ip || null,
    consent_user_agent: userAgent || null,
    confirmation_email_status: "pending" as const,
    owner_notification_status: "pending" as const
  };
}

export function validatePotentialClientStatus(value: unknown) {
  const status = stringValue(value);

  return potentialClientStatuses.includes(status as PotentialClientStatus)
    ? (status as PotentialClientStatus)
    : null;
}

export function validatePotentialClientNotes(value: unknown) {
  const notes = stringValue(value);

  if (notes.length > 2000) {
    return null;
  }

  return notes || null;
}
