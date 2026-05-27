export function extractPhoneDigits(input: string) {
  return input.replace(/\D/g, "");
}

export function formatNorthAmericanPhoneForDisplay(input: string) {
  const digits = extractPhoneDigits(input);
  const displayDigits =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  const normalized = displayDigits.slice(0, 10);

  if (normalized.length <= 3) {
    return normalized;
  }

  if (normalized.length <= 6) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
  }

  return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
}
