-- Phase 4 blocker hardening: create organization, owner membership, billing,
-- and audit records in one database transaction.
--
-- A new user cannot satisfy the existing membership-based RLS policies before
-- their first owner membership exists, so the bootstrap must run in privileged
-- database code. The SECURITY DEFINER implementation lives in the private
-- schema; the public RPC is only a thin authenticated wrapper.
-- The implementation uses auth.uid() internally and accepts no
-- client-controlled user id.

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
  normalized_email text := nullif(pg_catalog.btrim(organization_email), ''::text);
  normalized_phone text := nullif(pg_catalog.btrim(organization_phone), ''::text);
  normalized_timezone text := coalesce(
    nullif(pg_catalog.btrim(organization_timezone), ''::text),
    'America/Toronto'
  );
  created_organization_id uuid;
begin
  if request_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '28000';
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
      'owner_user_id', request_user_id
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

create or replace function public.create_organization_with_owner(
  organization_name text,
  organization_slug text,
  organization_email text,
  organization_phone text,
  organization_timezone text,
  organization_default_language public.supported_language
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.create_organization_with_owner(
    organization_name,
    organization_slug,
    organization_email,
    organization_phone,
    organization_timezone,
    organization_default_language
  );
$$;

revoke all on function public.create_organization_with_owner(
  text,
  text,
  text,
  text,
  text,
  public.supported_language
) from public, anon, authenticated;

grant execute on function public.create_organization_with_owner(
  text,
  text,
  text,
  text,
  text,
  public.supported_language
) to authenticated;
