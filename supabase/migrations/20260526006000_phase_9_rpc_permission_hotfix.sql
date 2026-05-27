-- Phase 9: Additive RPC permission and conflict hotfix.
--
-- Phase 8 may already have been applied in a linked Supabase project, so this
-- migration intentionally re-applies the corrected grants and RPC definitions
-- without changing earlier migration history or touching existing data.

revoke usage on schema private from public, anon, service_role;
grant usage on schema private to authenticated;

revoke all on function private.is_org_member(uuid)
from public, anon, authenticated, service_role;

revoke all on function private.has_org_role(uuid, public.organization_role[])
from public, anon, authenticated, service_role;

grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.has_org_role(uuid, public.organization_role[]) to authenticated;

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
    pg_catalog.nullif(service_interest, '')
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
    pg_catalog.coalesce(preferred_days, '{}'::text[]),
    pg_catalog.coalesce(preferred_time_windows, '{}'::text[]),
    wants_discount,
    pg_catalog.nullif(service_interest, '')
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
      updated_at = pg_catalog.now()
  where id = target_opening_id;

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
