-- Per-organization dedicated SMS sender configuration (Twilio multi-tenant).
-- Access is platform-admin only via service role; merchants do not read secrets here.

create table if not exists public.organization_sms_senders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  provider text not null default 'twilio',
  sender_model text not null default 'dedicated_subaccount',
  twilio_subaccount_sid text,
  twilio_subaccount_friendly_name text,
  twilio_subaccount_status text,
  twilio_messaging_service_sid text,
  twilio_phone_number_sid text,
  phone_e164 text,
  sender_status text not null default 'not_started',
  compliance_status text not null default 'not_started',
  consent_strategy text not null default 'explicit_opt_in',
  stop_help_status text not null default 'unknown',
  inbound_webhook_url text,
  status_callback_url text,
  last_synced_at timestamptz,
  last_test_sms_sent_at timestamptz,
  last_inbound_test_at timestamptz,
  last_status_callback_at timestamptz,
  activated_at timestamptz,
  paused_at timestamptz,
  blocked_at timestamptz,
  last_error text,
  provider_payload jsonb not null default '{}'::jsonb,
  created_by_platform_admin_id uuid references public.platform_admins(id) on delete set null,
  updated_by_platform_admin_id uuid references public.platform_admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint organization_sms_senders_provider_check check (provider in ('twilio')),
  constraint organization_sms_senders_sender_model_check check (
    sender_model in ('shared_test', 'dedicated_parent_account', 'dedicated_subaccount')
  ),
  constraint organization_sms_senders_sender_status_check check (
    sender_status in (
      'not_started',
      'connected',
      'number_missing',
      'webhook_missing',
      'compliance_pending',
      'test_required',
      'ready',
      'paused',
      'blocked',
      'released'
    )
  ),
  constraint organization_sms_senders_compliance_status_check check (
    compliance_status in (
      'not_started',
      'not_required',
      'collecting_info',
      'submitted',
      'in_review',
      'approved',
      'rejected',
      'blocked'
    )
  ),
  constraint organization_sms_senders_consent_strategy_check check (
    consent_strategy in (
      'explicit_opt_in',
      'manual_import_with_proof',
      'sms_opt_in',
      'unknown'
    )
  ),
  constraint organization_sms_senders_stop_help_status_check check (
    stop_help_status in ('unknown', 'active', 'inactive', 'error')
  )
);

create unique index if not exists organization_sms_senders_phone_e164_unique_idx
on public.organization_sms_senders (phone_e164)
where phone_e164 is not null;

create unique index if not exists organization_sms_senders_subaccount_sid_unique_idx
on public.organization_sms_senders (twilio_subaccount_sid)
where twilio_subaccount_sid is not null;

create unique index if not exists organization_sms_senders_messaging_service_sid_unique_idx
on public.organization_sms_senders (twilio_messaging_service_sid)
where twilio_messaging_service_sid is not null;

create index if not exists organization_sms_senders_sender_status_idx
on public.organization_sms_senders (sender_status);

create index if not exists organization_sms_senders_phone_e164_idx
on public.organization_sms_senders (phone_e164);

create index if not exists organization_sms_senders_messaging_service_sid_idx
on public.organization_sms_senders (twilio_messaging_service_sid);

drop trigger if exists organization_sms_senders_set_updated_at
on public.organization_sms_senders;

create trigger organization_sms_senders_set_updated_at
before update on public.organization_sms_senders
for each row execute function private.set_updated_at();

alter table public.organization_sms_senders enable row level security;

create policy organization_sms_senders_service_role_all
on public.organization_sms_senders
for all
to service_role
using (true)
with check (true);

revoke all on table public.organization_sms_senders from anon, authenticated;

create table if not exists public.sms_setup_test_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sender_id uuid references public.organization_sms_senders(id) on delete set null,
  test_phone_e164 text not null,
  test_message_body text not null,
  status text not null default 'pending',
  outbound_sms_message_id uuid references public.sms_messages(id) on delete set null,
  inbound_sms_message_id uuid references public.sms_messages(id) on delete set null,
  checks jsonb not null default '{}'::jsonb,
  last_error text,
  created_by_platform_admin_id uuid references public.platform_admins(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,

  constraint sms_setup_test_runs_status_check check (
    status in (
      'pending',
      'sent',
      'delivery_callback_received',
      'inbound_reply_received',
      'stop_verified',
      'passed',
      'failed'
    )
  )
);

create index if not exists sms_setup_test_runs_organization_idx
on public.sms_setup_test_runs (organization_id, created_at desc);

alter table public.sms_setup_test_runs enable row level security;

create policy sms_setup_test_runs_service_role_all
on public.sms_setup_test_runs
for all
to service_role
using (true)
with check (true);

revoke all on table public.sms_setup_test_runs from anon, authenticated;
