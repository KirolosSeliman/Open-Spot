-- Open Spot foundational RLS and profile helper policies.

create or replace function private.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = (select auth.uid())
  limit 1;
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
  );
$$;

revoke all on function private.current_profile_id() from public, anon, authenticated, service_role;
revoke all on function private.is_org_member(uuid) from public, anon, authenticated, service_role;
revoke all on function private.has_org_role(uuid, public.organization_role[]) from public, anon, authenticated, service_role;
grant usage on schema private to authenticated;
grant execute on function private.current_profile_id() to authenticated;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.has_org_role(uuid, public.organization_role[]) to authenticated;

alter table public.profiles enable row level security;
alter table public.organization_settings enable row level security;

revoke all privileges on table public.profiles from public;
revoke all privileges on table public.profiles from anon;
revoke all privileges on table public.organization_settings from public;
revoke all privileges on table public.organization_settings from anon;

grant select, insert, update on public.profiles to authenticated;
grant select, update on public.organization_settings to authenticated;

drop policy if exists "authenticated users can read own profile" on public.profiles;
create policy "authenticated users can read own profile"
on public.profiles for select to authenticated
using (auth_user_id = (select auth.uid()));

drop policy if exists "authenticated users can insert own profile" on public.profiles;
create policy "authenticated users can insert own profile"
on public.profiles for insert to authenticated
with check (auth_user_id = (select auth.uid()));

drop policy if exists "authenticated users can update own profile" on public.profiles;
create policy "authenticated users can update own profile"
on public.profiles for update to authenticated
using (auth_user_id = (select auth.uid()))
with check (auth_user_id = (select auth.uid()));

drop policy if exists "members can read organization settings" on public.organization_settings;
create policy "members can read organization settings"
on public.organization_settings for select to authenticated
using (private.is_org_member(organization_id));

drop policy if exists "owners and managers can update organization settings" on public.organization_settings;
create policy "owners and managers can update organization settings"
on public.organization_settings for update to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));
