-- Admin-driven conversion of book_call_requests into official client organizations.
-- Additive migration: preserves existing call request rows and links them to new clients.

-- ---------------------------------------------------------------------------
-- book_call_requests: conversion tracking
-- ---------------------------------------------------------------------------

alter table public.book_call_requests
add column if not exists conversion_status text not null default 'not_started',
add column if not exists organization_id uuid references public.organizations(id) on delete set null,
add column if not exists owner_user_id uuid,
add column if not exists conversion_started_at timestamptz,
add column if not exists converted_at timestamptz,
add column if not exists converted_by uuid,
add column if not exists invitation_status text,
add column if not exists invited_at timestamptz,
add column if not exists last_invitation_attempt_at timestamptz,
add column if not exists conversion_error_code text,
add column if not exists conversion_error_message text;

alter table public.book_call_requests
drop constraint if exists book_call_requests_conversion_status_check;

alter table public.book_call_requests
add constraint book_call_requests_conversion_status_check
check (
  conversion_status in (
    'not_started',
    'processing',
    'client_created',
    'invite_sent',
    'completed',
    'invite_failed',
    'failed'
  )
);

alter table public.book_call_requests
drop constraint if exists book_call_requests_invitation_status_check;

alter table public.book_call_requests
add constraint book_call_requests_invitation_status_check
check (
  invitation_status is null
  or invitation_status in ('pending', 'sent', 'failed', 'not_required')
);

alter table public.book_call_requests
drop constraint if exists book_call_requests_status_check;

alter table public.book_call_requests
add constraint book_call_requests_status_check
check (status in ('new', 'contacted', 'qualified', 'closed', 'spam', 'converted'));

create index if not exists book_call_requests_conversion_status_idx
  on public.book_call_requests (conversion_status);

create index if not exists book_call_requests_organization_id_idx
  on public.book_call_requests (organization_id)
  where organization_id is not null;

create index if not exists book_call_requests_owner_user_id_idx
  on public.book_call_requests (owner_user_id)
  where owner_user_id is not null;

-- ---------------------------------------------------------------------------
-- organizations: link back to originating call request
-- ---------------------------------------------------------------------------

alter table public.organizations
add column if not exists source_request_id uuid references public.book_call_requests(id) on delete set null;

create unique index if not exists organizations_source_request_id_unique_idx
  on public.organizations (source_request_id)
  where source_request_id is not null;

create index if not exists organizations_source_request_id_idx
  on public.organizations (source_request_id)
  where source_request_id is not null;

-- ---------------------------------------------------------------------------
-- organization_members: invitation metadata for admin conversions
-- ---------------------------------------------------------------------------

alter table public.organization_members
add column if not exists invited_at timestamptz,
add column if not exists joined_at timestamptz,
add column if not exists created_by uuid;

-- ---------------------------------------------------------------------------
-- Atomic conversion claim (service-role / backend only)
-- ---------------------------------------------------------------------------

create or replace function private.claim_book_call_request_conversion(
  p_request_id uuid,
  p_stale_after_seconds integer default 900
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, private, public
as $$
declare
  v_request public.book_call_requests%rowtype;
  v_stale_before timestamptz := pg_catalog.now() - make_interval(secs => p_stale_after_seconds);
begin
  select *
  into v_request
  from public.book_call_requests
  where id = p_request_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'outcome', 'not_found'
    );
  end if;

  if v_request.conversion_status in ('completed', 'invite_sent', 'client_created')
     and v_request.organization_id is not null
  then
    return pg_catalog.jsonb_build_object(
      'outcome', 'already_converted',
      'request', pg_catalog.to_jsonb(v_request)
    );
  end if;

  if v_request.organization_id is not null
     and v_request.conversion_status in ('invite_failed', 'failed')
  then
    return pg_catalog.jsonb_build_object(
      'outcome', 'already_converted',
      'request', pg_catalog.to_jsonb(v_request)
    );
  end if;

  if v_request.conversion_status = 'processing'
     and v_request.conversion_started_at is not null
     and v_request.conversion_started_at > v_stale_before
  then
    return pg_catalog.jsonb_build_object(
      'outcome', 'processing',
      'request', pg_catalog.to_jsonb(v_request)
    );
  end if;

  if v_request.conversion_status not in ('not_started', 'failed', 'invite_failed', 'processing')
     and v_request.organization_id is null
  then
    return pg_catalog.jsonb_build_object(
      'outcome', 'blocked',
      'request', pg_catalog.to_jsonb(v_request)
    );
  end if;

  update public.book_call_requests
  set
    conversion_status = 'processing',
    conversion_started_at = pg_catalog.now(),
    conversion_error_code = null,
    conversion_error_message = null,
    updated_at = pg_catalog.now()
  where id = p_request_id
  returning *
  into v_request;

  return pg_catalog.jsonb_build_object(
    'outcome', 'claimed',
    'request', pg_catalog.to_jsonb(v_request)
  );
end;
$$;

comment on function private.claim_book_call_request_conversion(uuid, integer) is
  'Atomically claims a book_call_request for admin conversion. Callable only via service role.';

revoke all on function private.claim_book_call_request_conversion(uuid, integer)
  from public, anon, authenticated;

grant execute on function private.claim_book_call_request_conversion(uuid, integer)
  to service_role;

-- ---------------------------------------------------------------------------
-- Admin organization bootstrap from call request (service-role only)
-- ---------------------------------------------------------------------------

create or replace function private.admin_bootstrap_organization_from_call_request(
  p_request_id uuid,
  p_owner_user_id uuid,
  p_organization_name text,
  p_organization_slug text,
  p_organization_email text,
  p_organization_phone text,
  p_organization_timezone text,
  p_organization_default_language public.supported_language,
  p_business_type text,
  p_booking_system text,
  p_created_by uuid
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, private, public
as $$
declare
  v_existing_org_id uuid;
  v_created_organization_id uuid;
  v_target_profile_id uuid;
  v_normalized_slug text := pg_catalog.lower(pg_catalog.btrim(p_organization_slug));
  v_normalized_phone text := nullif(pg_catalog.btrim(p_organization_phone), '');
  v_member_status text := 'invited';
begin
  select id
  into v_existing_org_id
  from public.organizations
  where source_request_id = p_request_id
  limit 1;

  if v_existing_org_id is not null then
    return v_existing_org_id;
  end if;

  if v_normalized_slug is null or v_normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Invalid organization slug.'
      using errcode = '22023';
  end if;

  if v_normalized_phone is not null
    and v_normalized_phone !~ '^\+[1-9][0-9]{7,14}$'
  then
    raise exception 'Phone number must be a valid E.164 number.'
      using errcode = '22023';
  end if;

  insert into public.profiles (
    auth_user_id,
    full_name,
    email
  )
  select
    u.id,
    nullif(pg_catalog.btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    u.email
  from auth.users u
  where u.id = p_owner_user_id
  on conflict (auth_user_id) do update
  set
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    email = coalesce(excluded.email, public.profiles.email),
    updated_at = pg_catalog.now()
  returning id into v_target_profile_id;

  if v_target_profile_id is null then
    select id
    into v_target_profile_id
    from public.profiles
    where auth_user_id = p_owner_user_id;
  end if;

  if v_target_profile_id is null then
    raise exception 'Unable to resolve owner profile.'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.organization_members om
    where om.user_id = p_owner_user_id
    limit 1
  ) then
    raise exception 'Owner already belongs to an organization.'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from auth.users u
    where u.id = p_owner_user_id
      and u.email_confirmed_at is not null
  ) then
    v_member_status := 'active';
  end if;

  insert into public.organizations (
    name,
    slug,
    email,
    phone,
    timezone,
    default_language,
    source_request_id
  )
  values (
    pg_catalog.btrim(p_organization_name),
    v_normalized_slug,
    nullif(pg_catalog.lower(pg_catalog.btrim(p_organization_email)), ''),
    v_normalized_phone,
    coalesce(nullif(pg_catalog.btrim(p_organization_timezone), ''), 'America/Toronto'),
    p_organization_default_language,
    p_request_id
  )
  returning id into v_created_organization_id;

  insert into public.organization_settings (
    organization_id,
    default_language
  )
  values (
    v_created_organization_id,
    p_organization_default_language
  );

  insert into public.organization_members (
    organization_id,
    user_id,
    profile_id,
    role,
    status,
    invited_at,
    joined_at,
    created_by
  )
  values (
    v_created_organization_id,
    p_owner_user_id,
    v_target_profile_id,
    'owner',
    v_member_status,
    case when v_member_status = 'invited' then pg_catalog.now() else null end,
    case when v_member_status = 'active' then pg_catalog.now() else null end,
    p_created_by
  )
  on conflict (organization_id, user_id) do nothing;

  insert into public.organization_billing_settings (
    organization_id,
    billing_status,
    sms_status
  )
  values (
    v_created_organization_id,
    'unpaid',
    'inactive'
  )
  on conflict (organization_id) do nothing;

  insert into public.organization_onboarding_submissions (
    organization_id,
    token_hash,
    status,
    business_name,
    business_type,
    booking_system,
    public_contact_email,
    public_contact_phone,
    responsible_name,
    responsible_email,
    responsible_phone,
    sms_language
  )
  values (
    v_created_organization_id,
    encode(extensions.digest(p_request_id::text || v_created_organization_id::text, 'sha256'), 'hex'),
    'not_started',
    pg_catalog.btrim(p_organization_name),
    nullif(pg_catalog.btrim(p_business_type), ''),
    nullif(pg_catalog.btrim(p_booking_system), ''),
    nullif(pg_catalog.lower(pg_catalog.btrim(p_organization_email)), ''),
    v_normalized_phone,
    (select full_name from public.book_call_requests where id = p_request_id),
    nullif(pg_catalog.lower(pg_catalog.btrim(p_organization_email)), ''),
    v_normalized_phone,
    p_organization_default_language
  )
  on conflict (organization_id) do nothing;

  insert into public.platform_organization_admin_controls (
    organization_id,
    support_status
  )
  values (
    v_created_organization_id,
    'needs_setup'
  )
  on conflict (organization_id) do nothing;

  insert into public.audit_logs (
    organization_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_created_organization_id,
    p_created_by,
    'organization.created',
    'organizations',
    v_created_organization_id,
    pg_catalog.jsonb_build_object(
      'source', 'call_request_conversion',
      'source_request_id', p_request_id,
      'owner_user_id', p_owner_user_id,
      'default_language', p_organization_default_language
    )
  );

  return v_created_organization_id;
end;
$$;

comment on function private.admin_bootstrap_organization_from_call_request(
  uuid, uuid, text, text, text, text, text, public.supported_language, text, text, uuid
) is
  'Creates organization foundation from an admin call request conversion. Service role only.';

revoke all on function private.admin_bootstrap_organization_from_call_request(
  uuid, uuid, text, text, text, text, text, public.supported_language, text, text, uuid
) from public, anon, authenticated;

grant execute on function private.admin_bootstrap_organization_from_call_request(
  uuid, uuid, text, text, text, text, text, public.supported_language, text, text, uuid
) to service_role;

-- Public wrappers callable via PostgREST service role only.

create or replace function public.claim_book_call_request_conversion(
  p_request_id uuid
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.claim_book_call_request_conversion(p_request_id);
$$;

revoke all on function public.claim_book_call_request_conversion(uuid)
  from public, anon, authenticated;

grant execute on function public.claim_book_call_request_conversion(uuid)
  to service_role;

create or replace function public.admin_bootstrap_organization_from_call_request(
  p_request_id uuid,
  p_owner_user_id uuid,
  p_organization_name text,
  p_organization_slug text,
  p_organization_email text,
  p_organization_phone text,
  p_organization_timezone text,
  p_organization_default_language public.supported_language,
  p_business_type text,
  p_booking_system text,
  p_created_by uuid
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select private.admin_bootstrap_organization_from_call_request(
    p_request_id,
    p_owner_user_id,
    p_organization_name,
    p_organization_slug,
    p_organization_email,
    p_organization_phone,
    p_organization_timezone,
    p_organization_default_language,
    p_business_type,
    p_booking_system,
    p_created_by
  );
$$;

revoke all on function public.admin_bootstrap_organization_from_call_request(
  uuid, uuid, text, text, text, text, text, public.supported_language, text, text, uuid
) from public, anon, authenticated;

grant execute on function public.admin_bootstrap_organization_from_call_request(
  uuid, uuid, text, text, text, text, text, public.supported_language, text, text, uuid
) to service_role;
