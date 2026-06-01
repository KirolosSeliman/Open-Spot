-- Phase 3: Atomic QR waitlist signup path.
-- This function is intended for server-side service-role calls only.

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
declare
  target_organization_id uuid;
  target_customer_id uuid;
  target_waitlist_entry_id uuid;
begin
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
    notes
  )
  values (
    target_organization_id,
    customer_full_name,
    customer_phone_e164,
    customer_preferred_language,
    nullif(service_interest, '')
  )
  on conflict (organization_id, phone_e164)
  do update set
    full_name = excluded.full_name,
    preferred_language = excluded.preferred_language,
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
    'qr_waitlist',
    consent_copy,
    pg_catalog.now()
  )
  on conflict (organization_id, customer_id)
  do update set
    phone_e164 = excluded.phone_e164,
    status = 'opted_in',
    source = 'qr_waitlist',
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
    notes
  )
  values (
    target_organization_id,
    target_customer_id,
    'active',
    coalesce(preferred_days, '{}'::text[]),
    coalesce(preferred_time_windows, '{}'::text[]),
    wants_discount,
    nullif(service_interest, '')
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
      'source', 'qr_waitlist',
      'customer_id', target_customer_id,
      'consent_status', 'opted_in'
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
  text
) from public, anon, authenticated;

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
