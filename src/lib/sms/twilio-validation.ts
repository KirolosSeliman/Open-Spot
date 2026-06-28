export function validateTwilioAccountSid(value: string | null | undefined) {
  return Boolean(value && /^AC[a-zA-Z0-9]{32}$/.test(value.trim()));
}

export function validateTwilioMessagingServiceSid(value: string | null | undefined) {
  return Boolean(value && /^MG[a-zA-Z0-9]{32}$/.test(value.trim()));
}

export function validateTwilioPhoneNumberSid(value: string | null | undefined) {
  return Boolean(value && /^PN[a-zA-Z0-9]{32}$/.test(value.trim()));
}

export function validateE164(value: string | null | undefined) {
  return Boolean(value && /^\+[1-9][0-9]{7,14}$/.test(value.trim()));
}

export function maskTwilioSid(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length < 6) {
    return "••••";
  }

  const prefix = trimmed.slice(0, 2);
  const suffix = trimmed.slice(-3);

  return `${prefix}••••••••••••••••••••${suffix}`;
}

export function formatPhoneForDisplay(phoneE164: string | null | undefined) {
  if (!phoneE164 || !validateE164(phoneE164)) {
    return phoneE164 ?? "—";
  }

  const digits = phoneE164.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    const area = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const line = digits.slice(7);

    return `+1 (${area}) ${prefix}-${line}`;
  }

  return phoneE164;
}
