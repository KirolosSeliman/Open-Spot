# Architecture

## Current Repository State

The repository now contains a working Next.js App Router application, TypeScript configuration, Tailwind styling, Supabase helpers, Supabase migrations, unit tests, public marketing pages, public organization waitlist pages, auth pages, onboarding, and merchant dashboard routes.

The current MVP stack is:

- Next.js App Router
- TypeScript
- Tailwind CSS
- clean custom components
- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- Vercel
- SMS provider abstraction and simulator utilities for a later send phase
- Plivo/Twilio provider stubs fail closed; real sending is not implemented yet
- Stripe in a later billing phase

Appointment reminders and scheduled SMS automation are planned but not yet
implemented in the current runtime. Phase 01 documents the target architecture;
Phase 02 must add the database/RLS foundation before UI or cron code is built.

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
- Future appointment reminder routes and cron endpoints.

Customer-facing mobile apps are not part of the MVP.

## Current Next.js Structure

```text
src/app/
  b/[slug]/waitlist/
  api/
    sms/
    waitlist/
  dashboard/
  sign-in/
  signup/
  onboarding/
src/components/
src/lib/
  dashboard/
  openings/
  organization/
  sms/
  supabase/
  waitlist/
supabase/
  migrations/*.sql
tests/
  unit/
```

Open Spot is now the public product brand. Some internal component names still use
`open-spot-*`; those names match the product direction and do not imply a second
project.

## Foundational Data Model

The Supabase foundation separates authentication identity, tenant membership, and
organization configuration:

- `profiles` maps Supabase Auth users to app-level profile records.
- `organizations` owns merchant workspace data.
- `organization_members` links profiles/users to organizations with role and status.
- `organization_settings` stores tenant-level operational defaults.
- Business tables remain organization-scoped and protected by RLS.

## Server-Side Rules

- All organization-scoped reads and writes must be checked server-side.
- RLS must enforce tenant isolation in the database.
- Client-side checks are only UX helpers and are not security boundaries.
- SMS send logic must run server-side.
- Provider credentials must stay server-side only.
- Billing and commission calculations must not trust client input.

## SMS Provider Abstraction

SMS sending should be hidden behind an internal interface so development can use
a simulator and production can later use a provider. The full outbound send
workflow is intentionally outside the current task and must not send real SMS.

Expected interface responsibilities:

- Send outbound SMS only after the dedicated outbound phase adds the required
  safety gates.
- Normalize provider message IDs.
- Verify inbound webhook authenticity where supported.
- Parse inbound sender, recipient, body, timestamp, and provider metadata.
- Avoid real SMS sends in local tests and production unless explicitly enabled
  by a future provider integration phase.

Provider choices should remain replaceable until production selection is made.
Current Plivo/Twilio implementations fail closed.

## Appointment Reminder Architecture

The reminder expansion should add a thin appointment domain on top of the
merchant's existing booking workflow:

```text
Merchant/import creates appointment
-> Server action verifies membership and role
-> Postgres stores organization-scoped appointment
-> Reminder scheduling creates pending scheduled_messages rows
-> Protected cron route claims due rows idempotently
-> Send-time checks verify current consent and appointment status
-> SMS provider/simulator sends only server-side
-> Inbound webhook updates appointment confirmation/cancellation state
-> Optional configured cancellation-to-opening flow reuses recovery logic
```

Required future components:

- `appointments` for lightweight appointment records.
- `scheduled_messages` as a durable SMS queue.
- `sms_templates` for global and organization-specific bilingual copy.
- `appointment_events` for append-only operational state history.
- Organization automation settings for reminder delay, confirmation requests,
  cancellation handling, and cancellation-to-recovery automation.

Implemented cron foundation:

- `/api/cron/send-scheduled-messages` requires
  `Authorization: Bearer $CRON_SECRET`.
- The route uses the server-only Supabase service role client and never exposes
  privileged keys to browser code.
- Due `scheduled_messages` rows are claimed by changing `pending` to
  `processing` before provider execution.
- Send-time checks verify current consent, E.164 phone format, and appointment
  status before a message can be sent or simulated.
- Ineligible rows are marked `skipped`; provider or template failures are marked
  `failed`.
- The simulator remains the safe default provider. Plivo/Twilio still fail
  closed until the real provider phase.

Inbound parsing must prioritize STOP/ARRET/UNSUBSCRIBE opt-out handling before
appointment or waitlist intent. `CANCEL` is ambiguous: when a message is clearly
linked to an appointment reminder that offered cancellation, it can mean
appointment cancellation; without context, the safer behavior is opt-out or
manual review.

## Data Flow Summary

```text
Merchant dashboard
-> Server action/API route
-> Supabase Auth session check
-> Postgres with RLS
-> Domain service validates consent and organization scope
-> Prepared recipients and generated message preview
-> Dedicated outbound send phase later
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
- Keep appointment reminders as SMS automation, not a full calendar platform.
