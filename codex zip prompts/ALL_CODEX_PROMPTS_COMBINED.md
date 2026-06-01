# All Open Spot Codex Prompts Combined


<!-- FILE: README_RUN_ORDER.md -->

# Open Spot Codex Prompt Pack — Appointment Reminders + SMS Automation Bundle

Use these Markdown prompts in order. They are designed for the Open Spot / 2e Chance RDV repository and for the product goal of adding appointment reminders, confirmation flows, cancellation-to-recovery automation, and SMS automation bundles without turning the product into a full booking platform or generic CRM.

## How to use

1. Start with `00_MASTER_CODEX_OPERATING_PROMPT.md`.
2. Then give Codex Phase 01.
3. Continue phase by phase only after the previous phase passes its explicit completion gate.
4. Do not let Codex skip directly to implementation without first auditing the existing repo, docs, stack, tests, and constraints.
5. Never allow Codex to invent missing APIs, dependencies, tables, routes, or environment variables without documenting why they are needed and adding them safely.

## Phase order

1. `00_MASTER_CODEX_OPERATING_PROMPT.md`
2. `01_PHASE_REPO_AUDIT_AND_PRODUCT_SCOPE.md`
3. `02_PHASE_DATABASE_MODEL_MIGRATIONS_AND_RLS.md`
4. `03_PHASE_APPOINTMENTS_CORE_DOMAIN_AND_UI.md`
5. `04_PHASE_SCHEDULED_MESSAGES_AND_CRON_ENGINE.md`
6. `05_PHASE_SMS_TEMPLATES_AND_INBOUND_REPLY_PARSER.md`
7. `06_PHASE_CANCELLATION_TO_RECOVERY_WORKFLOW.md`
8. `07_PHASE_DASHBOARD_REPORTING_AND_ADMIN_OVERVIEW.md`
9. `08_PHASE_AUTOMATION_BUNDLES_AND_PRODUCTIZATION.md`
10. `09_PHASE_FINAL_SECURITY_QA_DEPLOYMENT_HARDENING.md`

## Product target

The end goal is not to build a generic calendar application. The end goal is to enrich Open Spot into a focused SMS automation product for appointment-based businesses:

- Last-minute cancellation recovery by SMS.
- Appointment reminders 24 hours before the appointment.
- Client confirmation by YES/OUI.
- Client cancellation by NO/NON/ANNULER/CANCEL.
- Automatic conversion of confirmed cancellations into recoverable openings when configured by the merchant.
- Manual merchant validation before any recovered waitlist client is confirmed.
- Bilingual French/English SMS templates and UI.
- Strict consent, opt-out, tenant isolation, audit logs, and server-side SMS execution.

## Non-negotiable product boundaries

- Do not replace Fresha, Square, Booksy, GoRendezvous, Google Calendar, or the merchant's existing booking workflow in the first implementation.
- Do not build a full CRM.
- Do not auto-confirm waitlist recipients after an opening is created.
- Do not send SMS to customers without valid opt-in consent.
- Do not expose Supabase service role keys, SMS provider credentials, secrets, or privileged logic in client-side code.
- Do not trust client-side input for billing, commission, reporting, organization scope, appointment status, or SMS eligibility.

## Required validation commands

Codex must run or explain why it cannot run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If a command is unavailable, failing because of pre-existing unrelated issues, or blocked by missing environment variables, Codex must document that clearly and separate pre-existing issues from issues introduced by the phase.

Are you 100% confident in this strategy? If not, find all possible loopholes, suggest proper fixes, and run this loop until you are factually 100% confident in the new strategy.



<!-- FILE: 00_MASTER_CODEX_OPERATING_PROMPT.md -->

# Master Codex Operating Prompt — Open Spot Appointment Reminder Expansion

You are Codex working on the Open Spot / 2e Chance RDV codebase. Act as a senior software engineer, senior full-stack engineer, senior data analyst, senior product-minded engineer, senior security-minded engineer, and senior QA reviewer.

Your job is to implement the appointment reminder and SMS automation expansion safely, securely, efficiently, and in a way that actually works in the existing repository. You must work one phase at a time. You may automatically continue to the next phase only when the current phase passes all explicit phase gates, all validation commands are clean or honestly documented, and there are no unresolved critical issues in the current phase.

## Core product mission

Open Spot is a focused SaaS for appointment-based local businesses. It helps merchants recover last-minute cancellations by SMS. The new expansion adds appointment reminders and confirmation automation so businesses can reduce manual calls, reduce no-shows, and turn cancellations into recoverable openings.

The enriched product should support:

- 24-hour appointment reminders.
- Optional 2-hour reminders later if the architecture supports it cleanly.
- Client confirmation through YES/OUI/1.
- Client cancellation through NO/NON/CANCEL/ANNULER.
- Automatic creation of a recoverable opening when a confirmed appointment is cancelled, only if the merchant enables that behavior.
- Waitlist SMS recovery flow after a cancellation.
- Manual merchant validation before confirming any waitlist respondent.
- Bilingual French/English UI and SMS copy.
- Tenant isolation, consent protection, STOP/ARRET handling, audit logs, and server-side SMS provider execution.

## Absolute repository rules

Before writing or changing code, inspect the actual repository. Do not rely on assumptions from old docs alone.

You must inspect at minimum:

- `README.md`
- `package.json`
- `tsconfig.json`
- `src/app/**`
- `src/components/**`
- `src/lib/**`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/roadmap.md`
- `docs/sms-compliance-notes.md`
- `supabase/**` if present
- `AGENTS.md` if present

If a file or directory does not exist, state that clearly and adapt the plan. Do not invent existing files.

## Engineering standards

- Keep the implementation minimal, coherent, and aligned with the current architecture.
- Prefer clear domain services over duplicated logic in UI components.
- Keep SMS sending strictly server-side.
- Keep provider credentials and Supabase service role usage server-only.
- Use Supabase Row Level Security for tenant isolation where database tables are added.
- Use transactions or RPCs where a multi-step state change must be atomic.
- Keep idempotency in cron and webhook flows.
- Never send duplicate SMS because a cron route is called twice.
- Never allow one organization to access another organization's appointments, customers, messages, openings, reports, or settings.
- Never treat imported customers as opted in without explicit consent proof.
- Always process STOP/ARRET/UNSUBSCRIBE/CANCEL opt-out intent safely. Note: CANCEL can be ambiguous between appointment cancellation and SMS opt-out depending on context; handle this carefully and document the chosen rules.
- Never auto-confirm a recovered waitlist client. Waitlist recovery must stay merchant-validated.
- Do not add unnecessary dependencies.
- Do not create a full booking platform.
- Do not create a full CRM.
- Do not add AI unless a phase explicitly asks for it.

## Product boundaries

Open Spot must remain a lightweight layer on top of the merchant's current booking workflow. Appointment reminders can be created manually or via CSV import at first. Do not build deep booking platform integrations unless specifically requested in a later phase.

## Required working style

For every phase:

1. Read the relevant existing files.
2. Identify current architecture and constraints.
3. State the exact problem the phase solves.
4. Propose the smallest safe implementation.
5. Implement only what belongs to the current phase.
6. Avoid unrelated refactors.
7. Add or update tests where useful.
8. Run validation commands.
9. Report files changed.
10. Report what was verified.
11. Report what could not be verified.
12. State whether the phase gate is passed.
13. Only then proceed to the next phase if all gates pass.

## Required validation commands

Run these after each phase unless impossible:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If any command fails, do not hide it. Fix failures caused by your work. If failures are pre-existing or caused by missing environment setup, explain precisely.

## Required final response after each phase

Your final response after each phase must include:

- Phase completed.
- Problem solved.
- Solution implemented.
- Files changed.
- Database changes, if any.
- Security controls added or preserved.
- Consent/opt-out controls added or preserved.
- Tests added or updated.
- Validation command results.
- Known limitations.
- Whether the phase gate passed.
- Whether it is safe to continue to the next phase.

## Stop conditions

Stop and ask for human review instead of continuing automatically if:

- RLS or tenant isolation cannot be proven.
- SMS could be sent to opted-out or `needs_consent` customers.
- Cron/webhook logic can duplicate real SMS sends.
- The phase requires a production SMS provider credential that is not available.
- The implementation would require replacing the merchant's booking platform.
- You find conflicting product requirements that cannot be resolved safely.
- Build/typecheck/lint/test failures caused by your changes remain unresolved.

Are you 100% confident in this strategy? If not, find all possible loopholes, suggest proper fixes, and run this loop until you are factually 100% confident in the new strategy.



<!-- FILE: 01_PHASE_REPO_AUDIT_AND_PRODUCT_SCOPE.md -->

# Phase 01 — Repository Audit and Product Scope Alignment

## Role

You are Codex acting as a senior software engineer, senior product engineer, senior data analyst, and senior QA/security reviewer for Open Spot / 2e Chance RDV.

## Phase problem

The product is evolving from only last-minute cancellation recovery into a broader SMS automation layer for appointment businesses. Before implementing anything, the repository documentation, current code, product boundaries, and roadmap must be audited and aligned. Some docs may be stale compared with the actual codebase, so you must verify the repository state directly.

## Phase goal

Create a clear, safe, current implementation plan for appointment reminders and SMS automation bundles without breaking the existing cancellation recovery focus.

## Current target solution

Open Spot should remain focused on:

- Cancellation recovery by SMS.
- 24-hour appointment reminders.
- YES/OUI confirmation.
- NO/NON cancellation.
- Optional conversion of a cancellation into a recoverable opening.
- Manual merchant validation before confirming a waitlist respondent.
- Bilingual French/English UI and SMS templates.
- Strict consent, opt-out, audit, and tenant isolation.

## Required inspection

Inspect these files/directories if present:

- `README.md`
- `package.json`
- `tsconfig.json`
- `src/app/**`
- `src/components/**`
- `src/lib/**`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/roadmap.md`
- `docs/sms-compliance-notes.md`
- `docs/security-and-privacy.md`
- `supabase/**`
- `AGENTS.md` if present

Do not assume any route, table, component, helper, or migration exists without verifying it.

## Tasks

1. Audit the current repository structure.
2. Identify the actual stack from `package.json` and existing source files.
3. Identify stale or contradictory docs.
4. Update product docs to include the appointment reminder expansion.
5. Update architecture docs to include appointment reminders, scheduled messages, cron processing, inbound reply interpretation, and cancellation-to-opening conversion.
6. Update data model docs with proposed new tables before implementing migrations in Phase 02.
7. Update roadmap so reminder automation is sequenced after the existing foundation and before advanced bundles.
8. Update SMS compliance notes to distinguish:
   - transactional appointment reminder messages,
   - cancellation recovery messages,
   - marketing/reactivation messages,
   - STOP/ARRET opt-out messages,
   - ambiguous CANCEL replies.
9. Document that this is not legal advice and that production SMS copy should receive legal/compliance review.
10. Keep Open Spot separate from Vistaire and do not reuse Vistaire positioning, branding, 3D/AR logic, or restaurant-specific concepts.

## Required documentation changes

Add or update documentation for:

- `appointments`
- `scheduled_messages`
- `sms_templates`
- `appointment_events` or equivalent audit/event table if needed
- reminder settings per organization
- default reminder delay, initially 24 hours
- reply handling rules
- cancellation-to-opening flow
- automation bundles
- phase gates and safety expectations

## Safety and security rules

- No production SMS sending in this phase.
- No database migrations in this phase unless the repo already has an established migration workflow and the user explicitly expects this phase to include migration setup. Prefer documentation only for Phase 01.
- Do not remove existing safety rules around consent and manual validation.
- Do not weaken any existing opt-out requirements.
- Do not claim compliance is complete; mark legal review as required before production.

## Efficiency rules

- Do not over-document unrelated features.
- Do not add a full calendar system.
- Do not add booking platform integrations.
- Do not add AI features.
- Keep the scope focused on making the next implementation phases safe and clear.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If docs-only changes do not affect build, still run available checks or explain why a check cannot run.

## Phase completion gate

This phase is complete only when:

- The current repo state has been inspected.
- Stale docs are corrected or explicitly marked as stale.
- The appointment reminder expansion is documented.
- The data model proposal for future implementation is clear.
- The roadmap shows where this expansion fits.
- No code implementation is started prematurely.
- Validation commands pass or failures are documented as unrelated/pre-existing.

## Required final answer

Report:

- Files inspected.
- Files changed.
- Product scope decisions.
- Phase 02 dependencies.
- Validation results.
- Whether it is safe to move to Phase 02.

Are you 100% confident in this strategy? If not, find all possible loopholes, suggest proper fixes, and run this loop until you are factually 100% confident in the new strategy.



<!-- FILE: 02_PHASE_DATABASE_MODEL_MIGRATIONS_AND_RLS.md -->

# Phase 02 — Database Model, Migrations, RLS, and Tenant Safety

## Role

You are Codex acting as a senior backend engineer, senior database engineer, senior data analyst, senior security engineer, and senior QA reviewer.

## Phase problem

Open Spot needs a reliable data foundation for appointment reminders and scheduled SMS automation. The current cancellation recovery model is centered around customers, services, consent, SMS messages, openings, booking requests, and audit logs. The reminder expansion requires appointment records, scheduled messages, templates/settings, and event history while preserving tenant isolation and consent safety.

## Phase goal

Implement the minimum safe database layer for appointment reminders and scheduled messages using Supabase Postgres migrations and Row Level Security.

## Required inspection

Before editing, inspect:

- `supabase/migrations/**` if present
- existing Supabase client/server helpers
- existing auth/session helpers
- existing organization membership logic
- existing tests
- `docs/data-model.md`
- `docs/security-and-privacy.md`
- `docs/sms-compliance-notes.md`
- all existing types or database generated types if present

If no migration system exists, create the smallest conventional Supabase migration structure that matches the repo style.

## Required tables or equivalent structures

Implement these only if they do not already exist. If a similar table exists, extend it carefully instead of duplicating it.

### `appointments`

Purpose: existing appointments that can receive reminders and confirmation requests.

Required fields:

- `id uuid primary key`
- `organization_id uuid not null`
- `customer_id uuid not null`
- `service_id uuid null` depending on existing service relationship
- `starts_at timestamptz not null`
- `ends_at timestamptz null`
- `timezone text not null`
- `status text not null`
- `reminder_status text not null default 'not_scheduled'`
- `confirmation_status text not null default 'pending'`
- `source text not null default 'manual'`
- `notes text null`
- `created_by_profile_id uuid null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Statuses:

- `scheduled`
- `confirmed`
- `cancelled`
- `completed`
- `no_show`

Confirmation statuses:

- `pending`
- `confirmed_by_client`
- `cancelled_by_client`
- `no_response`

### `scheduled_messages`

Purpose: durable queue for SMS reminders and automation messages.

Required fields:

- `id uuid primary key`
- `organization_id uuid not null`
- `customer_id uuid not null`
- `appointment_id uuid null`
- `opening_id uuid null`
- `message_type text not null`
- `channel text not null default 'sms'`
- `scheduled_for timestamptz not null`
- `status text not null default 'pending'`
- `template_key text not null`
- `body_snapshot text null`
- `provider text null`
- `provider_message_id text null`
- `sent_at timestamptz null`
- `failed_at timestamptz null`
- `error_message text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Statuses:

- `pending`
- `processing`
- `sent`
- `failed`
- `cancelled`
- `skipped`

Message types:

- `appointment_reminder_24h`
- `appointment_reminder_2h`
- `appointment_confirmation_request`
- `appointment_confirmed`
- `appointment_cancelled`
- `cancellation_recovery_offer`
- `follow_up_after_visit`
- `winback`

### `sms_templates`

Purpose: configurable bilingual templates, initially with safe defaults.

Required fields:

- `id uuid primary key`
- `organization_id uuid null` for global defaults or org-specific overrides
- `template_key text not null`
- `language text not null`
- `body text not null`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `appointment_events`

Purpose: operational event history for appointment state changes.

Required fields:

- `id uuid primary key`
- `organization_id uuid not null`
- `appointment_id uuid not null`
- `actor_profile_id uuid null`
- `event_type text not null`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

## Required indexes

Add useful indexes for:

- `appointments (organization_id, starts_at)`
- `appointments (organization_id, status)`
- `appointments (organization_id, customer_id)`
- `scheduled_messages (status, scheduled_for)`
- `scheduled_messages (organization_id, appointment_id)`
- `scheduled_messages (organization_id, customer_id)`
- unique or partial idempotency index to prevent duplicate pending 24h reminders for the same appointment and template key
- `sms_templates (organization_id, template_key, language)`
- `appointment_events (organization_id, appointment_id, created_at)`

## Required RLS/security behavior

- Enable RLS for all new tables.
- Organization members can read records only inside their organization.
- Only authorized operational roles can create/update appointments and scheduled messages.
- Public users must not be able to read appointments or scheduled messages.
- Webhooks/cron may require server-side privileged logic, but that must never be exposed to the client.
- `appointment_events` should be append-only from normal application flows.
- Consider using database constraints for allowed statuses if the existing repo style supports it.
- Never allow cross-tenant reads or writes.

## Required helper logic

If the repo already has database types or Supabase helpers, update them consistently. If no generated type workflow exists, add simple local TypeScript types in the appropriate `src/lib` area without inventing a generation pipeline.

## Safety and compliance requirements

- Do not schedule SMS for a customer unless the later sending service will re-check consent at send time.
- Do not rely only on schedule-time consent because consent can change before send time.
- Do not delete opt-out evidence.
- Do not store secrets in tables.
- Do not store unnecessary sensitive SMS content beyond operational need.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If Supabase local migrations can be tested, run the appropriate migration validation command. If the repo has no Supabase CLI setup, document that and validate SQL by review plus TypeScript checks.

## Phase completion gate

This phase is complete only when:

- Required tables or equivalent structures exist in migrations.
- RLS is enabled and policies are added.
- Idempotency for scheduled reminders is addressed.
- Types/helpers are updated where appropriate.
- Documentation matches implementation.
- Validation commands pass or failures are documented clearly.
- No SMS sending implementation is added prematurely.

## Required final answer

Report:

- Migration files changed/created.
- Tables and indexes added.
- RLS policies added.
- Tenant isolation assumptions.
- Idempotency protections.
- Validation results.
- Whether it is safe to move to Phase 03.

Are you 100% confident in this strategy? If not, find all possible loopholes, suggest proper fixes, and run this loop until you are factually 100% confident in the new strategy.



<!-- FILE: 03_PHASE_APPOINTMENTS_CORE_DOMAIN_AND_UI.md -->

# Phase 03 — Appointments Core Domain and Merchant UI

## Role

You are Codex acting as a senior full-stack engineer, senior frontend engineer, senior backend engineer, senior UX-minded product engineer, and senior QA reviewer.

## Phase problem

Open Spot cannot send reliable appointment reminders without a manageable appointment record. Merchants need a simple way to add, view, and update appointments without replacing their current booking system.

## Phase goal

Build the minimum appointment management capability required for reminders:

- Create appointment.
- View upcoming appointments.
- Edit basic appointment details.
- Cancel appointment.
- Mark confirmed/completed/no-show where appropriate.
- Schedule the default 24h reminder when configured.

## Required inspection

Before editing, inspect:

- existing app routes under `src/app/**`
- existing layout and navigation patterns
- existing dashboard/auth/onboarding code if present
- existing Supabase server/client helpers
- existing components and styling conventions
- existing validation utilities
- Phase 02 database changes
- `docs/design-direction.md` if present

Do not invent a dashboard route if one exists with a different convention. Follow current route and component structure.

## UX scope

Create a simple merchant-facing appointments surface. Possible route names, depending on existing conventions:

- `/dashboard/appointments`
- or the existing dashboard route convention if different

The page should support:

- Upcoming appointments list.
- Basic filters: today, tomorrow, next 7 days, status.
- Empty state.
- Loading/error states if the existing app pattern supports them.
- Add appointment form.
- Edit appointment form or detail view.
- Clear status badges.
- Reminder status display.
- Confirmation status display.

## Form fields

Minimum create/edit appointment fields:

- customer
- service
- date
- time
- duration or end time
- timezone from organization/default setting
- notes optional
- send 24h reminder toggle if not controlled globally
- request confirmation toggle if not controlled globally
- auto-create opening if client cancels toggle, preferably from organization settings not per appointment unless the UI already supports per-record settings cleanly

If customer/service selectors do not exist yet, implement a simple safe version that uses existing customer/service data. If those tables/UI are missing, create only the minimal scaffolding needed and document limitations.

## Domain/service layer

Add server-side domain logic such as:

- `createAppointment`
- `updateAppointment`
- `cancelAppointment`
- `markAppointmentConfirmed`
- `markAppointmentCompleted`
- `markAppointmentNoShow`
- `scheduleAppointmentReminderIfNeeded`

Names should follow the repository style. Do not put business-critical state transitions only inside React components.

## Security rules

- All appointment mutations must verify authenticated user and organization membership server-side.
- Never trust organization ID from client without checking membership.
- Do not let a user access another organization's customers, services, or appointments.
- Do not schedule reminders for opted-out customers.
- Still re-check consent at send time in Phase 04/05.
- Do not expose service role keys client-side.
- Do not put SMS provider calls in this phase.

## Efficiency rules

- Keep queries scoped and indexed.
- Avoid fetching all customers/messages if only a subset is needed.
- Avoid complex calendar UI.
- Avoid drag-and-drop scheduling.
- Avoid staff scheduling unless already present.
- Avoid recurring appointments in this phase.

## Tests

Add useful tests for:

- appointment creation validation
- organization scoping helper if testable
- reminder scheduling rule if implemented as pure/domain function
- status transition helper if implemented

Use existing test style. Do not add a new test framework.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Phase completion gate

This phase is complete only when:

- Merchants can manage basic appointments.
- Appointment domain logic is server-side and organization-scoped.
- The UI is simple, bilingual-ready, and consistent with the app.
- The 24h reminder scheduling hook exists but does not send SMS yet.
- Tests or documented manual validation cover the core flow.
- Validation commands pass or failures are documented clearly.

## Required final answer

Report:

- Routes/components added.
- Domain/server actions added.
- Appointment statuses supported.
- Security checks implemented.
- Reminder scheduling behavior prepared.
- Tests and validation results.
- Whether it is safe to move to Phase 04.

Are you 100% confident in this strategy? If not, find all possible loopholes, suggest proper fixes, and run this loop until you are factually 100% confident in the new strategy.



<!-- FILE: 04_PHASE_SCHEDULED_MESSAGES_AND_CRON_ENGINE.md -->

# Phase 04 — Scheduled Messages and Cron Engine

## Role

You are Codex acting as a senior backend engineer, senior infrastructure engineer, senior security engineer, senior performance engineer, and senior QA reviewer.

## Phase problem

Appointment reminders cannot be sent reliably with browser timers, React state, or serverless in-memory timers. Open Spot needs a durable scheduled message queue and an idempotent cron processor that can safely send due messages without duplicates.

## Phase goal

Implement the scheduled message engine for appointment reminder SMS. The engine must be safe, secure, efficient, idempotent, and production-aware while still supporting local simulation.

## Required inspection

Before editing, inspect:

- existing SMS provider abstraction if present
- existing local simulator if present
- existing API route conventions
- existing environment variable documentation
- Vercel/deployment config if present
- existing Supabase server helpers
- `scheduled_messages` migration from Phase 02
- appointment scheduling logic from Phase 03

## Required implementation

Create or update server-side logic for:

- Creating pending scheduled messages.
- Selecting due scheduled messages.
- Claiming messages atomically as `processing`.
- Sending messages through existing SMS abstraction or a local simulator.
- Marking messages as `sent`, `failed`, `skipped`, or `cancelled`.
- Recording provider IDs when available.
- Preventing duplicate sends if the cron route is triggered twice.
- Re-checking appointment status before sending.
- Re-checking customer consent before sending.
- Re-checking organization scope before sending.
- Writing audit logs or appointment events.

## Suggested route

Use the existing route convention. If none exists, add:

```text
src/app/api/cron/send-scheduled-messages/route.ts
```

The route must:

1. Require a server-only `CRON_SECRET` or equivalent protection.
2. Reject unauthorized requests.
3. Process a limited batch size.
4. Avoid long-running uncontrolled loops.
5. Return a clear summary: processed, sent, skipped, failed.
6. Never expose sensitive error details to public callers.

## Suggested Vercel configuration

If the repo uses Vercel and has no cron config, add or update `vercel.json` carefully. Use a reasonable schedule such as every 5 or 10 minutes. Do not create a every-minute cron unless justified.

## Idempotency requirements

The cron engine must prevent duplicate real SMS sends. Use one or more of:

- database transaction / RPC to claim pending messages,
- `status = 'pending'` condition in update query,
- `processing` lock status,
- idempotency key based on scheduled message ID,
- unique provider metadata where available.

A duplicate cron invocation must not send the same pending message twice.

## Consent and compliance requirements

At send time, verify:

- customer exists,
- organization exists,
- appointment still exists if linked,
- appointment is not cancelled/completed/no-show unless message type allows it,
- customer current consent is eligible for the message type,
- customer is not opted out,
- phone number is valid E.164 or passes existing normalization rules,
- template body is available in customer or organization language.

If any check fails, mark the scheduled message as `skipped` with a safe reason. Do not send.

## SMS provider behavior

- Use the existing SMS provider abstraction if present.
- If no abstraction exists, create a minimal one under the current architecture.
- Local/test environment must default to simulator-only.
- Do not require real SMS credentials for tests.
- Do not put Twilio/Plivo/Telnyx credentials in client-side code.
- Do not commit real secrets.

## Efficiency rules

- Process due messages in batches.
- Use indexes from Phase 02.
- Avoid loading unrelated organizations/customers.
- Avoid N+1 queries where easy to prevent, but do not over-engineer prematurely.
- Log concise operational data, not excessive sensitive message content.

## Tests

Add tests for:

- selecting only due pending messages,
- skipping ineligible consent,
- skipping cancelled appointments,
- idempotent claiming behavior if testable,
- simulator send behavior,
- no duplicate send on repeated processing if feasible.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If cron cannot be fully integration-tested without environment variables, provide a manual test checklist and simulator test path.

## Phase completion gate

This phase is complete only when:

- Scheduled messages can be processed by a protected server-side route.
- Local simulator is safe by default.
- Real SMS credentials are not required for tests.
- Duplicate sends are prevented by design.
- Consent and appointment status are re-checked at send time.
- Audit/event logging exists or is clearly integrated.
- Validation commands pass or failures are documented clearly.

## Required final answer

Report:

- Routes/services added.
- Cron protection mechanism.
- Idempotency strategy.
- Consent re-check strategy.
- SMS provider/simulator behavior.
- Tests and validation results.
- Whether it is safe to move to Phase 05.

Are you 100% confident in this strategy? If not, find all possible loopholes, suggest proper fixes, and run this loop until you are factually 100% confident in the new strategy.



<!-- FILE: 05_PHASE_SMS_TEMPLATES_AND_INBOUND_REPLY_PARSER.md -->

# Phase 05 — SMS Templates, Bilingual Copy, and Inbound Reply Parser

## Role

You are Codex acting as a senior backend engineer, senior product engineer, senior SMS compliance-aware engineer, senior localization engineer, and senior QA reviewer.

## Phase problem

Appointment reminders require clear, bilingual SMS templates and reliable interpretation of inbound replies. The system must distinguish confirmation replies, cancellation replies, waitlist recovery replies, and opt-out replies without accidentally confirming bookings or ignoring STOP requests.

## Phase goal

Implement safe bilingual SMS templates and inbound reply parsing for appointment reminders and related automation.

## Required inspection

Before editing, inspect:

- existing SMS copy/templates
- existing inbound webhook route if present
- existing reply parsing logic if present
- existing STOP handling
- existing `sms_messages` logic
- existing booking request logic
- existing customer language fields
- `docs/sms-compliance-notes.md`
- scheduled message engine from Phase 04

## Required template support

Implement template support for at least:

### French appointment reminder

```text
Bonjour {firstName}, rappel de votre rendez-vous chez {businessName} demain à {time} pour {serviceName}. Répondez OUI pour confirmer ou NON pour annuler. STOP pour vous désinscrire.
```

### English appointment reminder

```text
Hi {firstName}, reminder for your appointment at {businessName} tomorrow at {time} for {serviceName}. Reply YES to confirm or NO to cancel. STOP to unsubscribe.
```

### French confirmation acknowledgement

```text
Merci {firstName}, votre rendez-vous chez {businessName} à {time} est confirmé.
```

### English confirmation acknowledgement

```text
Thanks {firstName}, your appointment at {businessName} at {time} is confirmed.
```

### French cancellation acknowledgement

```text
Merci {firstName}, votre annulation a été reçue. Si une autre place se libère, {businessName} pourra vous recontacter selon vos préférences SMS.
```

### English cancellation acknowledgement

```text
Thanks {firstName}, your cancellation has been received. If another spot opens up, {businessName} may contact you based on your SMS preferences.
```

Adapt wording if existing brand voice differs, but keep it simple, honest, and non-misleading.

## Reply parser requirements

The parser must normalize:

- trim whitespace,
- lowercase or uppercase consistently,
- remove simple punctuation where useful,
- support French/English variants,
- avoid relying on accents.

### Global opt-out replies

Must be handled with highest priority:

- `STOP`
- `ARRET`
- `ARRÊT`
- `UNSUBSCRIBE`
- potentially `DESABONNER` / `DÉSABONNER` if added safely

When opt-out is detected:

- record inbound SMS,
- update consent to opted out,
- stop future scheduled messages where appropriate,
- write audit log,
- send legally appropriate opt-out confirmation if the existing compliance strategy supports it.

### Appointment confirmation replies

For messages linked to an appointment reminder:

- `YES`
- `OUI`
- `1`
- `CONFIRM`
- `CONFIRMER`

Result:

- mark appointment confirmation as `confirmed_by_client`,
- mark appointment status as `confirmed` if consistent with existing model,
- record appointment event,
- optionally send confirmation acknowledgement.

### Appointment cancellation replies

For messages linked to an appointment reminder:

- `NO`
- `NON`
- `2` if documented in message copy later,
- `CANCEL`
- `ANNULER`

Result:

- mark appointment status as `cancelled`,
- mark confirmation status as `cancelled_by_client`,
- record appointment event,
- cancel pending reminders for that appointment,
- optionally enqueue cancellation acknowledgement,
- do not automatically confirm a waitlist customer.

Important ambiguity: `CANCEL` can be used as opt-out in some SMS contexts and also as appointment cancellation. If the incoming message is clearly linked to an appointment reminder that told the customer to reply `NO` or `CANCEL` to cancel the appointment, treat it as appointment cancellation. If the context is missing or unclear, prefer safer opt-out handling or mark as needs manual review, and document the rule.

### Waitlist recovery replies

For cancellation-recovery opening offers:

- `YES`
- `OUI`
- `1`

Result:

- create/update booking request,
- order respondents by received timestamp,
- never auto-confirm,
- merchant must manually validate.

## Required webhook behavior

If inbound SMS webhook exists, extend it. If not, create the minimal safe route following current app conventions:

- verify provider signature where provider supports it,
- support simulator inbound messages for local testing,
- normalize message body,
- identify customer by phone and organization/provider phone where possible,
- identify related scheduled message or opening by provider metadata when possible,
- record inbound `sms_messages`,
- run parser,
- execute the correct state transition,
- write audit/event logs,
- return safe provider-compatible response.

## Security rules

- Never trust inbound webhook data without provider verification where available.
- Never expose secrets.
- Never allow inbound messages to mutate another organization.
- Never update appointment/opening state without resolving organization scope.
- Never process STOP after other lower-priority parsing. STOP must win.
- Never auto-confirm recovered waitlist respondents.

## Efficiency rules

- Keep parser mostly pure and testable.
- Avoid duplicate parsing logic in multiple files.
- Avoid repeated DB lookups when one scoped lookup can resolve context.

## Tests

Add parser tests for:

- OUI/YES appointment confirmation,
- NON/NO appointment cancellation,
- STOP/ARRET global opt-out priority,
- ambiguous CANCEL behavior,
- waitlist YES creates request but does not confirm,
- French accented/unaccented handling if implemented.

Add integration-style tests if the repo supports them.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Phase completion gate

This phase is complete only when:

- Bilingual templates exist.
- Inbound parser exists and is tested.
- STOP/ARRET wins over other intent parsing.
- Appointment confirmation/cancellation replies update correct state.
- Waitlist replies remain manually validated.
- Webhook/simulator route is safe or documented if deferred.
- Validation commands pass or failures are documented clearly.

## Required final answer

Report:

- Templates added.
- Parser rules implemented.
- Webhook changes.
- Opt-out protections.
- Ambiguous reply handling.
- Tests and validation results.
- Whether it is safe to move to Phase 06.

Are you 100% confident in this strategy? If not, find all possible loopholes, suggest proper fixes, and run this loop until you are factually 100% confident in the new strategy.



<!-- FILE: 06_PHASE_CANCELLATION_TO_RECOVERY_WORKFLOW.md -->

# Phase 06 — Cancellation-to-Recovery Workflow

## Role

You are Codex acting as a senior product engineer, senior backend engineer, senior workflow engineer, senior data analyst, senior security engineer, and senior QA reviewer.

## Phase problem

The strongest product value comes when a client cancels through a reminder SMS and Open Spot can immediately turn that cancellation into a recoverable opening. However, this must not auto-confirm another client. It must preserve merchant control, consent rules, and existing cancellation recovery logic.

## Phase goal

Connect appointment cancellation replies to the existing opening/waitlist recovery flow safely.

## Target flow

```text
Appointment reminder sent
-> client replies NON/NO/CANCEL/ANNULER
-> appointment becomes cancelled
-> pending reminders are cancelled/skipped
-> if organization setting allows it, create a new opening from the cancelled appointment
-> identify eligible opted-in waitlist customers
-> send cancellation recovery offer via existing SMS abstraction or scheduled message queue
-> collect replies
-> merchant manually validates the recovered booking
-> selected customer receives confirmation
-> non-selected respondents receive unavailable message only if configured
```

## Required inspection

Before editing, inspect:

- existing `openings` logic
- existing `booking_requests` logic
- existing SMS offer creation/sending logic
- existing dashboard respondent UI if present
- existing organization settings
- Phase 03 appointment logic
- Phase 04 scheduled message logic
- Phase 05 reply parser
- existing audit logs

Do not duplicate opening recovery logic if it already exists. Reuse or extend it carefully.

## Required implementation

Add or update a server-side workflow such as:

- `handleAppointmentCancelledByClient`
- `createOpeningFromCancelledAppointment`
- `enqueueRecoveryOfferForOpening`
- `selectEligibleWaitlistRecipients`
- `recordCancellationRecoveryLink`

Use repository naming conventions.

## Data relationship

The new opening created from a cancellation should preserve traceability:

- appointment ID that caused the opening,
- service ID,
- start time,
- timezone,
- source such as `appointment_cancellation`,
- created_by system/automation field if supported,
- audit/event metadata.

If `openings` does not currently have a `source` or `source_appointment_id` field, add a migration only if necessary and safe.

## Organization settings

Add or use a setting like:

- `auto_create_opening_on_sms_cancellation boolean default false`
- `auto_send_recovery_sms_on_cancellation boolean default false`
- `default_recovery_offer_template_key text null`

For safety, default automation should be conservative:

- creating the opening can be automatic if enabled,
- sending recovery SMS should require explicit organization setting and consent checks,
- merchant validation remains mandatory before final confirmation.

## Consent rules

Before sending any recovery offer:

- customer must be opted in,
- customer must not be opted out,
- customer must match service/waitlist eligibility where available,
- organization SMS limits must be respected if implemented,
- message copy must include required identity/reply/opt-out text.

## Manual validation rule

No matter how the opening was created, waitlist responses must not automatically confirm a client. The first YES/OUI respondent is only ranked first. The merchant must manually validate.

## Safety rules

- Do not create duplicate openings for the same cancelled appointment.
- Do not send duplicate recovery SMS if the cancellation webhook is retried.
- Use idempotency or unique constraints where useful.
- Do not create an opening if the appointment was already cancelled before.
- Do not create an opening if the appointment time is already in the past or too close to be useful, unless product rules explicitly allow it.
- Do not create an opening across organizations.
- Do not send to non-consented customers.
- Do not hide errors; record safe operational failures.

## Efficiency rules

- Reuse existing eligible recipient queries.
- Avoid selecting the entire customer database.
- Batch message creation if sending to multiple waitlist customers.
- Avoid expensive ranking logic unless already present.

## Tests

Add tests for:

- cancellation reply creates opening when setting enabled,
- cancellation reply does not create opening when setting disabled,
- duplicate cancellation handling does not create duplicate openings,
- recovery SMS is not sent to opted-out/needs_consent customers,
- waitlist response remains manual validation,
- past appointment cancellation does not create invalid opening unless allowed.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Phase completion gate

This phase is complete only when:

- Client cancellation can trigger a safe opening creation when configured.
- Traceability exists from opening to original appointment.
- Recovery SMS eligibility respects consent and organization scope.
- Duplicate openings/messages are prevented.
- Manual validation is preserved.
- Tests cover the core workflow.
- Validation commands pass or failures are documented clearly.

## Required final answer

Report:

- Workflow services added.
- Settings added.
- Data relationships added.
- Duplicate prevention strategy.
- Consent protections.
- Tests and validation results.
- Whether it is safe to move to Phase 07.

Are you 100% confident in this strategy? If not, find all possible loopholes, suggest proper fixes, and run this loop until you are factually 100% confident in the new strategy.



<!-- FILE: 07_PHASE_DASHBOARD_REPORTING_AND_ADMIN_OVERVIEW.md -->

# Phase 07 — Dashboard, Reporting, and Admin Overview

## Role

You are Codex acting as a senior frontend engineer, senior product engineer, senior data analyst, senior full-stack engineer, senior UX reviewer, and senior QA reviewer.

## Phase problem

Merchants need a simple place to manage reminder outcomes, appointment confirmations, cancellations, and recovered revenue. Without clear dashboard/reporting, the reminder feature is hard to sell and hard to operate.

## Phase goal

Add dashboard and reporting views that show the value of reminder automation and cancellation recovery without building a full analytics platform.

## Required inspection

Before editing, inspect:

- existing dashboard routes/components
- landing page style and component patterns
- existing reporting docs/logic
- existing data model for recovered revenue
- existing admin/support view if present
- appointment/reminder tables from previous phases
- existing localization approach

## Merchant dashboard requirements

Add or update dashboard areas for:

### Appointments overview

- Today.
- Tomorrow.
- Next 7 days.
- Confirmed.
- Pending confirmation.
- Cancelled by SMS.
- No response.
- No-show if supported.

### Reminder status

- Scheduled reminders.
- Sent reminders.
- Failed reminders.
- Skipped reminders.
- Customers who opted out after a reminder.

### Recovery metrics

- Cancellations detected by reminder SMS.
- Openings created from SMS cancellations.
- Recovery alerts sent.
- Replies received.
- Appointments recovered after cancellation.
- Estimated recovered revenue.

### Action lists

- Appointments needing manual follow-up.
- Failed reminder sends.
- Cancellations waiting for merchant action.
- Waitlist respondents waiting for manual validation.

## Admin/support overview

If the product has an admin/support view, add simple operational visibility:

- Organization SMS status.
- Failed scheduled message count.
- Recent webhook/cron failures if logged.
- High-level usage counts.

Do not expose sensitive customer data across tenants. Admin/support access must follow existing permission rules.

## Data analyst requirements

Implement metrics carefully:

- Do not count a recovered booking until merchant validation occurs.
- Separate appointment confirmations from cancellation-recovery confirmations.
- Separate reminder messages from recovery offer messages.
- Separate skipped messages from failed provider sends.
- Avoid double-counting duplicate webhook attempts.
- Use server-side aggregation where appropriate.

## UI/UX rules

- Keep the dashboard simple and mobile-friendly.
- Use clear French/English-ready labels.
- Do not overload the UI with charts before the data is reliable.
- Prefer cards, tables, and status badges.
- Include empty states that explain what to do next.
- Keep the product positioned as SMS automation, not a full booking calendar.

## Security rules

- All report queries must be organization-scoped.
- Do not trust client-side organization IDs.
- Do not leak customer phone numbers in cross-tenant admin views.
- Avoid exposing raw SMS bodies unless necessary and permissioned.

## Efficiency rules

- Use indexed fields.
- Use date ranges.
- Avoid unbounded full-table scans.
- Paginate tables where appropriate.
- Avoid loading all SMS messages just to calculate dashboard counters.

## Tests

Add tests for metric helpers where feasible:

- recovered booking counted only after merchant validation,
- sent vs skipped vs failed counts,
- cancelled-by-SMS count,
- no duplicate counting.

If UI tests are not established, add pure function tests for data aggregation and provide a manual QA checklist.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Phase completion gate

This phase is complete only when:

- Merchants can see appointment reminder outcomes.
- Merchants can see cancellation-to-recovery outcomes.
- Manual validation queue is clear.
- Metrics avoid double-counting and tenant leakage.
- Basic admin/support visibility is added if appropriate.
- UI is simple and consistent.
- Validation commands pass or failures are documented clearly.

## Required final answer

Report:

- Dashboard routes/components changed.
- Metrics implemented.
- Admin/support changes if any.
- Security/tenant isolation checks.
- Tests and validation results.
- Whether it is safe to move to Phase 08.

Are you 100% confident in this strategy? If not, find all possible loopholes, suggest proper fixes, and run this loop until you are factually 100% confident in the new strategy.



<!-- FILE: 08_PHASE_AUTOMATION_BUNDLES_AND_PRODUCTIZATION.md -->

# Phase 08 — Automation Bundles and Productization

## Role

You are Codex acting as a senior product engineer, senior growth engineer, senior UX writer, senior full-stack engineer, senior data analyst, and senior QA reviewer.

## Phase problem

The new reminder system creates a stronger product, but it must be packaged clearly. Merchants should understand the value as a simple bundle: reminders, confirmations, cancellation recovery, and reporting. The UI and copy should support selling the product without overpromising or creating compliance risk.

## Phase goal

Productize appointment reminders and related SMS automations into clear bundles/settings inside the app and marketing surfaces.

## Required inspection

Before editing, inspect:

- landing page copy/components
- pricing/marketing sections
- dashboard settings pages if present
- organization settings model
- SMS templates/settings from previous phases
- design direction docs
- product requirements docs

## Bundle strategy

Support product framing around these bundles without necessarily implementing billing tiers yet:

### Essential SMS

- 24h appointment reminder.
- Client confirmation by YES/OUI.
- Client cancellation by NO/NON.
- STOP/ARRET handling.
- Message history.

### Anti No-Show

- 24h reminder.
- Optional 2h reminder if backend supports it safely.
- Confirmation tracking.
- Non-response list.
- No-show reporting.

### Recovery Pro

- Client cancellation detected by SMS.
- Opening created from cancelled appointment.
- Waitlist recovery SMS.
- Respondents ranked by timestamp.
- Manual merchant validation.
- Recovered revenue reporting.

### Client Reactivation, future/optional

- Winback message for inactive clients.
- Service-specific reactivation.
- Stronger marketing consent requirements.

### Post-Service Follow-Up, future/optional

- Thank-you SMS.
- Review request link.
- Rebooking prompt.
- Stronger consent and review-platform policy considerations.

## Implementation scope

Do not implement all bundles as billing tiers unless the project already has billing. Instead, create product-ready structure:

- organization automation settings,
- UI labels and descriptions,
- marketing copy updates,
- feature toggles if appropriate,
- docs explaining which automations are MVP and which are future.

## Suggested settings

Add or expose settings such as:

- enable appointment reminders
- reminder delay hours, default 24
- request confirmation in reminder
- enable client cancellation by SMS
- auto-create opening on SMS cancellation
- auto-send recovery SMS after cancellation
- enable unavailable SMS to non-selected respondents
- enable post-service follow-up, default false/future
- enable winback messages, default false/future
- daily SMS limit

Default settings must be conservative.

## Marketing copy rules

Use clear, serious CTA language. Avoid wording that implies a free demo if the brand should feel paid/serious. Prefer:

- Planifier un rendez-vous
- Réserver un appel
- Parler à Open Spot
- Book a call

Avoid:

- Demander une démo

## Compliance and trust copy

Marketing and UI copy must not imply:

- guaranteed recovered revenue,
- automatic booking without merchant validation,
- SMS to customers without consent,
- replacement of existing booking platforms,
- legal compliance without review.

Include simple trust points:

- SMS with consent.
- STOP/ARRET support.
- Merchant keeps control.
- No customer app required.
- Works with your current booking workflow.

## UI requirements

Settings page should be simple:

- Automation name.
- What it does.
- Toggle.
- Safe default state.
- Clear warning when an automation sends SMS.
- Preview of SMS copy when possible.

## Data analyst requirements

Add product metrics where useful:

- reminders sent,
- confirmed by SMS,
- cancelled by SMS,
- no response,
- openings created from cancellation,
- recovered appointments,
- estimated recovered revenue.

Do not overbuild analytics.

## Security rules

- Only owners/admins should change automation settings.
- Staff can view settings only if existing roles allow it.
- Settings changes should be audited.
- SMS-sending toggles should not bypass consent checks.

## Efficiency rules

- Do not duplicate template logic.
- Do not add heavy feature flag dependencies.
- Do not implement billing unless existing billing foundation is present and the phase explicitly requires it.

## Tests

Add tests for:

- default settings are conservative,
- disabled automation does not schedule/send SMS,
- settings changes require correct role if authorization testing exists,
- marketing/settings copy does not remove manual validation language.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Phase completion gate

This phase is complete only when:

- The bundle/product framing is clear.
- Settings exist or docs/UI explain future settings accurately.
- Defaults are conservative.
- Copy is bilingual-ready and does not overpromise.
- Manual validation and consent language remain visible.
- Validation commands pass or failures are documented clearly.

## Required final answer

Report:

- Product/settings changes.
- Marketing copy changes.
- Automation toggles added.
- Default behavior.
- Compliance/trust language added.
- Tests and validation results.
- Whether it is safe to move to Phase 09.

Are you 100% confident in this strategy? If not, find all possible loopholes, suggest proper fixes, and run this loop until you are factually 100% confident in the new strategy.



<!-- FILE: 09_PHASE_FINAL_SECURITY_QA_DEPLOYMENT_HARDENING.md -->

# Phase 09 — Final Security, QA, Performance, and Deployment Hardening

## Role

You are Codex acting as a senior security engineer, senior QA engineer, senior infrastructure engineer, senior backend engineer, senior data analyst, and final release reviewer.

## Phase problem

The appointment reminder expansion touches SMS, customer data, cron jobs, webhooks, consent, tenant isolation, and revenue reporting. Before beta or production, the full feature must be hardened and reviewed end-to-end.

## Phase goal

Perform final hardening so the appointment reminders and SMS automation bundle are safe, secure, efficient, testable, and ready for controlled beta usage.

## Required inspection

Inspect all relevant files from previous phases:

- migrations/RLS policies,
- appointment domain logic,
- scheduled message engine,
- cron routes,
- inbound SMS webhooks,
- SMS provider abstraction/simulator,
- templates,
- dashboard/reporting,
- organization settings,
- docs,
- tests,
- environment variable docs,
- deployment config.

## Security review checklist

Verify and fix if needed:

- RLS enabled on all organization-scoped tables.
- Policies prevent cross-organization reads and writes.
- Server-side membership checks exist for mutations.
- Service role key never appears in client-side code.
- SMS provider credentials never appear in client-side code.
- `CRON_SECRET` or equivalent protects cron routes.
- Webhook signature verification exists where provider supports it.
- STOP/ARRET opt-outs are processed with highest priority.
- Current consent is checked at send time.
- Scheduled messages are idempotent.
- Duplicate webhooks do not duplicate state transitions or sends.
- Waitlist clients are never auto-confirmed.
- Audit logs/events exist for sensitive actions.
- Raw sensitive data is not unnecessarily logged.

## QA checklist

Create or update a manual QA checklist covering:

1. Merchant creates appointment.
2. 24h reminder is scheduled.
3. Cron sends reminder through simulator.
4. Client replies OUI/YES.
5. Appointment becomes confirmed.
6. Client replies NON/NO.
7. Appointment becomes cancelled.
8. Cancellation creates opening only if enabled.
9. Recovery SMS sends only to opted-in customers.
10. Waitlist respondent appears in merchant dashboard.
11. Merchant manually validates respondent.
12. Selected customer receives confirmation.
13. Non-selected respondent behavior matches settings.
14. STOP/ARRET opts customer out.
15. Opted-out customer receives no future messages.
16. Cross-tenant access is blocked.
17. Dashboard metrics count correctly.
18. Failed scheduled messages are visible and safe.

## Performance review

Verify and fix if needed:

- scheduled message query uses indexed status/scheduled time,
- dashboard queries use organization and date filters,
- no unbounded customer/SMS scans in normal dashboard views,
- cron batch size is limited,
- webhook route is fast and does not perform unnecessary work,
- expensive reporting is aggregated or scoped.

## Data analyst review

Verify metrics definitions:

- Reminder sent = scheduled message sent with reminder message type.
- Confirmed by SMS = appointment confirmation status changed by inbound reminder reply.
- Cancelled by SMS = appointment cancellation status changed by inbound reminder reply.
- Created opening = opening linked to cancelled appointment.
- Recovered appointment = merchant-validated booking request from an opening.
- Recovered revenue = only counted after merchant validation, not after first reply.

Document these definitions in code comments or docs where appropriate.

## Deployment readiness

Verify and update docs for required environment variables:

- Supabase URL.
- Supabase anon key.
- Supabase service role key server-only, if used.
- SMS provider credentials server-only.
- SMS provider webhook secret/signature config.
- CRON_SECRET.
- App URL/base URL.
- Provider phone number.

Ensure example env files do not contain real secrets.

## Tests

Add missing tests where high-value:

- parser tests,
- consent eligibility tests,
- scheduled message idempotency tests,
- appointment status transition tests,
- recovery flow tests,
- metric helper tests.

Do not add fragile UI tests unless the repo already supports them.

## Required validation

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Also inspect for secrets if practical:

```bash
git diff
```

If available, run any existing Supabase migration validation command. If not available, document that limitation.

## Phase completion gate

This phase is complete only when:

- Critical security risks are fixed or explicitly blocked for human review.
- No known path can send SMS to opted-out or non-consented customers.
- No known path can duplicate real SMS sends from cron/webhook retries.
- Tenant isolation is implemented and reviewed.
- Manual validation remains mandatory for recovered bookings.
- Dashboard metrics are defined and not double-counted.
- Required environment variables are documented.
- Validation commands pass or failures are clearly classified.
- A final beta-readiness verdict is provided.

## Required final answer

Report:

- Final security verdict.
- Final QA verdict.
- Final performance verdict.
- Final data/metrics verdict.
- Files changed.
- Validation results.
- Known risks or unresolved items.
- Whether this is ready for controlled beta.

Are you 100% confident in this strategy? If not, find all possible loopholes, suggest proper fixes, and run this loop until you are factually 100% confident in the new strategy.
