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
  const normalizedSlug = slug.trim();

  if (!normalizedSlug) {
    throw new Error("Organization slug is required.");
  }

  let url: URL;
  try {
    url = new URL(
      `/b/${encodeURIComponent(normalizedSlug)}/waitlist`,
      baseUrl
    );
  } catch {
    throw new Error("A valid absolute public app URL is required.");
  }

  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error("A secure public app URL is required.");
  }

  if (mode === "kiosk") {
    url.pathname = `${url.pathname}/kiosk`;
  }

  if (source) {
    url.searchParams.set("source", source);
  }

  return url.toString();
}
