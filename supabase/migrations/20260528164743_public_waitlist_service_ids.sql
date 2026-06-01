-- Store structured service interests selected from public waitlist forms.

create or replace function public.register_waitlist_signup(
  organization_slug text,
  customer_full_name text,
  customer_phone_e164 text,
  customer_preferred_language public.supported_language,
  service_interest text,
  preferred_days text[],
  preferred_time_windows text[],
  wants_discount boolean,
  consent_copy text,
  signup_source text,
  service_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_organization_id uuid;
  target_customer_id uuid;
  target_waitlist_entry_id uuid;
  normalized_source text;
  selected_service_ids uuid[];
  first_service_id uuid;
begin
  normalized_source := case
    when signup_source in ('public_link', 'qr_code', 'kiosk') then signup_source
    else 'public_link'
  end;

  select id
  into target_organization_id
  from public.organizations
  where slug = organization_slug;

  if target_organization_id is null then
    raise exception 'Organization not found.';
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
    customer_full_name,
    customer_phone_e164,
    customer_preferred_language,
    nullif(service_interest, ''),
    normalized_source
  )
  on conflict (organization_id, phone_e164)
  do update set
    full_name = excluded.full_name,
    preferred_language = excluded.preferred_language,
    notes = excluded.notes,
    source = excluded.source,
    updated_at = pg_catalog.now()
  returning id into target_customer_id;

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
    source = normalized_source,
    consent_text = excluded.consent_text,
    consented_at = pg_catalog.now(),
    unsubscribed_at = null,
    updated_at = pg_catalog.now();

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
    coalesce(preferred_days, '{}'::text[]),
    coalesce(preferred_time_windows, '{}'::text[]),
    wants_discount,
    nullif(service_interest, ''),
    normalized_source
  )
  returning id into target_waitlist_entry_id;

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
    'waitlist.signup.created',
    'waitlist_entries',
    target_waitlist_entry_id,
    pg_catalog.jsonb_build_object(
      'source', normalized_source,
      'customer_id', target_customer_id,
      'consent_status', 'opted_in',
      'service_ids', selected_service_ids
    )
  );

  return target_waitlist_entry_id;
end;
$$;

create or replace function public.register_waitlist_signup(
  organization_slug text,
  customer_full_name text,
  customer_phone_e164 text,
  customer_preferred_language public.supported_language,
  service_interest text,
  preferred_days text[],
  preferred_time_windows text[],
  wants_discount boolean,
  consent_copy text,
  signup_source text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return public.register_waitlist_signup(
    organization_slug,
    customer_full_name,
    customer_phone_e164,
    customer_preferred_language,
    service_interest,
    preferred_days,
    preferred_time_windows,
    wants_discount,
    consent_copy,
    signup_source,
    '{}'::uuid[]
  );
end;
$$;

create or replace function public.register_waitlist_signup(
  organization_slug text,
  customer_full_name text,
  customer_phone_e164 text,
  customer_preferred_language public.supported_language,
  service_interest text,
  preferred_days text[],
  preferred_time_windows text[],
  wants_discount boolean,
  consent_copy text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return public.register_waitlist_signup(
    organization_slug,
    customer_full_name,
    customer_phone_e164,
    customer_preferred_language,
    service_interest,
    preferred_days,
    preferred_time_windows,
    wants_discount,
    consent_copy,
    'public_link',
    '{}'::uuid[]
  );
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
  text,
  text,
  uuid[]
) to service_role;

revoke all on function public.register_waitlist_signup(
  text,
  text,
  text,
  public.supported_language,
  text,
  text[],
  text[],
  boolean,
  text,
  text
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
  text,
  text
) to service_role;

revoke all on function public.register_waitlist_signup(
  text,
  text,
  text,
  public.supported_language,
  text,
  text[],
  text[],
  boolean,
  text
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
  text
) to service_role;
