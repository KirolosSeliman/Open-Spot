# Data Model Proposal

This document proposes the initial Supabase Postgres model. Phase 2 must turn this into safe migrations and RLS policies.

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
- `default_price_cents`
- `duration_minutes`
- `is_active`

Organization scoping: required `organization_id`.

Privacy/security concerns: service prices may be commercially sensitive.

Indexes:

- `(organization_id, is_active)`

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
- `consent_text_version`
- `consented_at`
- `opted_out_at`
- `metadata`
- `created_at`

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
- `created_by_profile_id`
- `filename`
- `status`
- `total_rows`
- `valid_rows`
- `invalid_rows`
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
- `starts_at`
- `timezone`
- `capacity`
- `status`
- `created_by_profile_id`
- `created_at`

Organization scoping: required `organization_id`.

Privacy/security concerns: openings are operational business data.

Indexes:

- `(organization_id, starts_at)`
- `(organization_id, status)`

RLS expectations:

- Organization members can read.
- Operational roles can create/update.

## opening_offers

Purpose: optional offer or discount attached to an opening.

Key fields:

- `id`
- `organization_id`
- `opening_id`
- `message_body`
- `discount_type`
- `discount_value`
- `created_at`

Organization scoping: required `organization_id`.

Privacy/security concerns: offer content is customer-facing and must be reviewed before send.

Indexes:

- `(organization_id, opening_id)`

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
- `to_phone_e164`
- `from_phone_e164`
- `body`
- `status`
- `sent_at`
- `received_at`
- `metadata`

Organization scoping: required `organization_id`.

Privacy/security concerns: message body may contain personal data. Access must be restricted.

Indexes:

- `(organization_id, customer_id, created_at)`
- `(organization_id, opening_id, received_at)`
- Unique nullable `(provider, provider_message_id)`

RLS expectations:

- Organization members can read operational messages.
- Webhook writes should use server-side privileged logic plus validation.

## booking_requests

Purpose: customer replies and merchant validation state for an opening.

Key fields:

- `id`
- `organization_id`
- `opening_id`
- `customer_id`
- `sms_message_id`
- `status`
- `requested_at`
- `validated_at`
- `validated_by_profile_id`
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
- `actor_profile_id`
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

## organization_settings

Purpose: configurable organization behavior.

Key fields:

- `id`
- `organization_id`
- `default_language`
- `sms_sender_id`
- `commission_rate_bps`
- `commission_cap_cents`
- `sms_daily_limit`
- `created_at`
- `updated_at`

Organization scoping: required `organization_id`.

Privacy/security concerns: billing and SMS settings are sensitive.

Indexes:

- Unique `organization_id`

RLS expectations:

- Owners/admins can read and update.
- Other roles may read selected non-sensitive settings only if needed.
