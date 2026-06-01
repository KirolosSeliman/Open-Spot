-- Harden manual validation so authorization is checked before any mutation.

create or replace function public.validate_opening_offer(
  target_opening_id uuid,
  target_offer_id uuid,
  recovered_value_cents integer,
  commission_cents integer
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_organization_id uuid;
  target_customer_id uuid;
  target_booking_request_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  select organization_id
  into target_organization_id
  from public.openings
  where id = target_opening_id
  for update;

  if target_organization_id is null then
    raise exception 'Opening not found.'
      using errcode = '22023';
  end if;

  if not private.has_org_role(
    target_organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  ) then
    raise exception 'You are not allowed to validate this opening.'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.openings
    where id = target_opening_id
      and status = 'filled'
  ) then
    raise exception 'Opening has already been filled.'
      using errcode = '23505';
  end if;

  select customer_id
  into target_customer_id
  from public.opening_offers
  where id = target_offer_id
    and opening_id = target_opening_id
    and organization_id = target_organization_id
    and status = 'responded'
  for update;

  if target_customer_id is null then
    raise exception 'Selected offer is not a valid respondent.'
      using errcode = '22023';
  end if;

  update public.openings
  set status = 'filled',
      updated_at = pg_catalog.now()
  where id = target_opening_id
    and organization_id = target_organization_id
    and status <> 'filled';

  if not found then
    raise exception 'Opening has already been filled.'
      using errcode = '23505';
  end if;

  update public.opening_offers
  set status = case
      when id = target_offer_id then 'selected'::public.opening_offer_status
      else 'rejected'::public.opening_offer_status
    end,
    updated_at = pg_catalog.now()
  where opening_id = target_opening_id
    and organization_id = target_organization_id
    and status in ('pending', 'sent', 'responded');

  insert into public.booking_requests (
    organization_id,
    opening_id,
    selected_offer_id,
    customer_id,
    status,
    recovered_value_cents,
    platform_commission_cents,
    confirmed_at
  )
  values (
    target_organization_id,
    target_opening_id,
    target_offer_id,
    target_customer_id,
    'confirmed',
    recovered_value_cents,
    commission_cents,
    pg_catalog.now()
  )
  on conflict do nothing
  returning id into target_booking_request_id;

  if target_booking_request_id is null then
    raise exception 'Opening has already been validated.'
      using errcode = '23505';
  end if;

  insert into public.audit_logs (
    organization_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    target_organization_id,
    auth.uid(),
    'opening.offer.validated',
    'opening_offers',
    target_offer_id,
    pg_catalog.jsonb_build_object(
      'opening_id', target_opening_id,
      'booking_request_id', target_booking_request_id,
      'customer_id', target_customer_id
    )
  );

  return target_booking_request_id;
end;
$$;

revoke all on function public.validate_opening_offer(uuid, uuid, integer, integer)
from public, anon, authenticated, service_role;

grant execute on function public.validate_opening_offer(uuid, uuid, integer, integer)
to authenticated;
