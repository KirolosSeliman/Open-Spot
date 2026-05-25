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

export function normalizePhoneToE164(input: string): PhoneNormalizationResult {
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
    error: "Phone number must be a valid E.164 number."
  };
}
