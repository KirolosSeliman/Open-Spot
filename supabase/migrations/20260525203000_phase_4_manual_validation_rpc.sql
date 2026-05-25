-- Phase 4: Atomic manual validation for one selected opening offer.
-- Intended for server-side calls after membership and role checks.

create or replace function public.validate_opening_offer(
  target_opening_id uuid,
  target_offer_id uuid,
  recovered_value_cents integer,
  commission_cents integer
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  target_organization_id uuid;
  target_customer_id uuid;
  target_booking_request_id uuid;
begin
  select organization_id
  into target_organization_id
  from public.openings
  where id = target_opening_id
  for update;

  if target_organization_id is null then
    raise exception 'Opening not found.';
  end if;

  if exists (
    select 1
    from public.openings
    where id = target_opening_id
      and status = 'filled'
  ) then
    raise exception 'Opening has already been filled.';
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
    raise exception 'Selected offer is not a valid respondent.';
  end if;

  update public.openings
  set status = 'filled',
      updated_at = now()
  where id = target_opening_id;

  update public.opening_offers
  set status = case
      when id = target_offer_id then 'selected'::public.opening_offer_status
      else 'rejected'::public.opening_offer_status
    end,
    updated_at = now()
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
    now()
  )
  returning id into target_booking_request_id;

  if target_booking_request_id is null then
    raise exception 'Opening has already been validated.';
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
    jsonb_build_object(
      'opening_id', target_opening_id,
      'booking_request_id', target_booking_request_id,
      'customer_id', target_customer_id
    )
  );

  return target_booking_request_id;
end;
$$;

revoke all on function public.validate_opening_offer(uuid, uuid, integer, integer)
from public, anon;
grant execute on function public.validate_opening_offer(uuid, uuid, integer, integer)
to authenticated;
