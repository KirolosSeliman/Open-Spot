-- Admin database foundation for Open Spot platform operations.
-- PLATFORM_ADMIN_EMAILS remains a server-side bootstrap path; this migration
-- does not insert any real admin account.

alter table public.platform_admins
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists email text,
  add column if not exists status text not null default 'active',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists last_seen_at timestamptz;

update public.platform_admins pa
set email = lower(au.email)
from auth.users au
where pa.email is null
  and pa.user_id = au.id;

update public.platform_admins
set email = lower(user_id::text) || '@missing-auth-user.open-spot.local'
where email is null;

update public.platform_admins
set role = case role
  when 'platform_owner' then 'super_admin'
  when 'support' then 'support_admin'
  when 'readonly' then 'analyst'
  else role
end;

update public.platform_admins
set status = case
  when active is false then 'inactive'
  else status
end
where status is null or status = 'active';

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.platform_admins'::regclass
      and conname = 'platform_admins_pkey'
  ) then
    alter table public.platform_admins drop constraint platform_admins_pkey;
  end if;
end $$;

alter table public.platform_admins
  alter column id set not null,
  alter column email set not null,
  alter column user_id drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.platform_admins'::regclass
      and conname = 'platform_admins_pkey'
  ) then
    alter table public.platform_admins
      add constraint platform_admins_pkey primary key (id);
  end if;
end $$;

alter table public.platform_admins
  drop constraint if exists platform_admins_user_id_fkey;

alter table public.platform_admins
  add constraint platform_admins_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

alter table public.platform_admins
  drop constraint if exists platform_admins_role_check,
  add constraint platform_admins_role_check check (
    role in ('super_admin', 'account_admin', 'support_admin', 'analyst')
  );

alter table public.platform_admins
  drop constraint if exists platform_admins_status_check,
  add constraint platform_admins_status_check check (
    status in ('active', 'inactive', 'suspended')
  );

create unique index if not exists platform_admins_email_lower_unique
  on public.platform_admins (lower(email));

create unique index if not exists platform_admins_user_id_unique
  on public.platform_admins (user_id)
  where user_id is not null;

create index if not exists platform_admins_status_idx
  on public.platform_admins (status);

create index if not exists platform_admins_role_idx
  on public.platform_admins (role);

create table if not exists public.platform_admin_organization_access (
  id uuid primary key default gen_random_uuid(),
  platform_admin_id uuid not null references public.platform_admins(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  access_level text not null default 'read_only',
  granted_by uuid references public.platform_admins(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,

  constraint platform_admin_organization_access_level_check check (
    access_level in ('read_only', 'support', 'manager_mode')
  )
);

create unique index if not exists platform_admin_org_access_active_unique
  on public.platform_admin_organization_access (platform_admin_id, organization_id)
  where revoked_at is null;

create index if not exists platform_admin_org_access_admin_idx
  on public.platform_admin_organization_access (platform_admin_id);

create index if not exists platform_admin_org_access_org_idx
  on public.platform_admin_organization_access (organization_id);

create index if not exists platform_admin_org_access_revoked_idx
  on public.platform_admin_organization_access (revoked_at);

create table if not exists public.platform_admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  platform_admin_id uuid references public.platform_admins(id) on delete set null,
  admin_user_id uuid references auth.users(id) on delete set null,
  admin_email text,
  organization_id uuid references public.organizations(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists platform_admin_audit_logs_admin_idx
  on public.platform_admin_audit_logs (platform_admin_id, created_at desc);

create index if not exists platform_admin_audit_logs_org_idx
  on public.platform_admin_audit_logs (organization_id, created_at desc);

create index if not exists platform_admin_audit_logs_action_idx
  on public.platform_admin_audit_logs (action, created_at desc);

create index if not exists platform_admin_audit_logs_created_idx
  on public.platform_admin_audit_logs (created_at desc);

alter table public.platform_admins enable row level security;
alter table public.platform_admin_organization_access enable row level security;
alter table public.platform_admin_audit_logs enable row level security;

drop policy if exists "platform admins can read their own admin row"
on public.platform_admins;

revoke all privileges on table public.platform_admins from anon;
revoke all privileges on table public.platform_admins from authenticated;
revoke all privileges on table public.platform_admins from public;
revoke all privileges on table public.platform_admin_organization_access from anon;
revoke all privileges on table public.platform_admin_organization_access from authenticated;
revoke all privileges on table public.platform_admin_organization_access from public;
revoke all privileges on table public.platform_admin_audit_logs from anon;
revoke all privileges on table public.platform_admin_audit_logs from authenticated;
revoke all privileges on table public.platform_admin_audit_logs from public;

create or replace function public.set_platform_admins_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_platform_admins_updated_at on public.platform_admins;

create trigger set_platform_admins_updated_at
before update on public.platform_admins
for each row
execute function public.set_platform_admins_updated_at();
