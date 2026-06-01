-- Open Spot foundational identity/settings layer.
-- Additive and safe for a live project: preserves existing organizations and memberships.

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_auth_user_unique unique (auth_user_id),
  constraint profiles_email_format check (
    email is null or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  )
);

create table if not exists public.organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  default_language public.supported_language not null default 'fr',
  sms_daily_limit integer not null default 50,
  sms_monthly_limit integer not null default 1000,
  waitlist_public_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_settings_org_unique unique (organization_id),
  constraint organization_settings_sms_daily_limit_check check (sms_daily_limit >= 0),
  constraint organization_settings_sms_monthly_limit_check check (sms_monthly_limit >= 0)
);

alter table public.organization_members
  add column if not exists profile_id uuid references public.profiles(id) on delete cascade,
  add column if not exists status text not null default 'active';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organization_members_status_check'
      and conrelid = 'public.organization_members'::regclass
  ) then
    alter table public.organization_members
      add constraint organization_members_status_check
      check (status in ('active', 'invited', 'disabled'));
  end if;
end $$;

insert into public.profiles (auth_user_id, email)
select distinct om.user_id, u.email
from public.organization_members om
join auth.users u on u.id = om.user_id
on conflict (auth_user_id) do update
set
  email = coalesce(excluded.email, public.profiles.email),
  updated_at = now();

update public.organization_members om
set profile_id = p.id
from public.profiles p
where p.auth_user_id = om.user_id
  and om.profile_id is null;

alter table public.organization_members
  alter column profile_id set not null;

insert into public.organization_settings (
  organization_id,
  default_language
)
select
  o.id,
  o.default_language
from public.organizations o
on conflict (organization_id) do nothing;

create index if not exists profiles_auth_user_idx
  on public.profiles(auth_user_id);

create index if not exists profiles_email_idx
  on public.profiles(email)
  where email is not null;

create unique index if not exists organization_members_org_profile_unique_idx
  on public.organization_members(organization_id, profile_id);

create index if not exists organization_members_profile_idx
  on public.organization_members(profile_id);

create index if not exists organization_members_org_status_idx
  on public.organization_members(organization_id, status);

create index if not exists organization_settings_org_idx
  on public.organization_settings(organization_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

drop trigger if exists set_organization_settings_updated_at on public.organization_settings;
create trigger set_organization_settings_updated_at
before update on public.organization_settings
for each row execute function private.set_updated_at();
