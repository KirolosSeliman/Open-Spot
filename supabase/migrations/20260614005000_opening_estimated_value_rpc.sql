-- Persist the optional estimated recovered value on newly-created openings.
-- This is additive and keeps the previous RPC signature as a compatibility
-- wrapper so older deployed clients continue to create openings with null value.

create or replace function private.create_opening_with_offers(
  target_organization_id uuid,
  target_service_id uuid,
  opening_title text,
  opening_start_time timestamptz,
  opening_end_time timestamptz,
  opening_offer_label text,
  opening_normal_price_cents integer,
  request_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_opening_id uuid;
  prepared_offer_count integer := 0;
begin
  if request_user_id is null or request_user_id <> auth.uid() then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  if target_organization_id is null then
    raise exception 'Organization is required.'
      using errcode = '22023';
  end if;

  if opening_normal_price_cents is not null and opening_normal_price_cents < 0 then
    raise exception 'Opening estimated value cannot be negative.'
      using errcode = '22023';
  end if;

  if not private.has_org_role(
    target_organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  ) then
    raise exception 'You are not allowed to create openings for this organization.'
      using errcode = '42501';
  end if;

  if pg_catalog.length(pg_catalog.btrim(coalesce(opening_title, ''))) = 0 then
    raise exception 'Opening title is required.'
      using errcode = '22023';
  end if;

  if opening_start_time is null or opening_end_time is null then
    raise exception 'Opening start and end times are required.'
      using errcode = '22023';
  end if;

  if opening_end_time <= opening_start_time then
    raise exception 'End time must be after start time.'
      using errcode = '22023';
  end if;

  if target_service_id is not null and not exists (
    select 1
    from public.services s
    where s.organization_id = target_organization_id
      and s.id = target_service_id
      and s.active = true
  ) then
    raise exception 'Selected service is not available for this organization.'
      using errcode = '23514';
  end if;

  insert into public.openings (
    organization_id,
    service_id,
    title,
    start_time,
    end_time,
    normal_price_cents,
    offer_label,
    status,
    created_by
  )
  values (
    target_organization_id,
    target_service_id,
    pg_catalog.btrim(opening_title),
    opening_start_time,
    opening_end_time,
    opening_normal_price_cents,
    nullif(pg_catalog.btrim(coalesce(opening_offer_label, '')), ''),
    'draft',
    request_user_id
  )
  returning id into target_opening_id;

  with eligible_recipients as (
    select distinct on (we.customer_id)
      we.customer_id
    from public.waitlist_entries we
    join public.customers c
      on c.organization_id = we.organization_id
      and c.id = we.customer_id
      and c.deleted_at is null
    join public.sms_consents sc
      on sc.organization_id = we.organization_id
      and sc.customer_id = we.customer_id
      and sc.status = 'opted_in'
    where we.organization_id = target_organization_id
      and we.status = 'active'
      and c.phone_e164 ~ '^\+[1-9][0-9]{7,14}$'
      and (
        target_service_id is null
        or exists (
          select 1
          from public.waitlist_entry_services wes
          where wes.organization_id = target_organization_id
            and wes.waitlist_entry_id = we.id
            and wes.service_id = target_service_id
        )
        or (
          not exists (
            select 1
            from public.waitlist_entry_services wes
            where wes.organization_id = target_organization_id
              and wes.waitlist_entry_id = we.id
          )
          and (we.service_id is null or we.service_id = target_service_id)
        )
      )
    order by we.customer_id, we.created_at
  ),
  inserted_offers as (
    insert into public.opening_offers (
      organization_id,
      opening_id,
      customer_id,
      status
    )
    select
      target_organization_id,
      target_opening_id,
      eligible_recipients.customer_id,
      'pending'
    from eligible_recipients
    on conflict (opening_id, customer_id) do nothing
    returning id
  )
  select count(*)
  into prepared_offer_count
  from inserted_offers;

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
    request_user_id,
    'opening.created',
    'openings',
    target_opening_id,
    pg_catalog.jsonb_build_object(
      'service_id', target_service_id,
      'normal_price_cents', opening_normal_price_cents,
      'eligible_recipient_count', prepared_offer_count,
      'prepared_offer_count', prepared_offer_count
    )
  );

  return target_opening_id;
end;
$$;

create or replace function private.create_opening_with_offers(
  target_organization_id uuid,
  target_service_id uuid,
  opening_title text,
  opening_start_time timestamptz,
  opening_end_time timestamptz,
  opening_offer_label text,
  request_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.create_opening_with_offers(
    target_organization_id,
    target_service_id,
    opening_title,
    opening_start_time,
    opening_end_time,
    opening_offer_label,
    null,
    request_user_id
  );
end;
$$;

create or replace function public.create_opening_with_offers(
  target_organization_id uuid,
  target_service_id uuid,
  opening_title text,
  opening_start_time timestamptz,
  opening_end_time timestamptz,
  opening_offer_label text,
  opening_normal_price_cents integer
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return private.create_opening_with_offers(
    target_organization_id,
    target_service_id,
    opening_title,
    opening_start_time,
    opening_end_time,
    opening_offer_label,
    opening_normal_price_cents,
    auth.uid()
  );
end;
$$;

create or replace function public.create_opening_with_offers(
  target_organization_id uuid,
  target_service_id uuid,
  opening_title text,
  opening_start_time timestamptz,
  opening_end_time timestamptz,
  opening_offer_label text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return public.create_opening_with_offers(
    target_organization_id,
    target_service_id,
    opening_title,
    opening_start_time,
    opening_end_time,
    opening_offer_label,
    null
  );
end;
$$;

revoke all on function private.create_opening_with_offers(
  uuid,
  uuid,
  text,
  timestamptz,
  timestamptz,
  text,
  integer,
  uuid
) from public, anon, authenticated, service_role;

grant execute on function private.create_opening_with_offers(
  uuid,
  uuid,
  text,
  timestamptz,
  timestamptz,
  text,
  integer,
  uuid
) to authenticated;

revoke all on function private.create_opening_with_offers(
  uuid,
  uuid,
  text,
  timestamptz,
  timestamptz,
  text,
  uuid
) from public, anon, authenticated, service_role;

grant execute on function private.create_opening_with_offers(
  uuid,
  uuid,
  text,
  timestamptz,
  timestamptz,
  text,
  uuid
) to authenticated;

revoke all on function public.create_opening_with_offers(
  uuid,
  uuid,
  text,
  timestamptz,
  timestamptz,
  text,
  integer
) from public, anon, authenticated, service_role;

grant execute on function public.create_opening_with_offers(
  uuid,
  uuid,
  text,
  timestamptz,
  timestamptz,
  text,
  integer
) to authenticated;

revoke all on function public.create_opening_with_offers(
  uuid,
  uuid,
  text,
  timestamptz,
  timestamptz,
  text
) from public, anon, authenticated, service_role;

grant execute on function public.create_opening_with_offers(
  uuid,
  uuid,
  text,
  timestamptz,
  timestamptz,
  text
) to authenticated;
