-- Append-only customer update audit helper. Audit logs intentionally have no
-- direct authenticated insert policy, so dashboard writes use this narrow RPC
-- after membership and role checks.

create or replace function private.record_customer_update_audit(
  target_customer_id uuid,
  change_metadata jsonb,
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

  if target_customer_id is null then
    raise exception 'Client is required.'
      using errcode = '22023';
  end if;

  select c.organization_id
  into target_organization_id
  from public.customers c
  where c.id = target_customer_id;

  if target_organization_id is null then
    raise exception 'Client not found.'
      using errcode = '02000';
  end if;

  if not private.has_org_role(
    target_organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  ) then
    raise exception 'You are not allowed to audit this client.'
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
    'customer.updated',
    'customers',
    target_customer_id,
    coalesce(change_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace function public.record_customer_update_audit(
  target_customer_id uuid,
  change_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.record_customer_update_audit(
    target_customer_id,
    change_metadata,
    auth.uid()
  );
end;
$$;

revoke all on function private.record_customer_update_audit(
  uuid,
  jsonb,
  uuid
) from public, anon, authenticated, service_role;

grant execute on function private.record_customer_update_audit(
  uuid,
  jsonb,
  uuid
) to authenticated;

revoke all on function public.record_customer_update_audit(
  uuid,
  jsonb
) from public, anon, authenticated, service_role;

grant execute on function public.record_customer_update_audit(
  uuid,
  jsonb
) to authenticated;
