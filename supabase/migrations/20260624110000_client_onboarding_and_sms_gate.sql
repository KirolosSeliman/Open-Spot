-- Client onboarding review workflow and explicit SMS launch gate.
-- Public clients submit through server actions only; raw onboarding tokens are
-- never stored, only SHA-256 hashes.

create table if not exists public.organization_onboarding_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  token_hash text not null,
  token_expires_at timestamptz,
  status text not null default 'not_started',

  business_name text,
  business_type text,
  booking_system text,
  business_address text,
  public_contact_email text,
  public_contact_phone text,

  responsible_name text,
  responsible_role text,
  responsible_email text,
  responsible_phone text,

  services jsonb not null default '[]'::jsonb,
  average_appointment_value_cents integer,
  currency text not null default 'CAD',

  sms_language public.supported_language not null default 'fr',
  sms_tone text not null default 'warm',
  sms_sender_label text,
  sms_quiet_hours_start time not null default time '20:00',
  sms_quiet_hours_end time not null default time '08:00',
  client_notes text,

  consent_statement_accepted boolean not null default false,
  consent_responsible_name text,
  consent_accepted_at timestamptz,

  admin_notes text,
  requested_changes text,
  reviewed_by_platform_admin_id uuid references public.platform_admins(id) on delete set null,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint org_onboarding_org_unique unique (organization_id),
  constraint org_onboarding_token_hash_unique unique (token_hash),
  constraint org_onboarding_token_hash_format check (token_hash ~ '^[a-f0-9]{64}$'),
  constraint org_onboarding_status_check check (
    status in (
      'not_started',
      'in_progress',
      'submitted',
      'changes_requested',
      'ready_for_sms_setup',
      'completed'
    )
  ),
  constraint org_onboarding_currency_check check (char_length(currency) = 3),
  constraint org_onboarding_average_value_check check (
    average_appointment_value_cents is null
    or average_appointment_value_cents >= 0
  ),
  constraint org_onboarding_sms_tone_check check (
    sms_tone in ('warm', 'professional', 'direct')
  ),
  constraint org_onboarding_services_array_check check (jsonb_typeof(services) = 'array'),
  constraint org_onboarding_consent_timestamp_check check (
    consent_statement_accepted = false
    or consent_accepted_at is not null
  )
);

create index if not exists org_onboarding_status_idx
on public.organization_onboarding_submissions (status, updated_at desc);

create index if not exists org_onboarding_token_hash_idx
on public.organization_onboarding_submissions (token_hash);

drop trigger if exists set_organization_onboarding_submissions_updated_at
on public.organization_onboarding_submissions;

create trigger set_organization_onboarding_submissions_updated_at
before update on public.organization_onboarding_submissions
for each row execute function private.set_updated_at();

alter table public.organization_onboarding_submissions enable row level security;

revoke all privileges on table public.organization_onboarding_submissions from anon;
revoke all privileges on table public.organization_onboarding_submissions from public;
grant select, insert, update on public.organization_onboarding_submissions to authenticated;

drop policy if exists "members can read onboarding submissions"
on public.organization_onboarding_submissions;
create policy "members can read onboarding submissions"
on public.organization_onboarding_submissions for select to authenticated
using (private.is_org_member(organization_id));

drop policy if exists "owners and managers can update onboarding submissions"
on public.organization_onboarding_submissions;
create policy "owners and managers can update onboarding submissions"
on public.organization_onboarding_submissions for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));

alter table public.organization_billing_settings
add column if not exists sms_status text not null default 'inactive';

alter table public.organization_billing_settings
drop constraint if exists organization_billing_settings_sms_status_check;

alter table public.organization_billing_settings
add constraint organization_billing_settings_sms_status_check
check (sms_status in ('inactive', 'pending_setup', 'active', 'paused', 'blocked'));

create index if not exists organization_billing_settings_sms_status_idx
on public.organization_billing_settings (organization_id, billing_status, sms_status);
