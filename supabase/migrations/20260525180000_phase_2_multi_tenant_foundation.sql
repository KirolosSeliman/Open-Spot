-- Phase 2: Multi-tenant database, auth, and RLS foundation.
-- Supabase CLI was not available locally, so this file follows the standard
-- supabase/migrations naming pattern and must be applied with Supabase tooling.

create extension if not exists pgcrypto;

create schema if not exists private;

do $$
begin
  create type public.organization_role as enum ('owner', 'manager', 'staff');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.supported_language as enum ('en', 'fr');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.sms_consent_status as enum ('opted_in', 'needs_consent', 'opted_out');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.waitlist_status as enum ('active', 'paused', 'booked', 'removed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.discount_type as enum ('none', 'fixed_amount', 'percentage', 'custom');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.opening_status as enum (
    'draft',
    'broadcasting',
    'awaiting_validation',
    'filled',
    'expired',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.opening_offer_status as enum (
    'pending',
    'sent',
    'responded',
    'selected',
    'rejected',
    'expired',
    'invalid'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.booking_request_status as enum (
    'pending_merchant_validation',
    'confirmed',
    'cancelled',
    'completed',
    'no_show'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.sms_direction as enum ('outbound', 'inbound');
exception
  when duplicate_object then null;
end $$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, private, public
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null,
  email text,
  phone text,
  timezone text not null default 'America/Toronto',
  default_language public.supported_language not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_slug_unique unique (slug),
  constraint organizations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null default 'staff',
  created_at timestamptz not null default now(),
  constraint organization_members_org_user_unique unique (organization_id, user_id)
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  normal_price_cents integer check (normal_price_cents is null or normal_price_cents >= 0),
  currency char(3) not null default 'CAD',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) > 0),
  phone_e164 text not null,
  email text,
  preferred_language public.supported_language not null default 'en',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_customer_phone_per_org unique (organization_id, phone_e164),
  constraint customers_phone_e164_format check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$')
);

create table if not exists public.sms_consents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  phone_e164 text not null,
  status public.sms_consent_status not null default 'needs_consent',
  source text not null,
  consent_text text,
  consented_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sms_consents_customer_unique unique (organization_id, customer_id),
  constraint sms_consents_phone_unique unique (organization_id, phone_e164),
  constraint sms_consents_phone_e164_format check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  constraint sms_consents_opted_in_timestamp check (
    status <> 'opted_in' or consented_at is not null
  ),
  constraint sms_consents_opted_out_timestamp check (
    status <> 'opted_out' or unsubscribed_at is not null
  )
);

create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  status public.waitlist_status not null default 'active',
  preferred_days text[] not null default '{}',
  preferred_time_windows text[] not null default '{}',
  discount_interest boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  file_name text not null,
  total_rows integer not null default 0 check (total_rows >= 0),
  valid_rows integer not null default 0 check (valid_rows >= 0),
  invalid_rows integer not null default 0 check (invalid_rows >= 0),
  duplicate_rows integer not null default 0 check (duplicate_rows >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.openings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  title text not null check (length(trim(title)) > 0),
  start_time timestamptz not null,
  end_time timestamptz not null,
  normal_price_cents integer check (normal_price_cents is null or normal_price_cents >= 0),
  discount_type public.discount_type not null default 'none',
  discount_value integer check (discount_value is null or discount_value >= 0),
  offer_label text,
  status public.opening_status not null default 'draft',
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint openings_time_order check (end_time > start_time),
  constraint openings_percentage_discount check (
    discount_type <> 'percentage' or discount_value between 0 and 100
  )
);

create table if not exists public.opening_offers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opening_id uuid not null references public.openings(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  status public.opening_offer_status not null default 'pending',
  sent_at timestamptz,
  responded_at timestamptz,
  response_text text,
  response_rank integer check (response_rank is null or response_rank > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opening_offers_opening_customer_unique unique (opening_id, customer_id)
);

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opening_id uuid not null references public.openings(id) on delete cascade,
  selected_offer_id uuid references public.opening_offers(id) on delete set null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  status public.booking_request_status not null default 'pending_merchant_validation',
  recovered_value_cents integer check (recovered_value_cents is null or recovered_value_cents >= 0),
  platform_commission_cents integer check (
    platform_commission_cents is null or platform_commission_cents >= 0
  ),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists booking_requests_one_confirmed_per_opening
on public.booking_requests(opening_id)
where status in ('confirmed', 'completed');

create table if not exists public.sms_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  opening_id uuid references public.openings(id) on delete set null,
  direction public.sms_direction not null,
  provider text not null,
  provider_message_id text,
  from_number text not null,
  to_number text not null,
  body text not null,
  status text not null,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists organizations_slug_idx on public.organizations(slug);
create index if not exists organization_members_user_idx on public.organization_members(user_id);
create index if not exists organization_members_org_role_idx on public.organization_members(organization_id, role);
create index if not exists services_org_active_idx on public.services(organization_id, active);
create index if not exists customers_org_phone_idx on public.customers(organization_id, phone_e164);
create index if not exists sms_consents_org_status_idx on public.sms_consents(organization_id, status);
create index if not exists waitlist_entries_org_active_idx
  on public.waitlist_entries(organization_id, status)
  where status = 'active';
create index if not exists waitlist_entries_org_service_idx on public.waitlist_entries(organization_id, service_id);
create index if not exists import_batches_org_created_idx on public.import_batches(organization_id, created_at desc);
create index if not exists openings_org_status_idx on public.openings(organization_id, status);
create index if not exists openings_org_start_idx on public.openings(organization_id, start_time);
create index if not exists opening_offers_response_order_idx
  on public.opening_offers(organization_id, opening_id, responded_at)
  where responded_at is not null;
create index if not exists sms_messages_inbound_phone_idx
  on public.sms_messages(organization_id, direction, from_number, created_at desc)
  where direction = 'inbound';
create index if not exists sms_messages_provider_message_idx
  on public.sms_messages(provider, provider_message_id)
  where provider_message_id is not null;
create index if not exists audit_logs_org_created_idx on public.audit_logs(organization_id, created_at desc);

drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at
before update on public.organizations
for each row execute function private.set_updated_at();

drop trigger if exists set_services_updated_at on public.services;
create trigger set_services_updated_at
before update on public.services
for each row execute function private.set_updated_at();

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at
before update on public.customers
for each row execute function private.set_updated_at();

drop trigger if exists set_sms_consents_updated_at on public.sms_consents;
create trigger set_sms_consents_updated_at
before update on public.sms_consents
for each row execute function private.set_updated_at();

drop trigger if exists set_waitlist_entries_updated_at on public.waitlist_entries;
create trigger set_waitlist_entries_updated_at
before update on public.waitlist_entries
for each row execute function private.set_updated_at();

drop trigger if exists set_openings_updated_at on public.openings;
create trigger set_openings_updated_at
before update on public.openings
for each row execute function private.set_updated_at();

drop trigger if exists set_opening_offers_updated_at on public.opening_offers;
create trigger set_opening_offers_updated_at
before update on public.opening_offers
for each row execute function private.set_updated_at();

drop trigger if exists set_booking_requests_updated_at on public.booking_requests;
create trigger set_booking_requests_updated_at
before update on public.booking_requests
for each row execute function private.set_updated_at();

create or replace function private.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_org_role(
  target_organization_id uuid,
  allowed_roles public.organization_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = (select auth.uid())
      and om.role = any(allowed_roles)
  );
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.has_org_role(uuid, public.organization_role[]) to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.services enable row level security;
alter table public.customers enable row level security;
alter table public.sms_consents enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.import_batches enable row level security;
alter table public.openings enable row level security;
alter table public.opening_offers enable row level security;
alter table public.booking_requests enable row level security;
alter table public.sms_messages enable row level security;
alter table public.audit_logs enable row level security;

grant select, insert, update on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;

-- Public waitlist writes must go through a server route using validated input.
-- Do not grant anon table access in this foundation migration.

create policy "members can read organizations"
on public.organizations for select to authenticated
using (private.is_org_member(id));

create policy "owners and managers can update organizations"
on public.organizations for update to authenticated
using (private.has_org_role(id, array['owner', 'manager']::public.organization_role[]))
with check (private.has_org_role(id, array['owner', 'manager']::public.organization_role[]));

create policy "members can read organization members"
on public.organization_members for select to authenticated
using (private.is_org_member(organization_id));

create policy "owners and managers can manage organization members"
on public.organization_members for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));

create policy "owners and managers can update organization members"
on public.organization_members for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));

create policy "members can read services"
on public.services for select to authenticated
using (private.is_org_member(organization_id));

create policy "owners and managers can insert services"
on public.services for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));

create policy "owners and managers can update services"
on public.services for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));

create policy "members can read customers"
on public.customers for select to authenticated
using (private.is_org_member(organization_id));

create policy "owners and managers can insert customers"
on public.customers for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));

create policy "owners and managers can update customers"
on public.customers for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));

create policy "members can read sms consents"
on public.sms_consents for select to authenticated
using (private.is_org_member(organization_id));

create policy "owners and managers can insert sms consents"
on public.sms_consents for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));

create policy "owners and managers can update sms consents"
on public.sms_consents for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));

create policy "members can read waitlist entries"
on public.waitlist_entries for select to authenticated
using (private.is_org_member(organization_id));

create policy "owners and managers can insert waitlist entries"
on public.waitlist_entries for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));

create policy "owners and managers can update waitlist entries"
on public.waitlist_entries for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));

create policy "owners and managers can read import batches"
on public.import_batches for select to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));

create policy "owners and managers can insert import batches"
on public.import_batches for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));

create policy "members can read openings"
on public.openings for select to authenticated
using (private.is_org_member(organization_id));

create policy "operations team can insert openings"
on public.openings for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'manager', 'staff']::public.organization_role[]));

create policy "operations team can update openings"
on public.openings for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager', 'staff']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'manager', 'staff']::public.organization_role[]));

create policy "members can read opening offers"
on public.opening_offers for select to authenticated
using (private.is_org_member(organization_id));

create policy "operations team can insert opening offers"
on public.opening_offers for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'manager', 'staff']::public.organization_role[]));

create policy "operations team can update opening offers"
on public.opening_offers for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager', 'staff']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'manager', 'staff']::public.organization_role[]));

create policy "members can read booking requests"
on public.booking_requests for select to authenticated
using (private.is_org_member(organization_id));

create policy "operations team can insert booking requests"
on public.booking_requests for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'manager', 'staff']::public.organization_role[]));

create policy "operations team can update booking requests"
on public.booking_requests for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager', 'staff']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'manager', 'staff']::public.organization_role[]));

create policy "members can read sms messages"
on public.sms_messages for select to authenticated
using (private.is_org_member(organization_id));

create policy "operations team can insert sms messages"
on public.sms_messages for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'manager', 'staff']::public.organization_role[]));

create policy "operations team can update sms messages"
on public.sms_messages for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager', 'staff']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'manager', 'staff']::public.organization_role[]));

create policy "owners and managers can read audit logs"
on public.audit_logs for select to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));
