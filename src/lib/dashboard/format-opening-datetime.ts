export function formatOpeningDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours} h ${minutes} min ${seconds} s`;
}

export function formatOpeningCurrency(cents: number | null, locale: "fr" | "en" = "fr") {
  if (cents === null) {
    return locale === "en" ? "N/A" : "N/D";
  }

  return new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", {
    style: "currency",
    currency: "CAD"
  }).format(cents / 100);
}

export function formatHistoryPaginationRange(
  start: number,
  end: number,
  total: number,
  locale: "fr" | "en" = "fr"
) {
  return locale === "en"
    ? `${start}–${end} of ${total}`
    : `${start}–${end} sur ${total}`;
}
