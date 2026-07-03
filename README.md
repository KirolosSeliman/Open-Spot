# Open Spot

**Official website:** [https://open-spot.ca](https://open-spot.ca)

**Open Spot** / **2e Chance RDV** is a bilingual SMS-first cancellation recovery SaaS for appointment-based local businesses. It helps merchants recover last-minute openings by sending SMS alerts to opted-in waitlist clients while keeping final appointment confirmation manual.

Open Spot works alongside the merchant's existing calendar, POS, phone, or booking workflow. It is not a full CRM, not a marketplace, and not a booking-platform replacement.

---

## Official Website

Production site: **https://open-spot.ca**

This is the canonical public domain for Open Spot. Use it for customer-facing links, QR codes, emails, SMS callbacks, Supabase redirect URLs, and search-engine properties. Do not use old Vercel preview URLs as the primary public domain in production.

---

## Product Summary

Open Spot helps salons, barbers, spas, beauty clinics, nail salons, and similar appointment-based businesses fill last-minute cancellations.

How it works:

1. Clients opt in to an SMS waitlist (for example via QR code).
2. When a slot opens, Open Spot sends an SMS alert to eligible opted-in clients.
3. Clients can reply **OUI**, **YES**, or **1**.
4. Replies are ranked by timestamp.
5. The merchant **manually chooses** who to confirm — the first reply is never auto-confirmed.

The product is independent from Vistaire. Merchants keep their current reservation system; Open Spot handles waitlist consent, last-minute SMS offers, replies, merchant validation, and recovered-revenue reporting.

A planned expansion adds appointment reminder automation (24-hour reminders, YES/OUI and NO/NON handling, optional conversion of SMS-confirmed cancellations into recoverable openings). That expansion must keep Open Spot focused as an SMS automation layer, not a full booking platform or generic CRM.

---

## Core Positioning

| | |
|---|---|
| **Product type** | SMS-first cancellation recovery |
| **Languages** | Bilingual fr-CA / en-CA |
| **Merchant control** | Manual validation before every confirmed booking |
| **Waitlist** | Consent-based; explicit opt-in required |
| **Client app** | No customer mobile app required |
| **Not** | A full CRM, a marketplace, or a booking-platform replacement |

Initial target sectors: beauty and esthetic businesses, barbers, salons. The platform remains generic enough for other appointment-based businesses later.

---

## Tech Stack

- **Next.js** (App Router) and **TypeScript**
- **Supabase** (Auth, Postgres, RLS)
- **Twilio-ready** SMS provider layer (simulator default for local dev)
- **Vercel** deployment
- **Vitest**, **ESLint**, and **TypeScript** checks (`npm test`, `npm run lint`, `npm run typecheck`)

---

## Local Development

```bash
npm install
npm run dev
```

Verification before opening a pull request:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Live testing requires `.env.local` with Supabase URL, anon key, and a server-only service role key. Do not commit `.env.local`.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values. Never commit real secrets.

Production public URLs must use the official domain:

```bash
APP_BASE_URL=https://open-spot.ca
NEXT_PUBLIC_SITE_URL=https://open-spot.ca
NEXT_PUBLIC_APP_URL=https://open-spot.ca
```

`APP_BASE_URL` is the preferred server-side source for production links. Keep Supabase service-role keys, Twilio auth tokens, Stripe secrets, and webhook secrets server-side only — never in `NEXT_PUBLIC_*` variables.

Optional search-engine verification (copy values from Google Search Console / Bing Webmaster Tools; do not invent tokens):

```bash
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
NEXT_PUBLIC_BING_SITE_VERIFICATION=
```

See [docs/deployment-guide.md](docs/deployment-guide.md) and [docs/seo/search-console-verification.md](docs/seo/search-console-verification.md).

---

## Production Domain and SEO

**Production domain:** https://open-spot.ca

Use this domain for:

- Canonical URLs, sitemap, and robots (`/sitemap.xml`, `/robots.txt`)
- Google Search Console and Bing Webmaster Tools
- Twilio inbound and status webhooks (see below)
- Supabase Auth redirect URLs
- Public waitlist links, QR codes, and kiosk links

After changing URL-related environment variables in Vercel, redeploy and regenerate any QR codes or printed links that used a previous origin.

**SEO and brand docs:**

- [Google Search Console setup](docs/seo/google-search-console-setup.md)
- [Bing Webmaster Tools setup](docs/seo/bing-webmaster-tools-setup.md)
- [Indexing URL list](docs/seo/indexing-urls.txt)
- [Brand profile kit](docs/brand/brand-profile-kit.md)
- [Backlink tracker](docs/growth/backlink-tracker.csv)

---

## Core Safety Rules

- Never send cancellation-recovery SMS to opted-out customers.
- Never treat imported customers as opted in without clear consent proof.
- Never expose service role keys or SMS provider credentials in client-side code.
- Never allow one organization to read another organization's customers, openings, messages, or bookings.
- Never auto-confirm a booking from the first SMS reply (`OUI`, `YES`, or `1`).
- Always require merchant validation before confirming a recovered booking.
- Appointment reminders must re-check current consent before SMS is sent.
- Client cancellation replies can create recoverable openings only when configured; waitlist respondents still require manual merchant validation.

---

## MVP Scope

**Included in the MVP:**

- Merchant authentication and organization workspaces
- Services, customer records, CSV/Excel import
- Explicit SMS consent states and QR-code waitlist signup
- Opening creation with optional last-minute offer or discount
- SMS provider abstraction with a local simulator
- Inbound reply handling and respondent ranking by reply timestamp
- Manual merchant validation before confirmation
- Confirmation and unavailable SMS messages; STOP unsubscribe handling
- Basic admin view and recovered revenue reporting
- Planned appointment reminder foundation: appointment records, scheduled SMS queue, bilingual reminder templates, confirmation/cancellation replies, and safe cancellation-to-recovery automation

**Not included in the MVP:**

- Customer mobile apps or replacing the merchant's booking platform
- Automatic Square, Fresha, Booksy, or GOrendezvous integrations
- Complex staff scheduling or full CRM functionality
- Automatic booking confirmation without merchant validation
- Full appointment calendar replacement or deep booking platform integrations
- AI-assisted targeting (planned later; must not be presented as live until implemented)
- Advanced billing automation
- Automatic recovery SMS after a cancelled appointment unless explicitly enabled by the merchant and protected by consent checks

---

## Documentation

- [Product requirements](docs/product-requirements.md)
- [Architecture](docs/architecture.md)
- [Roadmap](docs/roadmap.md)
- [Deployment guide](docs/deployment-guide.md)
- [Security and privacy](docs/security-and-privacy.md)
- [Data model](docs/data-model.md)
- [SMS compliance notes](docs/sms-compliance-notes.md)
- [Design direction](docs/design-direction.md)

---

## Customer Identity and Phone Numbers

Open Spot uses one customer identity per organization and canonical E.164 phone number. Dashboard client creation must reject duplicate phone numbers instead of silently overwriting the existing customer's name, language, notes, or SMS consent. Public waitlist signups may refresh consent and waitlist preferences for an existing phone number, but they must preserve the existing customer name unless a future explicit edit/merge flow is designed.

If an older deployment already overwrote a customer name because the same phone number was entered for another person, repair that record manually from the dashboard/admin tooling or a reviewed SQL update. Do not guess or automatically roll back identity fields unless audit data proves the previous values.

---

## Auth and Organization Status

The app includes Supabase email/password sign-up, sign-in, sign-out, and an organization onboarding flow. A signed-in user without an organization is directed to `/onboarding`; creating an organization creates the owner profile, organization settings, owner membership, billing defaults, and audit record in one RPC-backed flow.

---

## Opening Alert SMS Provider

The cancellation/opening alert flow uses the selected server-side SMS provider. `SMS_PROVIDER=simulator` remains the safe default and records simulated outbound messages with `from_number=+10000000000`. When `SMS_PROVIDER=twilio` and `ALLOW_REAL_SMS_SENDS=true` are configured with valid Twilio credentials, the same opening alert flow sends real Twilio SMS to opted-in eligible customers only. Plivo remains unavailable until implemented.

Vercel environment variable changes require a new deployment before they affect production.

Manual merchant validation remains mandatory: `OUI`, `YES`, and `1` only create or update a pending merchant-validation response and never confirm a recovered booking automatically.

---

## Twilio Webhook Foundation

Open Spot stays simulator-first locally. Do not configure Twilio for local testing unless you intentionally want to test the public webhook foundation after deployment.

**Production webhook URLs:**

- Inbound: `https://open-spot.ca/api/webhooks/twilio/inbound`
- Status: `https://open-spot.ca/api/webhooks/twilio/status`

Required server-side environment variables for Twilio:

```bash
SMS_PROVIDER=twilio
ALLOW_REAL_SMS_SENDS=true
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_SOURCE_NUMBER=+1XXXXXXXXXX
TWILIO_STATUS_CALLBACK_URL=https://open-spot.ca/api/webhooks/twilio/status
APP_BASE_URL=https://open-spot.ca
```

`APP_BASE_URL` must be the canonical HTTPS production domain (`https://open-spot.ca`). A Vercel-generated preview URL must not be used for customer-facing links, emails, SMS, or webhooks in production. Keep all Twilio values server-only; none should use a `NEXT_PUBLIC_` prefix. Real Twilio sending stays disabled unless both `SMS_PROVIDER=twilio` and `ALLOW_REAL_SMS_SENDS=true` are set.

Twilio Console setup after deployment:

1. Open Twilio Console and create or open a Messaging Service.
2. In the Messaging Service integration/webhook settings, set **Incoming Messages** to **Send a webhook**.
3. Set the incoming webhook URL to `https://open-spot.ca/api/webhooks/twilio/inbound`.
4. Set the incoming method to `POST`.
5. Set the **Delivery Status Callback** URL to `https://open-spot.ca/api/webhooks/twilio/status`.
6. Set the status callback method to `POST`.

`sent` in Twilio does not mean the client received the SMS. Open Spot treats only `delivered` from the Twilio status callback as delivery confirmation.

Before enabling real Twilio sends in production, apply Supabase migrations and verify delivery tracking columns exist:

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sms_messages'
  and column_name in (
    'error_code',
    'status_callback_received_at',
    'delivered_at',
    'failed_at',
    'provider_status_payload'
  )
order by column_name;
```

The inbound webhook validates Twilio signatures with the official Twilio SDK, then reuses the same safe inbound processing as the simulator. `OUI`, `YES`, and `1` only prepare a pending merchant-validation response; they never auto-confirm a booking. `STOP`, `ARRET`, `ARRÊT`, `UNSUBSCRIBE`, and `CANCEL` opt out only when the message can be linked to trusted context.

Optional one-off Twilio smoke test after credentials are configured:

```bash
ALLOW_REAL_SMS_SENDS=true TWILIO_ACCOUNT_SID=AC... TWILIO_AUTH_TOKEN=... TWILIO_SOURCE_NUMBER=+1XXXXXXXXXX npm run twilio:smoke -- +15145551234 "Test Open Spot"
```

The smoke test refuses to send unless `ALLOW_REAL_SMS_SENDS=true`, requires a real E.164 Twilio sender number, and never prints the auth token.

---

## Local SMS Simulator Recovery Test

Use the simulator for local cancellation-recovery testing unless you are intentionally testing Twilio with real sends enabled.

1. Confirm `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SMS_PROVIDER=simulator`. For preview/production simulator testing, also set a server-only `SIMULATOR_WEBHOOK_SECRET`.
2. Run `npm install` if dependencies are missing.
3. Run `npm run dev`.
4. Sign in as a merchant, complete onboarding if needed, create at least one service, and create at least one opted-in customer on the waitlist.
5. Open `/dashboard/new-cancellation`, create an opening, and note the customer phone shown in the prepared offer or response flow.
6. Use the simulator source number `+10000000000` as the inbound `to` number.

PowerShell positive reply:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/sms/inbound" -Method POST -ContentType "application/json" -UseBasicParsing -Body '{"from":"+15142494425","to":"+10000000000","body":"OUI","providerMessageId":"local-oui-1"}'
```

Expected result: JSON includes `status":"received_linked"` and the reply appears in `/dashboard/responses` as waiting for manual validation. `YES` and `1` should behave the same way.

PowerShell `YES` reply:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/sms/inbound" -Method POST -ContentType "application/json" -UseBasicParsing -Body '{"from":"+15142494425","to":"+10000000000","body":"YES","providerMessageId":"local-yes-1"}'
```

Expected result: JSON includes `status":"received_linked"` and does not mark a booking as confirmed. The merchant must still validate manually.

PowerShell opt-out:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/sms/inbound" -Method POST -ContentType "application/json" -UseBasicParsing -Body '{"from":"+15142494425","to":"+10000000000","body":"STOP","providerMessageId":"local-stop-1"}'
```

Expected result: JSON includes `status":"received_linked"` and `action":"opted_out"`, and the customer's current SMS consent is updated to `opted_out`. `ARRET`, `UNSUBSCRIBE`, and `CANCEL` also opt out when the reply is not in appointment-reminder context.

PowerShell unknown reply:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/sms/inbound" -Method POST -ContentType "application/json" -UseBasicParsing -Body '{"from":"+15142494425","to":"+10000000000","body":"Maybe later","providerMessageId":"local-unknown-1"}'
```

Expected result: JSON includes `status":"received_linked"` and `classification":"unknown"` when a prior simulator outbound SMS exists. If there is no prior outbound simulator SMS matching `from` and `to`, the API returns `received_unlinked`.

For preview or production simulator tests, include the protected header and use a non-production preview host only for internal testing — not as the public canonical domain.

After an opt-out test, create another cancellation and confirm the same customer is excluded from future eligible recipients. Replies are visible in `/dashboard/responses`; positive replies stay in manual-validation state and never auto-confirm a booking.
