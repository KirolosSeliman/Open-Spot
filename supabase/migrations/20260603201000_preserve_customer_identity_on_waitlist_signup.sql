-- Preserve customer identity during public waitlist signups.
-- A duplicate organization + phone signup must never overwrite an existing
-- customer's name/profile, and repeated submissions should reuse the active
-- waitlist entry for the same customer/service.

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
  on conflict (organization_id, phone_e164)
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
