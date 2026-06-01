# Roadmap

## Phase 0: Product Foundation

Goal: define product scope, architecture, data model, privacy expectations, SMS compliance notes, design direction, and implementation phases.

Output:

- README
- Product requirements
- Architecture notes
- Data model proposal
- Security and privacy notes
- SMS compliance notes
- Design direction
- Roadmap

## Phase 1: Project Setup and Base SaaS

Goal: create a clean Next.js/Supabase-ready SaaS skeleton.

Expected output:

- Next.js App Router project
- TypeScript configuration
- Tailwind CSS
- Base layout
- Navigation shell
- Auth page placeholders
- Dashboard shell
- Environment variable documentation
- Lint/build/test scripts

## Phase 2: Database, Auth, Organizations, and RLS

Goal: build the secure multi-tenant foundation.

Expected output:

- Supabase migration directory
- Organizations
- Profiles and organization members
- Roles
- RLS policies
- Auth helpers
- Seed/dev data that does not use real customer data

## Phase 3: Import, Consent, and Waitlist

Goal: add customer import, consent tracking, and public waitlist signup.

Expected output:

- Customer table and UI
- Import batch tracking
- CSV/Excel parsing
- Consent status handling
- Public QR waitlist page
- Validation for phone and consent inputs

## Phase 4: Openings, SMS, Replies, and Validation

Goal: build the core cancellation recovery engine.

Expected output:

- Opening creation
- Optional offer/discount
- Eligible recipient selection
- SMS simulator
- Provider abstraction
- Inbound reply webhook
- Reply ordering by timestamp
- Manual merchant validation
- Confirmation and unavailable messages
- STOP opt-out handling

## Phase 5: Dashboard, Reports, and Admin

Goal: make the app operationally useful and sellable.

Expected output:

- Merchant dashboard
- Opening status views
- Reply/respondent views
- Recovered revenue reporting
- Basic admin/support screens
- Operational empty, loading, and error states

## Phase 6: Landing, Onboarding, and Legal

Goal: make the product marketable and beta-ready.

Expected output:

- Bilingual landing pages
- Pricing page
- Onboarding flow
- Terms/privacy placeholders requiring legal review
- Consent copy visible to customers

## Phase 7: Billing and Cost Controls

Goal: prepare paid usage without uncontrolled SMS costs.

Expected output:

- Billing-ready data model
- Stripe integration plan or implementation
- SMS spend controls
- Usage tracking
- Commission configuration groundwork

## Phase 8: QA, Security, and Deployment

Goal: prepare beta launch.

Expected output:

- Security review
- RLS review
- Consent review
- SMS safety review
- Deployment documentation
- Manual QA checklist
- Known limitations and beta-readiness verdict

## Appointment Reminder Expansion

This expansion starts after the current cancellation-recovery foundation is
stable. It must be implemented in the prompt-pack order and must not turn Open
Spot into a full booking platform.

### Reminder Phase 01: Audit and Product Scope

Goal: align documentation, product scope, architecture, data model proposal,
roadmap, and SMS compliance rules before implementation.

Gate: docs updated, no migrations or runtime feature work started.

### Reminder Phase 02: Database, RLS, and Tenant Safety

Goal: add `appointments`, `scheduled_messages`, `sms_templates`,
`appointment_events`, conservative automation settings, RLS policies, indexes,
and idempotency constraints.

Gate: migrations are additive, RLS is tenant-safe, and no SMS sending is added.

### Reminder Phase 03: Appointment Domain and UI

Goal: add minimal merchant appointment management and server-side appointment
state transitions.

Gate: merchants can create/view/update/cancel basic appointments without
replacing their booking system.

### Reminder Phase 04: Scheduled Message Cron Engine

Goal: process due scheduled messages through a protected, idempotent cron route.

Gate: simulator-first sending, consent re-checks, appointment status re-checks,
and duplicate-send prevention are implemented.

### Reminder Phase 05: Templates and Inbound Reply Parser

Goal: add bilingual reminder/acknowledgement templates and parser rules for
YES/OUI, NO/NON, STOP/ARRET, and ambiguous CANCEL handling.

Gate: opt-out has highest priority and waitlist replies remain merchant-validated.

### Reminder Phase 06: Cancellation-to-Recovery Workflow

Goal: when configured, turn client SMS cancellations into recoverable openings
without automatically confirming waitlist respondents.

Gate: duplicate openings/messages are prevented and manual validation remains
mandatory.

### Reminder Phase 07: Dashboard Reporting

Goal: show reminder outcomes, cancellation outcomes, manual follow-up queues,
and recovered appointment metrics without double-counting.

Gate: metrics are organization-scoped and recovered revenue is counted only
after merchant validation.

### Reminder Phase 08: Automation Bundles

Goal: productize Essential SMS, Anti No-Show, and Recovery Pro settings/copy
with conservative defaults.

Gate: settings do not overpromise or bypass consent/manual validation.

### Reminder Phase 09: Final Security and QA

Goal: final security, performance, QA, environment, and beta-readiness review.

Gate: no known path sends SMS to opted-out/non-consented customers, duplicates
real sends, leaks tenant data, or auto-confirms recovered bookings.

## Phase Discipline

Do not move to a later phase while the current phase has unresolved critical issues. Later-phase requirements discovered early should be documented instead of implemented out of sequence.
