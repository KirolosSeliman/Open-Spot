-- Admin Phase 5/6/7: diagnostics, compliance reviews, and reversible controls.
-- These tables are platform-admin only and are accessed through server-side
-- service-role loaders/actions after platform admin authorization.

create table if not exists public.platform_sms_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  processing_status text not null,
  organization_id uuid references public.organizations(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  opening_id uuid references public.openings(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  sms_message_id uuid references public.sms_messages(id) on delete set null,
  provider_message_id text,
  from_number text,
  to_number text,
  classification text,
  http_status integer,
  error_code text,
  error_message text,
  body_preview text,
  payload_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint platform_sms_webhook_events_event_type_check check (
    event_type in ('inbound', 'status_callback', 'simulator_inbound')
  ),
  constraint platform_sms_webhook_events_processing_status_check check (
    processing_status in (
      'received_linked',
      'received_unlinked',
      'invalid_signature',
      'status_updated',
      'status_unmatched',
      'storage_unavailable',
      'persistence_failed',
      'ignored',
      'error'
    )
  )
);

create index if not exists platform_sms_webhook_events_created_idx
on public.platform_sms_webhook_events (created_at desc);

create index if not exists platform_sms_webhook_events_org_idx
on public.platform_sms_webhook_events (organization_id, created_at desc);

create index if not exists platform_sms_webhook_events_provider_message_idx
on public.platform_sms_webhook_events (provider, provider_message_id);

create index if not exists platform_sms_webhook_events_status_idx
on public.platform_sms_webhook_events (processing_status, created_at desc);

create index if not exists platform_sms_webhook_events_type_idx
on public.platform_sms_webhook_events (event_type, created_at desc);

create table if not exists public.platform_compliance_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  issue_key text not null,
  issue_type text not null,
  status text not null default 'open',
  severity text not null default 'medium',
  note text,
  reviewed_by_platform_admin_id uuid references public.platform_admins(id) on delete set null,
  reviewed_at timestamptz,
  resolved_at timestamptz,
  dismissed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint platform_compliance_reviews_status_check check (
    status in ('open', 'reviewed', 'resolved', 'dismissed')
  ),
  constraint platform_compliance_reviews_severity_check check (
    severity in ('low', 'medium', 'high')
  )
);

create unique index if not exists platform_compliance_reviews_issue_unique
on public.platform_compliance_reviews (issue_key);

create index if not exists platform_compliance_reviews_org_idx
on public.platform_compliance_reviews (organization_id, created_at desc);

create index if not exists platform_compliance_reviews_status_idx
on public.platform_compliance_reviews (status, created_at desc);

create table if not exists public.platform_organization_admin_controls (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  support_status text not null default 'healthy',
  admin_note text,
  is_internal_test boolean not null default false,
  sms_sending_paused boolean not null default false,
  sms_paused_at timestamptz,
  sms_paused_by_platform_admin_id uuid references public.platform_admins(id) on delete set null,
  sms_pause_reason text,
  sms_resumed_at timestamptz,
  sms_resumed_by_platform_admin_id uuid references public.platform_admins(id) on delete set null,
  disabled_at timestamptz,
  disabled_by_platform_admin_id uuid references public.platform_admins(id) on delete set null,
  disabled_reason text,
  reactivated_at timestamptz,
  reactivated_by_platform_admin_id uuid references public.platform_admins(id) on delete set null,
  last_health_check_at timestamptz,
  last_health_check_status text,
  last_health_check_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint platform_org_admin_controls_support_status_check check (
    support_status in ('healthy', 'needs_setup', 'watchlist', 'blocked', 'disabled')
  ),
  constraint platform_org_admin_controls_health_status_check check (
    last_health_check_status is null
    or last_health_check_status in ('healthy', 'warning', 'blocked', 'unknown')
  )
);

create unique index if not exists platform_org_admin_controls_org_unique
on public.platform_organization_admin_controls (organization_id);

create index if not exists platform_org_admin_controls_support_status_idx
on public.platform_organization_admin_controls (support_status);

create index if not exists platform_org_admin_controls_sms_paused_idx
on public.platform_organization_admin_controls (sms_sending_paused);

create index if not exists platform_org_admin_controls_disabled_idx
on public.platform_organization_admin_controls (disabled_at);

alter table public.platform_sms_webhook_events enable row level security;
alter table public.platform_compliance_reviews enable row level security;
alter table public.platform_organization_admin_controls enable row level security;

revoke all privileges on table public.platform_sms_webhook_events from anon;
revoke all privileges on table public.platform_sms_webhook_events from authenticated;
revoke all privileges on table public.platform_sms_webhook_events from public;
revoke all privileges on table public.platform_compliance_reviews from anon;
revoke all privileges on table public.platform_compliance_reviews from authenticated;
revoke all privileges on table public.platform_compliance_reviews from public;
revoke all privileges on table public.platform_organization_admin_controls from anon;
revoke all privileges on table public.platform_organization_admin_controls from authenticated;
revoke all privileges on table public.platform_organization_admin_controls from public;

create or replace function public.set_platform_admin_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_platform_compliance_reviews_updated_at
on public.platform_compliance_reviews;

create trigger set_platform_compliance_reviews_updated_at
before update on public.platform_compliance_reviews
for each row
execute function public.set_platform_admin_updated_at();

drop trigger if exists set_platform_org_admin_controls_updated_at
on public.platform_organization_admin_controls;

create trigger set_platform_org_admin_controls_updated_at
before update on public.platform_organization_admin_controls
for each row
execute function public.set_platform_admin_updated_at();
