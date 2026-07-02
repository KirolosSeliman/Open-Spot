# Brand profile setup checklist

Use this after deploying the technical SEO foundation.

## Owned profiles

- [ ] LinkedIn Company Page created with copy from `docs/brand/brand-profile-kit.md`
- [ ] Google Business Profile created only if this is a real operating business (no fake address)
- [ ] GitHub README links to https://open-spot.ca
- [ ] X / Twitter profile created or updated
- [ ] Facebook page created or updated

## Search indexing

- [ ] Google Search Console domain property added for `open-spot.ca`
- [ ] Google verification completed (prefer DNS TXT)
- [ ] Sitemap submitted: https://open-spot.ca/sitemap.xml
- [ ] Priority URLs inspected and indexing requested (`docs/seo/indexing-urls.txt`)
- [ ] Bing Webmaster Tools site added
- [ ] Bing verification completed
- [ ] Bing sitemap submitted

## Directories and backlinks

- [ ] Local Québec / Montréal directory shortlist reviewed (`docs/growth/backlink-targets.md`)
- [ ] Startup directory submissions planned in `docs/growth/backlink-tracker.csv`
- [ ] Outreach templates customized (`docs/growth/backlink-outreach-templates.md`)

## Brand consistency

- [ ] Logo consistent across profiles (`public/brand/`)
- [ ] Name consistent: **Open Spot**
- [ ] Alternate French name documented where relevant: **2e Chance RDV**
- [ ] Website URL consistent: https://open-spot.ca
- [ ] Description consistent with product reality
- [ ] Canonical domain set in production env (`NEXT_PUBLIC_SITE_URL`)
- [ ] No old Vercel preview URL in customer-facing metadata
- [ ] No fake address on Google Business Profile
- [ ] No fake reviews or testimonials added
- [ ] No duplicate conflicting brand names in public copy
- [ ] Real social URLs added to `src/lib/brand.ts` only when profiles exist

## Optional

- [ ] IndexNow key generated and hosted (`docs/seo/indexnow-setup.md`)
- [ ] UTM conventions adopted for profile links (`docs/growth/utm-conventions.md`)
