# Data Model

This document describes the intended Open Spot Supabase model and the current
MVP implementation shape. The source of truth for exact column names remains
`supabase/migrations/*.sql` plus `src/types/database.ts`.

## Current Implementation Status

Implemented or present in the current repo:

- `profiles`, `organizations`, `organization_members`, organization settings,
  and billing settings foundation.
- Organization-scoped `services`, `customers`, `sms_consents`,
  `waitlist_entries`, `waitlist_entry_services`, `import_batches`, `openings`,
  `opening_offers`, `sms_messages`, `booking_requests`, and `audit_logs`.
- Public waitlist signup RPC/server path with explicit SMS consent.
- Real dashboard server actions for services, customers, waitlist entries,
  imports, opening creation, simulated replies, and manual validation RPC calls.
- RLS migrations and anon/public table access revocation migrations.

Still requiring launch verification:

- Apply and verify migrations against the linked Supabase project.
- Confirm RLS behavior with real authenticated users and organization members.
- Verify inbound SMS persistence for STOP/reply handling against a linked
  Supabase project and provider payloads.
- Complete the dedicated outbound send/provider phase before any production SMS.

Planned reminder expansion, not yet implemented in migrations:

- `appointments`
- `scheduled_messages`
- `sms_templates`
- `appointment_events`
- Additional organization automation settings for reminders and
  cancellation-to-recovery behavior.

## organizations

Purpose: merchant business workspace.

Key fields:

- `id`
- `name`
- `slug`
- `default_language`
- `timezone`
- `created_at`
- `updated_at`

Organization scoping: root tenant table.

Privacy/security concerns: slug appears in public waitlist URLs; avoid exposing private business settings publicly.

Indexes:

- Unique `slug`

RLS expectations:

- Members can read their organizations.
- Only owners/admins can update settings.

## profiles

Purpose: app profile linked to Supabase Auth users.

Key fields:

- `id`
- `auth_user_id`
- `full_name`
- `email`
- `created_at`
- `updated_at`

Organization scoping: users can belong to multiple organizations through `organization_members`.

Privacy/security concerns: never expose profiles across organizations unless membership permits it.

Indexes:

- Unique `auth_user_id`
- Unique normalized email if stored separately

RLS expectations:

- Users can read and update their own profile.
- Organization member lookup controls cross-profile visibility.

## organization_members

Purpose: many-to-many relationship between profiles and organizations.

Key fields:

- `id`
- `organization_id`
- `profile_id`
- `role`
- `status`
- `created_at`

Organization scoping: includes `organization_id`.

Privacy/security concerns: role changes are sensitive and must be audited.

Indexes:

- Unique `(organization_id, profile_id)`
- `(profile_id)`
- `(organization_id, role)`

RLS expectations:

- Members can read membership in their organization.
- Owners/admins can manage members according to role rules.

## services

Purpose: merchant services that can be attached to openings and customer preferences.

Key fields:

- `id`
- `organization_id`
- `name`
- `description`
- `normal_price_cents`
- `duration_minutes`
- `active`

Organization scoping: required `organization_id`.

Privacy/security concerns: service prices may be commercially sensitive.

Indexes:

- `(organization_id, active)`

RLS expectations:

- Organization members can read.
- Owners/admins/staff with permission can write.

## customers

Purpose: customer identity and contact details.

Key fields:

- `id`
- `organization_id`
- `full_name`
- `phone_e164`
- `preferred_language`
- `created_at`
- `updated_at`
- `archived_at`

Organization scoping: required `organization_id`.

Privacy/security concerns: phone numbers are personal data and must be tenant-isolated.

Indexes:

- Unique `(organization_id, phone_e164)`
- `(organization_id, archived_at)`

RLS expectations:

- Organization members with appropriate role can read.
- Writes require operational role.

## sms_consents

Purpose: consent history and current SMS eligibility evidence.

Key fields:

- `id`
- `organization_id`
- `customer_id`
- `phone_e164`
- `status`
- `source`
- `consent_text`
- `consented_at`
- `unsubscribed_at`
- `created_at`
- `updated_at`

Organization scoping: required `organization_id`.

Privacy/security concerns: opt-out evidence must be preserved.

Indexes:

- `(organization_id, customer_id, created_at)`
- `(organization_id, phone_e164, created_at)`
- `(organization_id, status)`

RLS expectations:

- Organization members can read as needed.
- Status changes must go through validated server logic where possible.

## waitlist_entries

Purpose: customer interest in services or future openings.

Key fields:

- `id`
- `organization_id`
- `customer_id`
- `service_id`
- `status`
- `source`
- `created_at`
- `updated_at`

Organization scoping: required `organization_id`.

Privacy/security concerns: must not expose entries publicly.

Indexes:

- `(organization_id, service_id, status)`
- `(organization_id, customer_id)`

RLS expectations:

- Organization members can manage.
- Public waitlist insert must be narrowly scoped through safe server logic.

## import_batches

Purpose: track CSV/Excel imports and validation results.

Key fields:

- `id`
- `organization_id`
- `created_by`
- `file_name`
- `total_rows`
- `valid_rows`
- `invalid_rows`
- `duplicate_rows`
- `created_at`

Organization scoping: required `organization_id`.

Privacy/security concerns: avoid storing raw uploaded files unless retention is explicitly required.

Indexes:

- `(organization_id, created_at)`

RLS expectations:

- Organization members with import permission can read.
- Owners/admins can create.

## openings

Purpose: last-minute appointment availability created by merchant.

Key fields:

- `id`
- `organization_id`
- `service_id`
- `start_time`
- `end_time`
- `normal_price_cents`
- `discount_type`
- `discount_value`
- `offer_label`
- `status`
- `expires_at` (nullable legacy/optional field; not used by the current MVP
  opening creation UI)
- `created_by`
- `created_at`
- `updated_at`

Organization scoping: required `organization_id`.

Privacy/security concerns: openings are operational business data.

Indexes:

- `(organization_id, start_time)`
- `(organization_id, status)`

RLS expectations:

- Organization members can read.
- Operational roles can create/update.

## opening_offers

Purpose: recipient-level offer record for a customer prepared or contacted for
an opening.

Key fields:

- `id`
- `organization_id`
- `opening_id`
- `customer_id`
- `status`
- `sent_at`
- `responded_at`
- `response_text`
- `response_rank`
- `created_at`
- `updated_at`

Organization scoping: required `organization_id`.

Privacy/security concerns: offer content is customer-facing and must be reviewed before send.

Indexes:

- `(organization_id, opening_id)`
- Unique `(opening_id, customer_id)`

RLS expectations:

- Same as openings.

## sms_messages

Purpose: inbound and outbound SMS message record.

Key fields:

- `id`
- `organization_id`
- `customer_id`
- `opening_id`
- `direction`
- `provider`
- `provider_message_id`
- `from_number`
- `to_number`
- `body`
- `status`
- `error_code`
- `error_message`
- `status_callback_received_at`
- `delivered_at`
- `failed_at`
- `provider_status_payload`
- `created_at`

Organization scoping: required `organization_id`.

Privacy/security concerns: message body may contain personal data. Access must be restricted.

Indexes:

- `(organization_id, customer_id, created_at)`
- `(organization_id, direction, from_number, created_at)`
- `(provider, provider_message_id, direction)` for Twilio status callbacks.
- `(organization_id, opening_id, direction, created_at)` for opening detail
  delivery history.

RLS expectations:

- Organization members can read operational messages.
- Webhook writes should use server-side privileged logic plus validation.

Delivery status notes:

- `sent` means Twilio sent the message toward the mobile carrier; it does not
  prove customer receipt.
- `delivered` is the only status that confirms delivery.
- `failed` and `undelivered` should preserve provider error code/message when
  Twilio supplies them.
- `status_callback_received_at` indicates the app received a Twilio delivery
  status callback. If it stays null after a send, verify the Twilio callback URL
  and signature configuration.

Production migration verification:

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sms_messages'
  and column_name in (
    'error_code',
    'error_message',
    'status_callback_received_at',
    'delivered_at',
    'failed_at',
    'provider_status_payload'
  )
order by column_name;
```

All listed columns must be present before enabling real Twilio sends.

## booking_requests

Purpose: customer replies and merchant validation state for an opening.

Key fields:

- `id`
- `organization_id`
- `opening_id`
- `customer_id`
- `status`
- `requested_at`
- `selected_offer_id`
- `validated_at`
- `validated_by`
- `recovered_revenue_cents`
- `commission_estimate_cents`

Organization scoping: required `organization_id`.

Privacy/security concerns: recovered revenue is business-sensitive.

Indexes:

- `(organization_id, opening_id, requested_at)`
- `(organization_id, status)`
- Unique partial index for one accepted request per opening if capacity is one

RLS expectations:

- Organization members can read.
- Validation must be role-restricted and transaction-safe.

## audit_logs

Purpose: append-only record of sensitive actions.

Key fields:

- `id`
- `organization_id`
- `actor_user_id`
- `action`
- `entity_type`
- `entity_id`
- `metadata`
- `created_at`

Organization scoping: required where action is tenant-scoped.

Privacy/security concerns: avoid storing full secrets or unnecessary personal data in metadata.

Indexes:

- `(organization_id, created_at)`
- `(organization_id, entity_type, entity_id)`

RLS expectations:

- Owners/admins can read organization audit logs.
- Inserts should be server-controlled.
- Normal app flows should not update or delete audit rows.

## appointments

Purpose: lightweight records for existing merchant appointments that can receive
reminders and confirmation/cancellation replies.

Implemented in `20260529234235_appointment_reminders_foundation.sql`.

Fields:

- `id`
- `organization_id`
- `customer_id`
- `service_id`
- `starts_at`
- `ends_at`
- `timezone`
- `status`: `scheduled`, `confirmed`, `cancelled`, `completed`, `no_show`
- `reminder_status`: `not_scheduled`, `scheduled`, `sent`, `skipped`, `failed`
- `confirmation_status`: `pending`, `confirmed_by_client`,
  `cancelled_by_client`, `no_response`
- `source`: `manual`, `import`, `api`, `appointment_cancellation`
- `notes`
- `created_by_profile_id`
- `created_at`
- `updated_at`

Indexes:

- `(organization_id, starts_at)`
- `(organization_id, status)`
- `(organization_id, customer_id)`

RLS expectations:

- Organization members can read only their appointments.
- Operational roles can create/update.
- Public users cannot read appointments.

## scheduled_messages

Purpose: durable queue for reminder, acknowledgement, and recovery SMS.

Implemented in `20260529234235_appointment_reminders_foundation.sql`.

Fields:

- `id`
- `organization_id`
- `customer_id`
- `appointment_id`
- `opening_id`
- `message_type`
- `channel`
- `scheduled_for`
- `status`: `pending`, `processing`, `sent`, `failed`, `cancelled`, `skipped`
- `template_key`
- `body_snapshot`
- `provider`
- `provider_message_id`
- `sent_at`
- `failed_at`
- `error_message`
- `created_at`
- `updated_at`

Indexes and idempotency:

- `(status, scheduled_for)` for cron selection.
- `(organization_id, appointment_id)`.
- `(organization_id, customer_id)`.
- A unique or partial unique index preventing duplicate pending 24-hour
  reminders for the same appointment/template. The current migration uses
  `scheduled_messages_unique_pending_24h_reminder_idx` for pending/processing
  24-hour reminders.

Send-time rules:

- Re-check current consent before sending.
- Re-check appointment/opening status before sending.
- Mark ineligible rows as `skipped`; do not send.

## sms_templates

Purpose: bilingual default and organization-specific templates.

Implemented in `20260529234235_appointment_reminders_foundation.sql`.
Global defaults are seeded for 24-hour appointment reminders, appointment
confirmation acknowledgements, and appointment cancellation acknowledgements in
French and English.

Fields:

- `id`
- `organization_id` nullable for global defaults.
- `template_key`
- `language`
- `body`
- `is_active`
- `created_at`
- `updated_at`

Indexes:

- `(organization_id, template_key, language)`.
- Unique global defaults by `(template_key, language)` when
  `organization_id is null`.
- Unique organization overrides by `(organization_id, template_key, language)`.

## appointment_events

Purpose: append-only appointment event history.

Implemented in `20260529234235_appointment_reminders_foundation.sql`.

Fields:

- `id`
- `organization_id`
- `appointment_id`
- `actor_profile_id`
- `event_type`
- `metadata`
- `created_at`

Indexes:

- `(organization_id, appointment_id, created_at)`.

RLS expectations:

- Organization members can read according to role.
- Normal app flows append events through controlled server logic.
- Authenticated app users receive select/insert only; update/delete are not
  granted for normal application flows.

## organization_settings

Purpose: configurable organization behavior.

Key fields:

- `id`
- `organization_id`
- `default_language`
- `sms_daily_limit`
- `sms_monthly_limit`
- `waitlist_public_enabled`
- `appointment_reminders_enabled`
- `default_reminder_delay_hours`
- `appointment_confirmation_requests_enabled`
- `client_sms_cancellation_enabled`
- `auto_create_opening_on_sms_cancellation`
- `auto_send_recovery_sms_on_cancellation`
- `unavailable_sms_to_non_selected_enabled`
- `created_at`
- `updated_at`

Organization scoping: required `organization_id`.

Privacy/security concerns: billing and SMS settings are sensitive.

Indexes:

- Unique `organization_id`

RLS expectations:

- Owners/admins can read and update.
- Other roles may read selected non-sensitive settings only if needed.

Implemented reminder settings:

- `appointment_reminders_enabled`
- `default_reminder_delay_hours`, initially `24`
- `appointment_confirmation_requests_enabled`
- `client_sms_cancellation_enabled`
- `auto_create_opening_on_sms_cancellation`, default `false`
- `auto_send_recovery_sms_on_cancellation`, default `false`
- `unavailable_sms_to_non_selected_enabled`, default `false`

Defaults must be conservative. A disabled automation must not schedule or send SMS.
