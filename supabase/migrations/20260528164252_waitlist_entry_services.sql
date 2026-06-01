-- Additive multi-service interests for waitlist entries.
-- Keeps waitlist_entries.service_id for backward compatibility while making
-- this join table the durable source for multiple selected services.

create table if not exists public.waitlist_entry_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  waitlist_entry_id uuid not null references public.waitlist_entries(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint waitlist_entry_services_entry_service_unique unique (waitlist_entry_id, service_id)
);

create index if not exists waitlist_entry_services_org_service_idx
  on public.waitlist_entry_services(organization_id, service_id);

create index if not exists waitlist_entry_services_entry_idx
  on public.waitlist_entry_services(waitlist_entry_id);

create or replace function private.validate_waitlist_entry_service_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.waitlist_entries we
    join public.services s on s.id = new.service_id
    where we.id = new.waitlist_entry_id
      and we.organization_id = new.organization_id
      and s.organization_id = new.organization_id
  ) then
    raise exception 'Selected service must belong to the same organization as the waitlist entry.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_waitlist_entry_services_scope
on public.waitlist_entry_services;

create trigger validate_waitlist_entry_services_scope
before insert or update on public.waitlist_entry_services
for each row
execute function private.validate_waitlist_entry_service_scope();

insert into public.waitlist_entry_services (
  organization_id,
  waitlist_entry_id,
  service_id
)
select
  we.organization_id,
  we.id,
  we.service_id
from public.waitlist_entries we
join public.services s
  on s.id = we.service_id
  and s.organization_id = we.organization_id
where we.service_id is not null
on conflict (waitlist_entry_id, service_id) do nothing;

alter table public.waitlist_entry_services enable row level security;

grant select, insert, delete on public.waitlist_entry_services to authenticated;

create policy "members can read waitlist entry services"
on public.waitlist_entry_services for select to authenticated
using (private.is_org_member(organization_id));

create policy "owners and managers can insert waitlist entry services"
on public.waitlist_entry_services for insert to authenticated
with check (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));

create policy "owners and managers can delete waitlist entry services"
on public.waitlist_entry_services for delete to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));
