export type PhoneNormalizationResult =
  | {
      ok: true;
      phoneE164: string;
    }
  | {
      ok: false;
      error: string;
    };

const e164Pattern = /^\+[1-9][0-9]{7,14}$/;
const countryCallingCodePattern = /^\+?[1-9][0-9]{0,3}$/;
export const invalidNorthAmericanPhoneMessage =
  "Enter a valid 10-digit Canadian or US phone number.";
export const invalidPhoneMessage = "Enter a valid phone number.";

export type PhoneNormalizationInput =
  | string
  | {
      phone?: unknown;
      countryCallingCode?: unknown;
      nationalNumber?: unknown;
    };

export function normalizePhoneToE164(
  input: PhoneNormalizationInput
): PhoneNormalizationResult {
  if (typeof input === "object" && input !== null) {
    const phone = String(input.phone ?? "").trim();
    const countryCallingCode = String(input.countryCallingCode ?? "").trim();
    const nationalNumber = String(input.nationalNumber ?? "").trim();

    if (phone.startsWith("+")) {
      return normalizePhoneToE164(phone);
    }

    if (countryCallingCode || nationalNumber) {
      return normalizePhonePartsToE164({
        countryCallingCode,
        nationalNumber: nationalNumber || phone
      });
    }

    return normalizePhoneToE164(phone);
  }

  const trimmed = input.trim();

  if (e164Pattern.test(trimmed)) {
    return {
      ok: true,
      phoneE164: trimmed
    };
  }

  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 10) {
    return {
      ok: true,
      phoneE164: `+1${digits}`
    };
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return {
      ok: true,
      phoneE164: `+${digits}`
    };
  }

  return {
    ok: false,
    error: invalidNorthAmericanPhoneMessage
  };
}

function normalizePhonePartsToE164({
  countryCallingCode,
  nationalNumber
}: {
  countryCallingCode: string;
  nationalNumber: string;
}): PhoneNormalizationResult {
  const normalizedCountryCode = countryCallingCode.startsWith("+")
    ? countryCallingCode
    : `+${countryCallingCode}`;
  const countryDigits = normalizedCountryCode.replace(/\D/g, "");
  const nationalDigits = nationalNumber.replace(/\D/g, "");

  if (
    !countryCallingCodePattern.test(normalizedCountryCode) ||
    !nationalDigits
  ) {
    return {
      ok: false,
      error: invalidPhoneMessage
    };
  }

  if (countryDigits === "1" && nationalDigits.length !== 10) {
    return {
      ok: false,
      error: invalidNorthAmericanPhoneMessage
    };
  }

  const e164 = `+${countryDigits}${nationalDigits}`;

  if (!e164Pattern.test(e164)) {
    return {
      ok: false,
      error: invalidPhoneMessage
    };
  }

  return {
    ok: true,
    phoneE164: e164
  };
}
