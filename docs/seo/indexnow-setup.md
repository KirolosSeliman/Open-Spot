# IndexNow setup

IndexNow can notify participating search engines when important public URLs change. This is optional and must be configured manually.

## Prerequisites

- Verified site in Bing Webmaster Tools
- Ability to deploy a public key file at the site root

## 1. Generate a key

1. In Bing Webmaster Tools, generate an IndexNow key, or create one following IndexNow documentation.
2. Keep the key private in your deployment secrets / local shell only.

## 2. Host the key file

Bing/IndexNow expects a text file at:

`https://open-spot.ca/<KEY>.txt`

The file content should be the key itself.

Do not commit the real key file to git unless your team intentionally manages it outside secrets policy.

## 3. Submit URLs after major updates

Use the project script locally or in CI only when intentional:

```bash
INDEXNOW_KEY=your-key npm run seo:indexnow
```

The script reads URLs from `docs/seo/indexing-urls.txt` and submits them to the official IndexNow endpoint.

Environment variables:

- `INDEXNOW_KEY` (required, server/local only)
- `INDEXNOW_HOST` (optional, default `open-spot.ca`)
- `INDEXNOW_KEY_LOCATION` (optional, default `https://open-spot.ca/<KEY>.txt`)

## 4. Verify in Bing

After submission, confirm Bing Webmaster Tools recognizes the key and accepted submissions.

## Safety rules

- Never print the full key in logs.
- Do not run IndexNow automatically on every deploy by default.
- Do not submit private dashboard, auth, or API URLs.
