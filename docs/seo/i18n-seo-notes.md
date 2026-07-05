# Open Spot i18n SEO Notes

Open Spot currently serves public marketing pages from stable non-locale URLs such as `/`, `/how-it-works`, `/industries`, and the French commercial SEO pages. Language selection is cookie-based in parts of the app, so the site should not emit `hreflang` URLs for `/fr` or `/en` until those routes serve stable language-specific content.

Current launch choice:

- French Canada is the default SEO language for the new commercial pages.
- Metadata uses `fr-CA` / `fr_CA` for public SEO pages.
- No English `hreflang` is emitted because there is no stable English URL set for these pages.

Recommended future improvement:

1. Add stable `/fr` and `/en` route structures or another durable locale URL strategy.
2. Serve language-specific content by URL, not only by cookie.
3. Add `alternates.languages` for `fr-CA`, `en-CA`, and `x-default` only after the routes are real.

## sameAs Activation

`src/config/brand.ts` intentionally keeps `sameAs` empty by default. When real public profiles exist, add only verified URLs such as:

- LinkedIn Company Page URL
- GitHub organization or repository URL
- Google Business Profile URL, if appropriate
- Facebook or X URL, only if actively maintained

Do not add placeholder profiles, empty strings, personal accounts, fake traction, review pages, ratings, or social URLs that are not controlled by Open Spot.
