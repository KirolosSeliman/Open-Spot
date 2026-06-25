-- Keep 24h reminder scheduling idempotent while a due row is being processed.
-- A processing reminder must block duplicate scheduling without being mutated
-- back into a pending reminder by a concurrent dashboard save.

drop index if exists public.scheduled_messages_unique_pending_24h_reminder_idx;

create unique index scheduled_messages_unique_pending_24h_reminder_idx
  on public.scheduled_messages(organization_id, appointment_id, template_key)
  where appointment_id is not null
    and message_type = 'appointment_reminder_24h'
    and status in ('pending', 'processing');

create or replace function private.schedule_appointment_reminder(
  target_organization_id uuid,
  target_appointment_id uuid,
  target_customer_id uuid,
  target_scheduled_for timestamptz,
  target_template_key text,
  request_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_template_key text :=
    coalesce(nullif(pg_catalog.btrim(target_template_key), ''), 'appointment_reminder_24h');
  target_message_id uuid;
begin
  if request_user_id is null or request_user_id <> auth.uid() then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  if target_organization_id is null
    or target_appointment_id is null
    or target_customer_id is null
    or target_scheduled_for is null
  then
    raise exception 'Reminder scheduling requires organization, appointment, customer, and time.'
      using errcode = '22023';
  end if;

  if not private.has_org_role(
    target_organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  ) then
    raise exception 'You are not allowed to schedule appointment reminders.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.appointments a
    where a.organization_id = target_organization_id
      and a.id = target_appointment_id
      and a.customer_id = target_customer_id
      and a.status in ('scheduled', 'confirmed')
      and a.reminder_24h_enabled = true
  ) then
    raise exception 'Appointment is not eligible for reminder scheduling.'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.customers c
    join public.sms_consents sc
      on sc.organization_id = c.organization_id
      and sc.customer_id = c.id
      and sc.status = 'opted_in'
    where c.organization_id = target_organization_id
      and c.id = target_customer_id
      and c.deleted_at is null
      and c.phone_e164 ~ '^\+[1-9][0-9]{7,14}$'
  ) then
    raise exception 'Customer is not eligible for reminder SMS.'
      using errcode = '23514';
  end if;

  select sm.id into target_message_id
  from public.scheduled_messages sm
  where sm.organization_id = target_organization_id
    and sm.appointment_id = target_appointment_id
    and sm.template_key = normalized_template_key
    and sm.message_type = 'appointment_reminder_24h'
    and sm.status = 'processing'
  limit 1;

  if target_message_id is not null then
    return target_message_id;
  end if;

  insert into public.scheduled_messages (
    organization_id,
    customer_id,
    appointment_id,
    message_type,
    channel,
    scheduled_for,
    status,
    template_key
  )
  values (
    target_organization_id,
    target_customer_id,
    target_appointment_id,
    'appointment_reminder_24h',
    'sms',
    target_scheduled_for,
    'pending',
    normalized_template_key
  )
  on conflict (organization_id, appointment_id, template_key)
  where message_type = 'appointment_reminder_24h'
    and status in ('pending', 'processing')
  do update set
    customer_id = excluded.customer_id,
    scheduled_for = excluded.scheduled_for,
    updated_at = now()
  where public.scheduled_messages.status = 'pending'
  returning id into target_message_id;

  if target_message_id is null then
    select sm.id into target_message_id
    from public.scheduled_messages sm
    where sm.organization_id = target_organization_id
      and sm.appointment_id = target_appointment_id
      and sm.template_key = normalized_template_key
      and sm.message_type = 'appointment_reminder_24h'
      and sm.status in ('pending', 'processing')
    limit 1;
  end if;

  return target_message_id;
end;
$$;

create or replace function public.schedule_appointment_reminder(
  target_organization_id uuid,
  target_appointment_id uuid,
  target_customer_id uuid,
  target_scheduled_for timestamptz,
  target_template_key text default 'appointment_reminder_24h'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return private.schedule_appointment_reminder(
    target_organization_id,
    target_appointment_id,
    target_customer_id,
    target_scheduled_for,
    target_template_key,
    auth.uid()
  );
end;
$$;

revoke all on function private.schedule_appointment_reminder(
  uuid,
  uuid,
  uuid,
  timestamptz,
  text,
  uuid
) from public, anon, authenticated, service_role;

revoke all on function public.schedule_appointment_reminder(
  uuid,
  uuid,
  uuid,
  timestamptz,
  text
) from public, anon, authenticated, service_role;

grant execute on function private.schedule_appointment_reminder(
  uuid,
  uuid,
  uuid,
  timestamptz,
  text,
  uuid
) to authenticated;

grant execute on function public.schedule_appointment_reminder(
  uuid,
  uuid,
  uuid,
  timestamptz,
  text
) to authenticated;
