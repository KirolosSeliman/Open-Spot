# Security and Privacy

## Principles

Open Spot stores customer contact data and consent records. The product must treat privacy, tenant isolation, and SMS consent as launch-critical requirements.

Security rules:

- RLS must protect organization-scoped data.
- Server-side authorization must verify organization membership and role.
- Client-side checks are not sufficient.
- Service keys must never be available in browser code.
- SMS provider secrets must never be exposed client-side.
- Imported customers must not be considered opted in unless explicit proof is stored.
- Opted-out customers must never receive cancellation-recovery SMS.

## Tenant Isolation

All business data should be scoped to `organization_id`, including:

- Services
- Customers
- SMS consents
- Waitlist entries
- Import batches
- Openings
- Opening offers
- SMS messages
- Booking requests or recovered bookings
- Organization settings
- Audit logs

RLS policies should restrict rows to authenticated users who belong to the matching organization. Admin/support access must be explicit and auditable.

## Roles

Initial role model:

- `owner`: manages organization, members, settings, billing, imports, openings, and validation.
- `manager`: manages setup and day-to-day operations except ownership transfer and destructive settings.
- `staff`: manages openings, replies, and manual validation, but cannot manage customers, services, or organization settings.
- `platform_admin`: internal support role with tightly controlled access.

Role permissions must be enforced in database policies and server-side application logic.

## Consent Requirements

Consent records must store:

- Consent status.
- Consent source.
- Timestamp.
- Phone number or customer reference.
- Organization context.
- Language/copy version where practical.
- Opt-out source and timestamp when applicable.

Imported rows without reliable consent proof must use `needs_consent`.

## Audit Logging

Audit logs should record:

- Customer import creation and row outcomes.
- Consent status changes.
- STOP opt-outs.
- Opening creation and SMS send attempts.
- Manual booking validation.
- Settings changes.
- Member and role changes.

Audit logs should be append-only in normal business flows.

## Secret Handling

Expected server-side secrets:

- Supabase service role key.
- SMS provider credentials.
- Webhook signing secrets.
- Stripe secrets in later phases.

Expected browser-safe variables:

- Supabase project URL.
- Supabase anon key.

All environment variables must be documented before use.

## Data Minimization

Store only what is needed for waitlist and recovery workflows:

- Customer name.
- Phone number.
- Preferred language.
- Relevant service preferences.
- Consent state and source.
- Message metadata needed for compliance and troubleshooting.

Avoid storing unnecessary notes, sensitive health details, or unrelated CRM data.

## Deletion and Retention

Customer deletion must be designed carefully because consent and opt-out records are compliance-sensitive. A safe approach is to anonymize customer profile fields while preserving consent and audit evidence where legally appropriate.

Hard deletion of opt-out evidence should not be a normal merchant workflow.
