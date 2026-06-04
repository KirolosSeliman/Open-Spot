# Open Spot

Open Spot is a bilingual SMS-first cancellation recovery SaaS for appointment-based local businesses. It helps merchants fill last-minute openings by sending SMS offers to customers who have explicitly opted into a waitlist.

The next planned product expansion adds appointment reminder automation: 24-hour reminders, YES/OUI confirmation, NO/NON cancellation handling, and optional conversion of SMS-confirmed cancellations into recoverable openings. This expansion must keep Open Spot focused as an SMS automation layer, not a full booking platform or generic CRM.

The product is independent from Vistaire. It does not replace the merchant's booking system. Merchants keep using their current calendar, point-of-sale, phone, DM, or booking workflow, while Open Spot handles waitlist consent, last-minute SMS offers, replies, merchant validation, and recovered revenue reporting.

## MVP Positioning

Fill last-minute cancellations by SMS without changing your current appointment system.

Initial target sectors:

- Beauty and esthetique businesses
- Barbers
- Salons

The platform should remain generic enough to support other appointment-based businesses later.

## MVP Scope

Included in the MVP:

- Merchant authentication
- Organization workspaces
- Services
- Customer records
- CSV/Excel customer import
- Explicit SMS consent states
- QR-code waitlist signup page
- Opening creation
- Optional last-minute offer or discount
- SMS provider abstraction with a local simulator
- Inbound reply handling
- Respondent ranking by reply timestamp
- Manual merchant validation before confirmation
- Confirmation and unavailable SMS messages
- STOP unsubscribe handling
- Basic admin view
- Recovered revenue reporting
- Planned appointment reminder foundation: appointment records, scheduled SMS queue,
  bilingual reminder templates, confirmation/cancellation replies, and safe
  cancellation-to-recovery automation.

Not included in the MVP:

- Customer mobile apps
- Replacing the merchant's booking platform
- Automatic Square, Fresha, Booksy, or GOrendezvous integrations
- Complex staff scheduling
- Full CRM functionality
- AI-assisted targeting is planned for a later product phase and must not be
  presented as live automation until implemented.
- Advanced billing automation
- Automatic booking confirmation without merchant validation
- Full appointment calendar replacement
- Deep booking platform integrations
- Automatic recovery SMS after a cancelled appointment unless explicitly enabled
  by the merchant and protected by consent checks.

## Documentation

- [Product requirements](docs/product-requirements.md)
- [Architecture](docs/architecture.md)
- [Roadmap](docs/roadmap.md)
- [Security and privacy](docs/security-and-privacy.md)
- [Data model](docs/data-model.md)
- [SMS compliance notes](docs/sms-compliance-notes.md)
- [Design direction](docs/design-direction.md)

## Core Safety Rules

- Never send cancellation-recovery SMS to opted-out customers.
- Never treat imported customers as opted in without clear consent proof.
- Never expose service keys or SMS provider credentials in client-side code.
- Never allow one organization to read another organization's customers, openings, messages, or bookings.
- Always require merchant validation before confirming a recovered booking.
- Appointment reminders must re-check current consent before SMS is sent.
- Client cancellation replies can create recoverable openings only when configured;
  waitlist respondents still require manual merchant validation.

## Customer Identity And Phone Numbers

Open Spot uses one customer identity per organization and canonical E.164 phone
number. Dashboard client creation must reject duplicate phone numbers instead
of silently overwriting the existing customer's name, language, notes, or SMS
consent. Public waitlist signups may refresh consent and waitlist preferences
for an existing phone number, but they must preserve the existing customer name
unless a future explicit edit/merge flow is designed.

If an older deployment already overwrote a customer name because the same phone
number was entered for another person, repair that record manually from the
dashboard/admin tooling or a reviewed SQL update. Do not guess or automatically
roll back identity fields unless audit data proves the previous values.

## Auth And Organization Status

The app includes Supabase email/password sign-up, sign-in, sign-out, and an organization onboarding flow. A signed-in user without an organization is directed to `/onboarding`; creating an organization creates the owner profile, organization settings, owner membership, billing defaults, and audit record in one RPC-backed flow.

Live testing requires `.env.local` with Supabase URL, anon key, and a server-only service role key. Do not commit `.env.local`.

## Opening Alert SMS Provider

The cancellation/opening alert flow uses the selected server-side SMS provider.
`SMS_PROVIDER=simulator` remains the safe default and records simulated outbound
messages with `from_number=+10000000000`. When `SMS_PROVIDER=twilio` and
`ALLOW_REAL_SMS_SENDS=true` are configured with valid Twilio credentials, the
same opening alert flow sends real Twilio SMS to opted-in eligible customers
only. Plivo remains unavailable until implemented.

Vercel environment variable changes require a new deployment before they affect
production. Twilio inbound webhooks require a public HTTPS URL such as a
Vercel-generated deployment URL or custom domain.

Manual merchant validation remains mandatory: `OUI`, `YES`, and `1` only create
or update a pending merchant-validation response and never confirm a recovered
booking automatically.

## Production Public URL And QR Codes

The dashboard QR code page uses a single trusted public app origin for the QR
code, public waitlist link, copy button, and kiosk link. In production this
origin must be HTTPS and must not point to localhost, private IPs, or internal
hosts.

On Vercel, set the canonical public URL before printing or sharing QR codes:

```bash
APP_BASE_URL=https://your-production-domain.com
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

`APP_BASE_URL` is the preferred server-side source for production links.
`NEXT_PUBLIC_APP_URL` may be used only for the same public, non-secret app
origin. Never put Supabase service-role keys, Twilio auth tokens, Stripe
secrets, or webhook secrets in `NEXT_PUBLIC_*` variables.

After changing either value in Vercel, redeploy the app. QR codes or printed
links generated before this fix should be regenerated if they encoded a
localhost URL. When a custom domain is added later, update `APP_BASE_URL` to
that HTTPS domain and redeploy.

## Local SMS Simulator Recovery Test

Use the simulator for local cancellation-recovery testing unless you are
intentionally testing Twilio with real sends enabled.

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

Expected result: JSON includes `status":"received_linked"` and `classification":"unknown"` when a prior simulator outbound SMS exists. If there is no prior outbound simulator SMS matching `from` and `to`, the API returns `received_unlinked`; that means the app could not safely infer organization/customer/opening context.

For preview or production simulator tests, include the protected header:

```powershell
Invoke-WebRequest -Uri "https://your-preview-url.example/api/sms/inbound" -Method POST -ContentType "application/json" -Headers @{"x-open-spot-simulator-secret"="your-secret"} -UseBasicParsing -Body '{"from":"+15142494425","to":"+10000000000","body":"OUI","providerMessageId":"preview-oui-1"}'
```

After an opt-out test, create another cancellation and confirm the same customer is excluded from future eligible recipients. Replies are visible in `/dashboard/responses`; positive replies stay in manual-validation state and never auto-confirm a booking.

## Twilio Webhook Foundation

Open Spot stays simulator-first locally. Do not configure Twilio for local testing unless you intentionally want to test the public webhook foundation after deployment.

Required server-side environment variables for Twilio:

```bash
SMS_PROVIDER=twilio
ALLOW_REAL_SMS_SENDS=true
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_SOURCE_NUMBER=+1XXXXXXXXXX
TWILIO_STATUS_CALLBACK_URL=https://project-name.vercel.app/api/webhooks/twilio/status
APP_BASE_URL=https://project-name.vercel.app
```

`APP_BASE_URL` can be a Vercel-generated URL. A custom domain is not required. Keep all Twilio values server-only; none should use a `NEXT_PUBLIC_` prefix. Real Twilio sending stays disabled unless both `SMS_PROVIDER=twilio` and `ALLOW_REAL_SMS_SENDS=true` are set. If `TWILIO_MESSAGING_SERVICE_SID` is configured, Open Spot sends through the Messaging Service. `TWILIO_SOURCE_NUMBER` is still required so outbound `sms_messages.from_number` can be stored reliably for inbound reply matching.

Twilio Console setup after deployment:

1. Open Twilio Console and create or open a Messaging Service.
2. In the Messaging Service integration/webhook settings, set **Incoming Messages** to **Send a webhook**.
3. Set the incoming webhook URL to `{APP_BASE_URL}/api/webhooks/twilio/inbound`.
4. Set the incoming method to `POST`.
5. Set the **Delivery Status Callback** URL to `{APP_BASE_URL}/api/webhooks/twilio/status`.
6. Set the status callback method to `POST`.

The inbound webhook validates Twilio signatures with the official Twilio SDK, parses `From`, `To`, `Body`, `MessageSid`, `SmsSid`, `AccountSid`, and `MessagingServiceSid`, then reuses the same safe inbound processing as the simulator. `OUI`, `YES`, and `1` only prepare a pending merchant-validation response; they never auto-confirm a booking. `STOP`, `ARRET`, `ARRÊT`, `UNSUBSCRIBE`, and `CANCEL` opt out only when the message can be linked to trusted context.

Optional one-off Twilio smoke test after credentials are configured:

```bash
ALLOW_REAL_SMS_SENDS=true TWILIO_ACCOUNT_SID=AC... TWILIO_AUTH_TOKEN=... TWILIO_SOURCE_NUMBER=+1XXXXXXXXXX npm run twilio:smoke -- +15145551234 "Test Open Spot"
```

The smoke test refuses to send unless `ALLOW_REAL_SMS_SENDS=true`, requires a real E.164 Twilio sender number, and never prints the auth token.
