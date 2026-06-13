-- Soft-delete customers while preserving SMS, appointments, openings, consent,
-- and audit history. Active phone uniqueness moves to a partial index so a
-- deleted historical customer does not block a new active client with the same
-- phone number.

alter table public.customers
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists deleted_reason text,
  add column if not exists restored_at timestamptz,
  add column if not exists restored_by_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists deletion_metadata jsonb not null default '{}'::jsonb;

create index if not exists customers_org_deleted_at_idx
on public.customers (organization_id, deleted_at);

create index if not exists customers_deleted_at_idx
on public.customers (deleted_at);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.customers'::regclass
      and conname = 'unique_customer_phone_per_org'
  ) then
    alter table public.customers drop constraint unique_customer_phone_per_org;
  end if;
end;
$$;

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

  select oo.customer_id
  into target_customer_id
  from public.opening_offers oo
  join public.customers c
    on c.organization_id = oo.organization_id
    and c.id = oo.customer_id
    and c.deleted_at is null
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

create unique index if not exists customers_org_phone_active_unique
on public.customers (organization_id, phone_e164)
where deleted_at is null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.sms_consents'::regclass
      and conname = 'sms_consents_phone_unique'
  ) then
    alter table public.sms_consents drop constraint sms_consents_phone_unique;
  end if;
end;
$$;

create index if not exists sms_consents_org_phone_idx
on public.sms_consents (organization_id, phone_e164);

create or replace function public.register_waitlist_signup(
  organization_slug text,
  customer_full_name text,
  customer_phone_e164 text,
  customer_preferred_language public.supported_language,
  service_interest text,
  preferred_days text[],
  preferred_time_windows text[],
  wants_discount boolean,
  consent_accepted boolean,
  consent_copy text,
  signup_source text,
  service_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_organization_id uuid;
  target_customer_id uuid;
  target_waitlist_entry_id uuid;
  normalized_source text;
  selected_service_ids uuid[];
  first_service_id uuid;
  previous_consent_status public.sms_consent_status;
  previous_unsubscribed_at timestamptz;
  existing_customer_name text;
  existing_waitlist_entry_id uuid;
  submitted_name text;
  submitted_preferred_days text[];
  submitted_preferred_time_windows text[];
  submitted_discount_interest boolean;
begin
  submitted_name := pg_catalog.btrim(coalesce(customer_full_name, ''));
  submitted_preferred_days := coalesce(preferred_days, '{}'::text[]);
  submitted_preferred_time_windows := coalesce(preferred_time_windows, '{}'::text[]);
  submitted_discount_interest := coalesce(wants_discount, false);

  if pg_catalog.length(pg_catalog.btrim(coalesce(organization_slug, ''))) = 0 then
    raise exception 'Organization not found.'
      using errcode = '22023';
  end if;

  if pg_catalog.length(submitted_name) = 0 then
    raise exception 'Full name is required.'
      using errcode = '22023';
  end if;

  if customer_phone_e164 is null
    or customer_phone_e164 !~ '^\+[1-9][0-9]{7,14}$'
  then
    raise exception 'Enter a valid phone number.'
      using errcode = '22023';
  end if;

  if consent_accepted is not true then
    raise exception 'SMS consent is required to join the waitlist.'
      using errcode = '22023';
  end if;

  normalized_source := case
    when signup_source in ('public_link', 'qr_code', 'kiosk') then signup_source
    else 'public_link'
  end;

  select o.id
  into target_organization_id
  from public.organizations o
  where o.slug = pg_catalog.btrim(organization_slug)
  limit 1;

  if target_organization_id is null then
    raise exception 'Organization not found.'
      using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct service_id), '{}'::uuid[])
  into selected_service_ids
  from unnest(coalesce(service_ids, '{}'::uuid[])) as selected_service(service_id);

  if exists (
    select 1
    from unnest(selected_service_ids) as selected_service(service_id)
    left join public.services s
      on s.id = selected_service.service_id
      and s.organization_id = target_organization_id
      and s.active = true
    where s.id is null
  ) then
    raise exception 'One or more selected services are unavailable.'
      using errcode = '23514';
  end if;

  first_service_id := selected_service_ids[1];

  insert into public.customers (
    organization_id,
    full_name,
    phone_e164,
    preferred_language,
    notes,
    source
  )
  values (
    target_organization_id,
    submitted_name,
    customer_phone_e164,
    customer_preferred_language,
    nullif(pg_catalog.btrim(coalesce(service_interest, '')), ''),
    normalized_source
  )
  on conflict (organization_id, phone_e164) where deleted_at is null
  do update set
    preferred_language = excluded.preferred_language,
    notes = coalesce(public.customers.notes, excluded.notes),
    updated_at = pg_catalog.now()
  returning id, full_name into target_customer_id, existing_customer_name;

  select sc.status,
    sc.unsubscribed_at
  into previous_consent_status,
    previous_unsubscribed_at
  from public.sms_consents sc
  where sc.organization_id = target_organization_id
    and sc.customer_id = target_customer_id
  limit 1;

  insert into public.sms_consents (
    organization_id,
    customer_id,
    phone_e164,
    status,
    source,
    consent_text,
    consented_at
  )
  values (
    target_organization_id,
    target_customer_id,
    customer_phone_e164,
    'opted_in',
    normalized_source,
    consent_copy,
    pg_catalog.now()
  )
  on conflict (organization_id, customer_id)
  do update set
    phone_e164 = excluded.phone_e164,
    status = 'opted_in',
    source = excluded.source,
    consent_text = excluded.consent_text,
    consented_at = pg_catalog.now(),
    unsubscribed_at = null,
    updated_at = pg_catalog.now();

  select we.id
  into existing_waitlist_entry_id
  from public.waitlist_entries we
  where we.organization_id = target_organization_id
    and we.customer_id = target_customer_id
    and we.status = 'active'
    and (
      (we.service_id is null and first_service_id is null)
      or we.service_id = first_service_id
    )
  order by we.created_at asc
  limit 1;

  if existing_waitlist_entry_id is not null then
    update public.waitlist_entries
    set
      preferred_days = submitted_preferred_days,
      preferred_time_windows = submitted_preferred_time_windows,
      discount_interest = submitted_discount_interest,
      notes = coalesce(
        nullif(pg_catalog.btrim(coalesce(service_interest, '')), ''),
        public.waitlist_entries.notes
      ),
      source = normalized_source,
      updated_at = pg_catalog.now()
    where id = existing_waitlist_entry_id
    returning id into target_waitlist_entry_id;
  else
    insert into public.waitlist_entries (
      organization_id,
      customer_id,
      service_id,
      status,
      preferred_days,
      preferred_time_windows,
      discount_interest,
      notes,
      source
    )
    values (
      target_organization_id,
      target_customer_id,
      first_service_id,
      'active',
      submitted_preferred_days,
      submitted_preferred_time_windows,
      submitted_discount_interest,
      nullif(pg_catalog.btrim(coalesce(service_interest, '')), ''),
      normalized_source
    )
    returning id into target_waitlist_entry_id;
  end if;

  insert into public.waitlist_entry_services (
    organization_id,
    waitlist_entry_id,
    service_id
  )
  select
    target_organization_id,
    target_waitlist_entry_id,
    service_id
  from unnest(selected_service_ids) as selected_service(service_id)
  on conflict (waitlist_entry_id, service_id) do nothing;

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
    null,
    case
      when existing_waitlist_entry_id is null then 'waitlist.signup.created'
      else 'waitlist.signup.updated'
    end,
    'waitlist_entries',
    target_waitlist_entry_id,
    pg_catalog.jsonb_build_object(
      'source', normalized_source,
      'customer_id', target_customer_id,
      'consent_status', 'opted_in',
      'previous_consent_status', previous_consent_status,
      'previous_unsubscribed_at', previous_unsubscribed_at,
      'fresh_consent_recorded', true,
      'service_ids', selected_service_ids,
      'submitted_name_differs',
        existing_customer_name is not null and existing_customer_name <> submitted_name
    )
  );

  return target_waitlist_entry_id;
end;
$$;

revoke all on function public.register_waitlist_signup(
  text,
  text,
  text,
  public.supported_language,
  text,
  text[],
  text[],
  boolean,
  boolean,
  text,
  text,
  uuid[]
) from public, anon, authenticated, service_role;

grant execute on function public.register_waitlist_signup(
  text,
  text,
  text,
  public.supported_language,
  text,
  text[],
  text[],
  boolean,
  boolean,
  text,
  text,
  uuid[]
) to service_role;

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
    null,
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
      'eligible_recipient_count', prepared_offer_count,
      'prepared_offer_count', prepared_offer_count
    )
  );

  return target_opening_id;
end;
$$;
