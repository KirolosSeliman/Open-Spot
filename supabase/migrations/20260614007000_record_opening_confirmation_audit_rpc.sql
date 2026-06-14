-- Record manual-validation confirmation SMS audit entries without granting
-- direct audit_logs writes to dashboard clients.

create or replace function public.record_opening_confirmation_audit(
  target_opening_id uuid,
  target_offer_id uuid,
  target_booking_request_id uuid,
  target_sms_message_id uuid,
  provider_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_organization_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  select br.organization_id
  into target_organization_id
  from public.booking_requests br
  join public.openings o
    on o.organization_id = br.organization_id
    and o.id = br.opening_id
  join public.opening_offers oo
    on oo.organization_id = br.organization_id
    and oo.id = br.selected_offer_id
    and oo.opening_id = br.opening_id
    and oo.customer_id = br.customer_id
  join public.sms_messages sm
    on sm.organization_id = br.organization_id
    and sm.id = target_sms_message_id
    and sm.opening_id = br.opening_id
    and sm.customer_id = br.customer_id
    and sm.direction = 'outbound'
    and sm.message_type = 'opening_confirmation'
  where br.id = target_booking_request_id
    and br.opening_id = target_opening_id
    and br.selected_offer_id = target_offer_id
    and br.status in ('confirmed', 'completed')
    and o.status = 'filled'
    and oo.status = 'selected';

  if target_organization_id is null then
    raise exception 'Validated opening confirmation context not found.'
      using errcode = '22023';
  end if;

  if not private.has_org_role(
    target_organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  ) then
    raise exception 'You are not allowed to audit this opening confirmation.'
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
    auth.uid(),
    'sms.opening_confirmation.sent',
    'sms_messages',
    target_sms_message_id,
    pg_catalog.jsonb_build_object(
      'opening_id', target_opening_id,
      'offer_id', target_offer_id,
      'booking_request_id', target_booking_request_id,
      'provider', provider_name
    )
  );
end;
$$;

revoke all on function public.record_opening_confirmation_audit(uuid, uuid, uuid, uuid, text)
from public, anon, authenticated, service_role;

grant execute on function public.record_opening_confirmation_audit(uuid, uuid, uuid, uuid, text)
to authenticated;
