# UTM Conventions

Track campaign and profile traffic without polluting canonical URLs.

## Parameters

### utm_source

| Value | Use when |
|-------|----------|
| `linkedin` | LinkedIn company page or posts |
| `google_business_profile` | Google Business Profile website link |
| `github` | GitHub README or profile |
| `local_directory` | Québec/Montréal or other local directory listing |
| `startup_directory` | Startup/product directory listing |

### utm_medium

| Value | Use when |
|-------|----------|
| `profile` | Social or owned profile website field |
| `directory` | Directory listing link |
| `outreach` | Email or DM outreach |

### utm_campaign

| Value | Use when |
|-------|----------|
| `brand_launch` | Initial public launch period |
| `local_seo` | Local directory or regional campaigns |

## Example URLs

```text
https://open-spot.ca?utm_source=linkedin&utm_medium=profile&utm_campaign=brand_launch
https://open-spot.ca/book-call/questions?utm_source=local_directory&utm_medium=directory&utm_campaign=local_seo
```

## Rules

- Keep **canonical** links clean in metadata, sitemap, and JSON-LD (`https://open-spot.ca` without UTMs).
- Use UTM links on profiles and campaigns when analytics tracking is useful.
- Do not put UTM parameters in `NEXT_PUBLIC_SITE_URL`, `APP_BASE_URL`, or sitemap entries.
- Do not use UTMs in Google Search Console sitemap submissions.
