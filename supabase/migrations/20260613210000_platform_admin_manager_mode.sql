-- Platform admin manager mode sessions.
-- Sessions are temporary, audited in platform_admin_audit_logs, and never add
-- the platform admin as a permanent organization member.

create table if not exists public.platform_admin_sessions (
  id uuid primary key default gen_random_uuid(),
  platform_admin_id uuid not null references public.platform_admins(id) on delete cascade,
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  admin_email text not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  acting_role text not null default 'manager',
  reason text not null,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now(),

  constraint platform_admin_sessions_acting_role_check check (
    acting_role = 'manager'
  ),
  constraint platform_admin_sessions_status_check check (
    status in ('active', 'ended', 'expired')
  ),
  constraint platform_admin_sessions_reason_check check (
    length(trim(reason)) >= 3
  )
);

create index if not exists platform_admin_sessions_admin_active_idx
on public.platform_admin_sessions (admin_user_id, status, expires_at)
where ended_at is null;

create index if not exists platform_admin_sessions_platform_admin_idx
on public.platform_admin_sessions (platform_admin_id, started_at desc);

create index if not exists platform_admin_sessions_org_idx
on public.platform_admin_sessions (organization_id, started_at desc);

alter table public.platform_admin_sessions enable row level security;

revoke all privileges on table public.platform_admin_sessions from anon;
revoke all privileges on table public.platform_admin_sessions from authenticated;
revoke all privileges on table public.platform_admin_sessions from public;

create or replace function private.can_access_organization_via_platform_admin_manager_mode(
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admin_sessions s
    join public.platform_admins a
      on a.id = s.platform_admin_id
    left join public.platform_admin_organization_access access
      on access.platform_admin_id = a.id
      and access.organization_id = s.organization_id
      and access.revoked_at is null
    where s.organization_id = target_organization_id
      and s.admin_user_id = (select auth.uid())
      and s.status = 'active'
      and s.ended_at is null
      and s.expires_at > now()
      and s.acting_role = 'manager'
      and a.status = 'active'
      and (
        a.role = 'super_admin'
        or access.access_level = 'manager_mode'
      )
  );
$$;

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
      and om.status = 'active'
  )
  or private.can_access_organization_via_platform_admin_manager_mode(
    target_organization_id
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
      and om.status = 'active'
      and om.role = any(allowed_roles)
  )
  or (
    'manager'::public.organization_role = any(allowed_roles)
    and private.can_access_organization_via_platform_admin_manager_mode(
      target_organization_id
    )
  );
$$;
