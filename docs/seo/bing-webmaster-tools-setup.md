# Bing Webmaster Tools Setup

This guide covers manual verification and indexing for [open-spot.ca](https://open-spot.ca).

## 1. Add the site

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Add `https://open-spot.ca`.
3. If available, **import from Google Search Console** to speed up verification.

## 2. Alternative: HTML meta verification

If import is not available:

1. Choose **HTML meta tag** verification in Bing.
2. Copy only the `content` value from the `msvalidate.01` meta tag.
3. In Vercel **Production** environment variables, set:

```text
NEXT_PUBLIC_BING_SITE_VERIFICATION=<bing-content-value>
```

4. Redeploy the production deployment after saving the variable.
5. Return to Bing and click **Verify**.

The app renders `<meta name="msvalidate.01" content="..." />` only when this variable is set and non-empty.

See also: [docs/seo/search-console-verification.md](./search-console-verification.md).

## 3. Submit the sitemap

1. Open **Sitemaps** in Bing Webmaster Tools.
2. Submit: `https://open-spot.ca/sitemap.xml`

## 4. Submit important URLs

Submit key public URLs from [indexing-urls.txt](./indexing-urls.txt) when Bing offers URL submission.

## 5. Monitor

- Review SEO reports, Site Explorer, and index coverage.
- Do not spam repeated submissions for the same URL.

## Rules

- Do not submit private or auth routes.
- Do not use old Vercel preview URLs as the primary site URL.
- Keep canonical links on `https://open-spot.ca`.
