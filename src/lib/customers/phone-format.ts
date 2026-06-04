export function extractPhoneDigits(input: string) {
  return input.replace(/\D/g, "");
}

export function formatNorthAmericanPhoneForDisplay(input: string) {
  const digits = extractPhoneDigits(input);
  const localDigits =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  const limitedDigits = localDigits.slice(0, 10);

  if (limitedDigits.length <= 3) {
    return limitedDigits;
  }

  if (limitedDigits.length <= 6) {
    return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3)}`;
  }

  return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
}

export function formatInternationalPhoneForDisplay(input: string) {
  const digits = extractPhoneDigits(input).slice(0, 15);

  if (digits.length <= 4) {
    return digits;
  }

  return digits.replace(/(\d{1,4})(?=\d)/g, "$1 ").trim();
}
