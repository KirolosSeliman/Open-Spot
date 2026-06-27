export function formatSubscriptionMoney(
  cents: number,
  currency: string,
  locale: "fr" | "en"
) {
  const intlLocale = locale === "fr" ? "fr-CA" : "en-CA";

  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: currency || "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.max(0, cents) / 100);
}

export function formatSubscriptionDate(
  value: string | null,
  locale: "fr" | "en",
  fallback: string
) {
  if (!value) {
    return fallback;
  }

  const intlLocale = locale === "fr" ? "fr-CA" : "en-CA";

  return new Date(value).toLocaleDateString(intlLocale, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}
