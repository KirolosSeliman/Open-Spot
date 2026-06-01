export function buildPublicWaitlistUrl({
  baseUrl,
  slug,
  mode,
  source
}: {
  baseUrl: string;
  slug: string;
  mode?: "standard" | "kiosk";
  source?: "qr_code";
}) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const path = `/b/${encodeURIComponent(slug)}/waitlist`;
  const query = source ? `?source=${source}` : "";

  if (mode === "kiosk") {
    return `${normalizedBaseUrl}${path}/kiosk`;
  }

  return `${normalizedBaseUrl}${path}${query}`;
}
