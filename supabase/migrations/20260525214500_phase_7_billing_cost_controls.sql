-- Phase 7: Billing-ready records and SMS cost controls.

create table if not exists public.organization_billing_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  billing_status text not null default 'not_configured',
  subscription_status text not null default 'inactive',
  base_plan_amount_cents integer not null default 3499,
  base_plan_currency char(3) not null default 'CAD',
  default_commission_percent numeric(5, 2) not null default 10.00,
  commission_cap_cents integer,
  sms_daily_limit integer not null default 100,
  sms_monthly_limit integer not null default 1000,
  sms_sending_window_start time not null default '09:00',
  sms_sending_window_end time not null default '20:00',
  waitlist_public_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_billing_settings_org_unique unique (organization_id)
);

create table if not exists public.commission_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  booking_request_id uuid not null references public.booking_requests(id) on delete cascade,
  recovered_value_cents integer not null check (recovered_value_cents >= 0),
  discount_amount_cents integer not null default 0 check (discount_amount_cents >= 0),
  commission_percent numeric(5, 2) not null,
  commission_cap_cents integer,
  commission_amount_cents integer not null check (commission_amount_cents >= 0),
  currency char(3) not null default 'CAD',
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint commission_records_booking_unique unique (booking_request_id)
);

create table if not exists public.sms_usage_counters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  usage_date date not null,
  usage_month date not null,
  daily_sent_count integer not null default 0 check (daily_sent_count >= 0),
  monthly_sent_count integer not null default 0 check (monthly_sent_count >= 0),
  provider_cost_cents integer not null default 0 check (provider_cost_cents >= 0),
  currency char(3) not null default 'CAD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sms_usage_counters_org_date_unique unique (organization_id, usage_date)
);

create index if not exists commission_records_org_created_idx on public.commission_records(organization_id, created_at desc);
create index if not exists sms_usage_counters_org_month_idx on public.sms_usage_counters(organization_id, usage_month);

drop trigger if exists set_organization_billing_settings_updated_at on public.organization_billing_settings;
create trigger set_organization_billing_settings_updated_at
before update on public.organization_billing_settings
for each row execute function private.set_updated_at();

drop trigger if exists set_sms_usage_counters_updated_at on public.sms_usage_counters;
create trigger set_sms_usage_counters_updated_at
before update on public.sms_usage_counters
for each row execute function private.set_updated_at();

alter table public.organization_billing_settings enable row level security;
alter table public.commission_records enable row level security;
alter table public.sms_usage_counters enable row level security;

grant select, insert, update on public.organization_billing_settings to authenticated;
grant select, insert, update on public.commission_records to authenticated;
grant select, insert, update on public.sms_usage_counters to authenticated;

create policy "owners and managers can read billing settings"
on public.organization_billing_settings for select to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));

create policy "owners and managers can update billing settings"
on public.organization_billing_settings for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));

create policy "owners and managers can read commission records"
on public.commission_records for select to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));

create policy "owners and managers can read sms usage counters"
on public.sms_usage_counters for select to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));
