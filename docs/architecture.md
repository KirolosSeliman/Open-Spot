# Architecture

## Current Repository State

The repository currently contains documentation only. There is no application code, `package.json`, database migration directory, or deployment configuration yet.

Because no conflicting stack exists, the proposed MVP stack is:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui or clean custom components
- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- Vercel
- SMS provider abstraction with simulator for local development
- Plivo, Twilio, or Telnyx provider implementation for production
- Stripe in a later billing phase

## Application Boundaries

Open Spot should be built as a merchant dashboard plus a small set of public customer-facing pages and webhook endpoints.

Main surfaces:

- Public marketing and pricing pages.
- Public organization-specific waitlist page.
- Merchant dashboard.
- Admin/support view.
- Auth pages.
- SMS provider webhook routes.
- Internal server-side services for SMS, consent, openings, and reporting.

Customer-facing mobile apps are not part of the MVP.

## Suggested Next.js Structure

```text
app/
  (marketing)/
  (auth)/
  (dashboard)/
  waitlist/[organizationSlug]/
  api/
    sms/
    imports/
components/
lib/
  auth/
  db/
  sms/
  consent/
  openings/
  reporting/
supabase/
  migrations/
  seed.sql
tests/
```

This structure is a proposal for phase 1 and later. It should be adjusted if implementation reveals a better local convention.

## Server-Side Rules

- All organization-scoped reads and writes must be checked server-side.
- RLS must enforce tenant isolation in the database.
- Client-side checks are only UX helpers and are not security boundaries.
- SMS send logic must run server-side.
- Provider credentials must stay server-side only.
- Billing and commission calculations must not trust client input.

## SMS Provider Abstraction

SMS sending should be hidden behind an internal interface so development can use a simulator and production can use a provider.

Expected interface responsibilities:

- Send outbound SMS.
- Normalize provider message IDs.
- Verify inbound webhook authenticity where supported.
- Parse inbound sender, recipient, body, timestamp, and provider metadata.
- Avoid real SMS sends in local tests unless explicitly configured.

Provider choices should remain replaceable until production selection is made.

## Data Flow Summary

```text
Merchant dashboard
-> Server action/API route
-> Supabase Auth session check
-> Postgres with RLS
-> Domain service validates consent and organization scope
-> SMS provider abstraction
-> Simulator or real provider
```

```text
SMS provider inbound webhook
-> Webhook signature verification
-> Inbound message normalization
-> STOP/reply detection
-> Consent or opening response update
-> Audit log
-> Dashboard reflects updated state
```

## Deployment Assumptions

- Vercel hosts the Next.js app.
- Supabase hosts Auth and Postgres.
- SMS provider webhooks call Vercel API routes.
- Production secrets are stored in Vercel environment variables.
- Supabase service role key is never exposed to the browser.

## Risk Controls

- Use database transactions or RPCs for multi-record financial or recovery-booking state changes.
- Keep SMS send creation and message records consistent.
- Record audit logs for imports, consent changes, opt-outs, opening sends, and booking validation.
- Build with simulator-first testing to prevent accidental real SMS sends.
