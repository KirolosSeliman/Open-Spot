-- Allow invited owners to read their own organization_members row during onboarding.
--
-- The foundational hardening migration limited SELECT on organization_members to
-- active rows visible to active org members. Invited owners could not read their
-- own membership, which broke workspace resolution even though the application
-- treats "invited" as a valid workspace status until password activation completes.
--
-- This migration is additive and idempotent. It does not broaden UPDATE privileges
-- or expose invited memberships belonging to other users.

drop policy if exists "organization members can read own active or invited membership"
  on public.organization_members;

create policy "organization members can read own active or invited membership"
on public.organization_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  and status in ('active', 'invited')
);

-- Preserve the existing team directory policy for active members.
drop policy if exists "active members can read active organization members"
  on public.organization_members;

create policy "active members can read active organization members"
on public.organization_members
for select
to authenticated
using (
  status = 'active'
  and private.is_org_member(organization_id)
);
