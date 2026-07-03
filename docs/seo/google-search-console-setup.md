# Google Search Console Setup

This guide covers manual verification and indexing for [open-spot.ca](https://open-spot.ca).

## 1. Add the property

1. Go to [Google Search Console](https://search.google.com/search-console).
2. Add a **Domain** property for `open-spot.ca`.
3. Prefer **DNS TXT verification** at your domain registrar. This verifies the whole domain and does not require redeploying the app.

## 2. Alternative: HTML tag verification

If DNS verification is not possible:

1. In Search Console, choose the **HTML tag** verification method.
2. Copy only the `content` value from the meta tag (not the full tag).
3. In Vercel **Production** environment variables, set:

```text
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<google-content-value>
```

4. Redeploy the production deployment after saving the variable.
5. Return to Search Console and click **Verify**.

See also: [docs/seo/search-console-verification.md](./search-console-verification.md).

## 3. Submit the sitemap

After verification:

1. Open **Sitemaps** in Search Console.
2. Submit: `https://open-spot.ca/sitemap.xml`

## 4. Request indexing for key URLs

1. Use **URL Inspection** for `https://open-spot.ca`.
2. Request indexing for important public pages listed in [indexing-urls.txt](./indexing-urls.txt).
3. Do not spam repeated indexing requests for the same URL.

## 5. Monitor

- Review **Pages**, **Indexing**, and **Performance** over several weeks.
- Do not expect instant ranking after verification or sitemap submission.

## Rules

- Do not submit private routes (`/dashboard`, `/admin`, `/api`, auth pages).
- Do not use old Vercel preview URLs as canonical properties.
- Keep canonical metadata and sitemap URLs on `https://open-spot.ca`.
