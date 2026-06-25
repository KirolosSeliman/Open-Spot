-- Harden foundational Open Spot tenant security.
--
-- This migration is intentionally non-destructive. It narrows direct client
-- table privileges and replaces overly broad foundational policies without
-- changing existing organization, profile, member, or settings rows.

revoke insert, delete on table public.organizations from authenticated;
revoke insert, update, delete on table public.organization_members from authenticated;
revoke insert, delete on table public.organization_settings from authenticated;
revoke delete on table public.profiles from authenticated;

grant select, update on table public.organizations to authenticated;
grant select on table public.organization_members to authenticated;
grant select, update on table public.organization_settings to authenticated;
grant select, insert, update on table public.profiles to authenticated;

drop policy if exists "members can read organization members" on public.organization_members;
create policy "active members can read active organization members"
on public.organization_members for select to authenticated
using (
  status = 'active'
  and private.is_org_member(organization_id)
);

drop policy if exists "owners and managers can manage organization members"
on public.organization_members;
drop policy if exists "owners and managers can update organization members"
on public.organization_members;

drop policy if exists "members can read organization settings" on public.organization_settings;
drop policy if exists "owners and managers can read organization settings" on public.organization_settings;
create policy "owners and managers can read organization settings"
on public.organization_settings for select to authenticated
using (
  private.has_org_role(
    organization_id,
    array['owner', 'manager']::public.organization_role[]
  )
);

drop policy if exists "owners and managers can update organization settings" on public.organization_settings;
create policy "owners and managers can update organization settings"
on public.organization_settings for update to authenticated
using (
  private.has_org_role(
    organization_id,
    array['owner', 'manager']::public.organization_role[]
  )
)
with check (
  private.has_org_role(
    organization_id,
    array['owner', 'manager']::public.organization_role[]
  )
);
