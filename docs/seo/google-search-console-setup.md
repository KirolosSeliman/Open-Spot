# Google Search Console setup

Manual steps for the site owner. Codex cannot complete these actions without authenticated access to Google Search Console and DNS.

## Prerequisites

- Production site live at `https://open-spot.ca`
- `robots.txt` allows public pages and references `https://open-spot.ca/sitemap.xml`
- Optional HTML tag verification env var available in the deployment platform:
  - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`

## 1. Add the property

1. Open [Google Search Console](https://search.google.com/search-console).
2. Add a **Domain** property for `open-spot.ca` when possible.
3. Prefer **DNS TXT** verification for domain-level ownership.
4. If DNS is not available immediately, use **HTML tag** verification:
   - Copy the verification token from Google.
   - Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel/production env.
   - Redeploy.
   - Confirm the meta tag appears in the homepage HTML source.

## 2. Submit the sitemap

1. In Search Console, open **Sitemaps**.
2. Submit: `https://open-spot.ca/sitemap.xml`
3. Wait for Google to fetch and process it.

## 3. Request indexing for priority URLs

Use **URL Inspection** for each URL listed in `docs/seo/indexing-urls.txt`.

For each URL:

1. Paste the full URL.
2. Click **Test live URL** if available.
3. Click **Request indexing** when eligible.
4. Do not spam repeated requests for the same URL.

You can print the same list locally with:

```bash
npm run seo:indexing-urls
```

## 4. Monitor results

Track these Search Console reports over the following weeks:

- **Pages** / Coverage
- **Sitemaps**
- **Search performance**
- **Manual actions** (should remain clean)

## 5. Brand clarity checks

When reviewing indexed pages, confirm Google sees:

- Brand name: **Open Spot**
- Alternate/public French product name: **2e Chance RDV**
- Official website: `https://open-spot.ca`
- Topic: SMS appointment cancellation recovery for salons, barbers, spas, and beauty clinics

## Notes

- Do not use preview deployment URLs as canonical URLs.
- Do not add `noindex` to public marketing or legal pages.
- Auth, dashboard, admin, and API routes are excluded from the sitemap by design.
