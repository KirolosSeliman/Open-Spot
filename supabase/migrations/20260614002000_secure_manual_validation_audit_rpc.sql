-- Keep manual validation atomic and auditable while audit_logs remains protected
-- from direct client writes.

create or replace function public.validate_opening_offer(
  target_opening_id uuid,
  target_offer_id uuid,
  recovered_value_cents integer,
  commission_cents integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_organization_id uuid;
  target_customer_id uuid;
  target_booking_request_id uuid;
  input_recovered_value_cents integer := recovered_value_cents;
  input_commission_cents integer := commission_cents;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  select o.organization_id
  into target_organization_id
  from public.openings o
  where o.id = target_opening_id
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
    from public.openings o
    where o.id = target_opening_id
      and o.organization_id = target_organization_id
      and o.status = 'filled'
  ) then
    raise exception 'Opening has already been filled.'
      using errcode = '23505';
  end if;

  if exists (
    select 1
    from public.booking_requests br
    where br.organization_id = target_organization_id
      and br.opening_id = target_opening_id
      and br.status in ('confirmed', 'completed')
  ) then
    raise exception 'Opening has already been validated.'
      using errcode = '23505';
  end if;

  select oo.customer_id
  into target_customer_id
  from public.opening_offers oo
  join public.customers c
    on c.organization_id = oo.organization_id
    and c.id = oo.customer_id
    and c.deleted_at is null
  join public.sms_consents sc
    on sc.organization_id = oo.organization_id
    and sc.customer_id = oo.customer_id
    and sc.status = 'opted_in'
  where oo.id = target_offer_id
    and oo.opening_id = target_opening_id
    and oo.organization_id = target_organization_id
    and oo.status = 'responded'
  for update of oo;

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

  select br.id
  into target_booking_request_id
  from public.booking_requests br
  where organization_id = target_organization_id
    and opening_id = target_opening_id
    and customer_id = target_customer_id
    and status = 'pending_merchant_validation'
  order by created_at asc
  limit 1
  for update;

  if target_booking_request_id is not null then
    update public.booking_requests
    set selected_offer_id = target_offer_id,
        customer_id = target_customer_id,
        status = 'confirmed',
        recovered_value_cents = input_recovered_value_cents,
        platform_commission_cents = input_commission_cents,
        confirmed_at = coalesce(confirmed_at, pg_catalog.now()),
        updated_at = pg_catalog.now()
    where id = target_booking_request_id
      and organization_id = target_organization_id
    returning id into target_booking_request_id;
  end if;

  if target_booking_request_id is null then
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
      input_recovered_value_cents,
      input_commission_cents,
      pg_catalog.now()
    )
    on conflict do nothing
    returning id into target_booking_request_id;
  end if;

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
      'customer_id', target_customer_id,
      'recovered_value_cents', input_recovered_value_cents,
      'platform_commission_cents', input_commission_cents
    )
  );

  return target_booking_request_id;
end;
$$;

revoke all on function public.validate_opening_offer(uuid, uuid, integer, integer)
from public, anon, authenticated, service_role;

grant execute on function public.validate_opening_offer(uuid, uuid, integer, integer)
to authenticated;

revoke insert, update, delete on table public.audit_logs from authenticated;
