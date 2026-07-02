# UTM conventions

Use UTM parameters on campaign and profile links when you want analytics separation. Keep canonical URLs clean in metadata, sitemap, and structured data.

Base site: https://open-spot.ca

## Recommended parameters

### utm_source

Identify the platform:

- `linkedin`
- `google_business_profile`
- `github`
- `facebook`
- `x`
- `local_directory`
- `startup_directory`
- `email_outreach`

### utm_medium

Identify the placement type:

- `profile`
- `directory`
- `outreach`
- `social_post`
- `bio_link`

### utm_campaign

Identify the initiative:

- `brand_launch`
- `local_seo`
- `directory_submission`
- `partner_outreach`

## Examples

LinkedIn company page button:

`https://open-spot.ca/contact?utm_source=linkedin&utm_medium=profile&utm_campaign=brand_launch`

Google Business Profile website link:

`https://open-spot.ca?utm_source=google_business_profile&utm_medium=profile&utm_campaign=local_seo`

GitHub README:

`https://open-spot.ca?utm_source=github&utm_medium=profile&utm_campaign=brand_launch`

Local directory listing:

`https://open-spot.ca/solution-annulations-rdv?utm_source=local_directory&utm_medium=directory&utm_campaign=local_seo`

Partner outreach email:

`https://open-spot.ca/guides/remplir-annulations-rdv-sms?utm_source=email_outreach&utm_medium=outreach&utm_campaign=partner_outreach`

## Rules

- Do not add UTM parameters to canonical tags or JSON-LD URLs.
- Use the same campaign name consistently within a launch window.
- Prefer lowercase values with underscores.
- Document live campaigns in `docs/growth/backlink-tracker.csv` notes when relevant.
