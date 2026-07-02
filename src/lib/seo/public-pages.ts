export type PublicPageEntry = {
  path: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
};

/** Public, indexable marketing and legal pages. Excludes auth, dashboard, and API routes. */
export const PUBLIC_INDEXABLE_PAGES: PublicPageEntry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/solution-annulations-rdv", changeFrequency: "monthly", priority: 0.9 },
  { path: "/sms-pour-salons-esthetique", changeFrequency: "monthly", priority: 0.85 },
  { path: "/sms-pour-barbiers", changeFrequency: "monthly", priority: 0.85 },
  { path: "/sms-pour-cliniques-beaute", changeFrequency: "monthly", priority: 0.85 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.75 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.75 },
  { path: "/industries", changeFrequency: "monthly", priority: 0.7 },
  { path: "/book-call/questions", changeFrequency: "monthly", priority: 0.7 },
  {
    path: "/guides/remplir-annulations-rdv-sms",
    changeFrequency: "monthly",
    priority: 0.75
  },
  {
    path: "/resources/liste-attente-sms-salons",
    changeFrequency: "monthly",
    priority: 0.75
  },
  { path: "/politique-confidentialite", changeFrequency: "yearly", priority: 0.5 },
  { path: "/conditions-utilisation", changeFrequency: "yearly", priority: 0.5 },
  { path: "/consentement-sms", changeFrequency: "yearly", priority: 0.5 }
];

export const PUBLIC_INDEXABLE_PATHS = PUBLIC_INDEXABLE_PAGES.map((page) => page.path);

export function buildPublicPageUrl(siteUrl: string, path: string) {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");

  return path === "/" ? normalizedSiteUrl : `${normalizedSiteUrl}${path}`;
}
