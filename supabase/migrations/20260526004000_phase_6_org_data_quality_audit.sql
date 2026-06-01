-- Phase 6 blocker hardening: keep organization bootstrap auditable while
-- rejecting low-quality organization contact and locale data.
--
-- This replaces the private implementation only. The public RPC wrapper and
-- function grants from earlier phases remain unchanged.

create or replace function private.create_organization_with_owner(
  organization_name text,
  organization_slug text,
  organization_email text,
  organization_phone text,
  organization_timezone text,
  organization_default_language public.supported_language
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := auth.uid();
  normalized_name text := pg_catalog.btrim(organization_name);
  normalized_slug text := pg_catalog.lower(pg_catalog.btrim(organization_slug));
  normalized_email text := nullif(
    pg_catalog.lower(pg_catalog.btrim(organization_email)),
    ''
  );
  normalized_phone text := nullif(pg_catalog.btrim(organization_phone), '');
  normalized_timezone text := coalesce(
    nullif(pg_catalog.btrim(organization_timezone), ''),
    'America/Toronto'
  );
  created_organization_id uuid;
begin
  if request_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '28000';
  end if;

  if exists (
    select 1
    from public.organization_members
    where user_id = request_user_id
    limit 1
  ) then
    raise exception 'User already belongs to an organization.'
      using errcode = 'P0001';
  end if;

  if normalized_name is null or pg_catalog.length(normalized_name) = 0 then
    raise exception 'Business name is required.'
      using errcode = '22023';
  end if;

  if normalized_slug is null or pg_catalog.length(normalized_slug) = 0 then
    raise exception 'Slug is required.'
      using errcode = '22023';
  end if;

  if normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Slug must contain only lowercase letters, numbers, and hyphens.'
      using errcode = '22023';
  end if;

  if normalized_email is not null
    and normalized_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  then
    raise exception 'Business email must be valid if provided.'
      using errcode = '22023';
  end if;

  if normalized_phone is not null
    and normalized_phone !~ '^\+[1-9][0-9]{7,14}$'
  then
    raise exception 'Phone number must be a valid E.164 number.'
      using errcode = '22023';
  end if;

  if normalized_timezone not in ('America/Toronto', 'America/Montreal') then
    raise exception 'Timezone is not supported yet.'
      using errcode = '22023';
  end if;

  if organization_default_language is null then
    raise exception 'Default language is required.'
      using errcode = '22023';
  end if;

  insert into public.organizations (
    name,
    slug,
    email,
    phone,
    timezone,
    default_language
  )
  values (
    normalized_name,
    normalized_slug,
    normalized_email,
    normalized_phone,
    normalized_timezone,
    organization_default_language
  )
  returning id into created_organization_id;

  insert into public.organization_members (
    organization_id,
    user_id,
    role
  )
  values (
    created_organization_id,
    request_user_id,
    'owner'
  );

  insert into public.organization_billing_settings (
    organization_id
  )
  values (
    created_organization_id
  );

  insert into public.audit_logs (
    organization_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    created_organization_id,
    request_user_id,
    'organization.created',
    'organizations',
    created_organization_id,
    pg_catalog.jsonb_build_object(
      'source', 'onboarding',
      'owner_user_id', request_user_id,
      'default_language', organization_default_language,
      'timezone', normalized_timezone,
      'single_org_mode', true
    )
  );

  return created_organization_id;
end;
$$;

revoke all on function private.create_organization_with_owner(
  text,
  text,
  text,
  text,
  text,
  public.supported_language
) from public, anon, authenticated;

grant execute on function private.create_organization_with_owner(
  text,
  text,
  text,
  text,
  text,
  public.supported_language
) to authenticated;
