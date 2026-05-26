# 2e Chance RDV

2e Chance RDV is a bilingual SMS-first cancellation recovery SaaS for appointment-based local businesses. It helps merchants fill last-minute openings by sending SMS offers to customers who have explicitly opted into a waitlist.

The product is independent from Vistaire. It does not replace the merchant's booking system. Merchants keep using their current calendar, point-of-sale, phone, DM, or booking workflow, while 2e Chance RDV handles waitlist consent, last-minute SMS offers, replies, merchant validation, and recovered revenue reporting.

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

Not included in the MVP:

- Customer mobile apps
- Replacing the merchant's booking platform
- Automatic Square, Fresha, Booksy, or GOrendezvous integrations
- Complex staff scheduling
- Full CRM functionality
- AI features
- Advanced billing automation
- Automatic booking confirmation without merchant validation

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

## Auth And Organization Status

The app includes Supabase email/password sign-up, sign-in, sign-out, and an organization onboarding flow. A signed-in user without an organization is directed to `/onboarding`; creating an organization also creates the current user as `owner`.

Live testing requires `.env.local` with Supabase URL, anon key, and a server-only service role key. Do not commit `.env.local`.
