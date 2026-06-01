-- Track public waitlist acquisition variants without exposing organization ids.
-- The 9-argument wrapper preserves older callers; the API now uses the
-- 10-argument version to distinguish public links, QR codes, and kiosk mode.

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
declare
  target_organization_id uuid;
  target_customer_id uuid;
  target_waitlist_entry_id uuid;
  normalized_source text;
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
    'active',
    coalesce(preferred_days, '{}'::text[]),
    coalesce(preferred_time_windows, '{}'::text[]),
    wants_discount,
    nullif(service_interest, ''),
    normalized_source
  )
  returning id into target_waitlist_entry_id;

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
      'consent_status', 'opted_in'
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
    'public_link'
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
