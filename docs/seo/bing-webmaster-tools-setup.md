# Bing Webmaster Tools setup

Manual steps for the site owner. Codex cannot complete these actions without authenticated access to Bing Webmaster Tools.

## Prerequisites

- Production site live at `https://open-spot.ca`
- Sitemap available at `https://open-spot.ca/sitemap.xml`
- Optional HTML meta verification env var:
  - `NEXT_PUBLIC_BING_SITE_VERIFICATION`

## 1. Add the site

1. Open [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Add `https://open-spot.ca`.
3. Verify ownership using one of these methods:
   - Import from Google Search Console (fastest if GSC is already verified)
   - HTML meta tag (`msvalidate.01`)
   - DNS / CNAME
   - XML file

## 2. HTML meta tag verification (optional)

If Bing provides an `msvalidate.01` token:

1. Set `NEXT_PUBLIC_BING_SITE_VERIFICATION` in production env.
2. Redeploy.
3. Confirm the meta tag is present in rendered HTML.
4. Complete verification in Bing.

## 3. XML file verification (optional)

If Bing provides `BingSiteAuth.xml`:

1. Place the exact file Bing gives you in `public/BingSiteAuth.xml`.
2. Deploy.
3. Confirm it is reachable at `https://open-spot.ca/BingSiteAuth.xml`.
4. Complete verification in Bing.

Do not commit a fake or placeholder `BingSiteAuth.xml`.

## 4. Submit the sitemap

1. Open **Sitemaps** in Bing Webmaster Tools.
2. Submit: `https://open-spot.ca/sitemap.xml`

## 5. Submit priority URLs manually

Use **URL Submission** for the URLs in `docs/seo/indexing-urls.txt`, including:

- `https://open-spot.ca`
- Main public SEO pages
- Legal pages
- `/about` and `/contact`

Submit once per major release. Do not repeatedly spam submissions.

## 6. Monitor

Review:

- Site Explorer
- Index coverage
- SEO Reports
- Crawl information

## 7. Optional IndexNow

See `docs/seo/indexnow-setup.md` for optional faster notification after major content updates.
