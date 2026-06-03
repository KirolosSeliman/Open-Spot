-- Provider-aware opening broadcast audit wrapper. Keeps the previous
-- simulator-specific RPC intact for backward compatibility while allowing the
-- dashboard flow to record Twilio/simulator sends honestly.

create or replace function private.record_opening_broadcast_audit(
  target_opening_id uuid,
  provider_name text,
  sent_count integer,
  request_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_organization_id uuid;
begin
  if request_user_id is null or request_user_id <> auth.uid() then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  if target_opening_id is null then
    raise exception 'Opening is required.'
      using errcode = '22023';
  end if;

  if provider_name is null then
    raise exception 'SMS provider is required.'
      using errcode = '22023';
  end if;

  if provider_name not in ('simulator', 'twilio', 'plivo') then
    raise exception 'Unsupported SMS provider.'
      using errcode = '22023';
  end if;

  select o.organization_id
  into target_organization_id
  from public.openings o
  where o.id = target_opening_id;

  if target_organization_id is null then
    raise exception 'Opening not found.'
      using errcode = '02000';
  end if;

  if not private.has_org_role(
    target_organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  ) then
    raise exception 'You are not allowed to audit this opening.'
      using errcode = '42501';
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
    request_user_id,
    'sms.opening_broadcast.created',
    'openings',
    target_opening_id,
    pg_catalog.jsonb_build_object(
      'provider', provider_name,
      'sent_count', sent_count
    )
  );
end;
$$;

create or replace function public.record_opening_broadcast_audit(
  target_opening_id uuid,
  provider_name text,
  sent_count integer
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.record_opening_broadcast_audit(
    target_opening_id,
    provider_name,
    sent_count,
    auth.uid()
  );
end;
$$;

revoke all on function private.record_opening_broadcast_audit(
  uuid,
  text,
  integer,
  uuid
) from public, anon, authenticated, service_role;

grant execute on function private.record_opening_broadcast_audit(
  uuid,
  text,
  integer,
  uuid
) to authenticated;

revoke all on function public.record_opening_broadcast_audit(
  uuid,
  text,
  integer
) from public, anon, authenticated, service_role;

grant execute on function public.record_opening_broadcast_audit(
  uuid,
  text,
  integer
) to authenticated;
