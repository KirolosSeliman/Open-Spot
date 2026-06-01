-- Phase 02: Appointment reminder and scheduled SMS automation foundation.
-- Additive schema only: no outbound SMS sending is enabled by this migration.

alter table public.organization_settings
  add column if not exists appointment_reminders_enabled boolean not null default false,
  add column if not exists default_reminder_delay_hours integer not null default 24,
  add column if not exists appointment_confirmation_requests_enabled boolean not null default false,
  add column if not exists client_sms_cancellation_enabled boolean not null default false,
  add column if not exists auto_create_opening_on_sms_cancellation boolean not null default false,
  add column if not exists auto_send_recovery_sms_on_cancellation boolean not null default false,
  add column if not exists unavailable_sms_to_non_selected_enabled boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organization_settings_default_reminder_delay_hours_check'
      and conrelid = 'public.organization_settings'::regclass
  ) then
    alter table public.organization_settings
      add constraint organization_settings_default_reminder_delay_hours_check
      check (default_reminder_delay_hours between 1 and 168);
  end if;
end $$;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null default 'America/Toronto',
  status text not null default 'scheduled',
  reminder_status text not null default 'not_scheduled',
  confirmation_status text not null default 'pending',
  source text not null default 'manual',
  notes text,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_time_order_check check (
    ends_at is null or ends_at > starts_at
  ),
  constraint appointments_status_check check (
    status in ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')
  ),
  constraint appointments_reminder_status_check check (
    reminder_status in ('not_scheduled', 'scheduled', 'sent', 'skipped', 'failed')
  ),
  constraint appointments_confirmation_status_check check (
    confirmation_status in (
      'pending',
      'confirmed_by_client',
      'cancelled_by_client',
      'no_response'
    )
  ),
  constraint appointments_source_check check (
    source in ('manual', 'import', 'api', 'appointment_cancellation')
  )
);

create table if not exists public.scheduled_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete cascade,
  opening_id uuid references public.openings(id) on delete cascade,
  message_type text not null,
  channel text not null default 'sms',
  scheduled_for timestamptz not null,
  status text not null default 'pending',
  template_key text not null,
  body_snapshot text,
  provider text,
  provider_message_id text,
  sent_at timestamptz,
  failed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scheduled_messages_type_check check (
    message_type in (
      'appointment_reminder_24h',
      'appointment_reminder_2h',
      'appointment_confirmation_request',
      'appointment_confirmed',
      'appointment_cancelled',
      'cancellation_recovery_offer',
      'follow_up_after_visit',
      'winback'
    )
  ),
  constraint scheduled_messages_channel_check check (channel = 'sms'),
  constraint scheduled_messages_status_check check (
    status in ('pending', 'processing', 'sent', 'failed', 'cancelled', 'skipped')
  )
);

create table if not exists public.sms_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  template_key text not null,
  language text not null,
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sms_templates_key_not_blank check (length(btrim(template_key)) > 0),
  constraint sms_templates_body_not_blank check (length(btrim(body)) > 0),
  constraint sms_templates_language_check check (language in ('fr', 'en'))
);

create table if not exists public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint appointment_events_type_not_blank check (length(btrim(event_type)) > 0)
);

create index if not exists appointments_org_starts_idx
  on public.appointments(organization_id, starts_at);

create index if not exists appointments_org_status_idx
  on public.appointments(organization_id, status);

create index if not exists appointments_org_customer_idx
  on public.appointments(organization_id, customer_id);

create index if not exists scheduled_messages_status_due_idx
  on public.scheduled_messages(status, scheduled_for);

create index if not exists scheduled_messages_org_appointment_idx
  on public.scheduled_messages(organization_id, appointment_id)
  where appointment_id is not null;

create index if not exists scheduled_messages_org_customer_idx
  on public.scheduled_messages(organization_id, customer_id);

create unique index if not exists scheduled_messages_unique_pending_24h_reminder_idx
  on public.scheduled_messages(organization_id, appointment_id, template_key)
  where appointment_id is not null
    and message_type = 'appointment_reminder_24h'
    and status in ('pending', 'processing');

create index if not exists sms_templates_org_template_language_idx
  on public.sms_templates(organization_id, template_key, language);

create unique index if not exists sms_templates_global_template_language_unique_idx
  on public.sms_templates(template_key, language)
  where organization_id is null;

create unique index if not exists sms_templates_org_template_language_unique_idx
  on public.sms_templates(organization_id, template_key, language)
  where organization_id is not null;

create index if not exists appointment_events_org_appointment_created_idx
  on public.appointment_events(organization_id, appointment_id, created_at);

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
before update on public.appointments
for each row execute function private.set_updated_at();

drop trigger if exists set_scheduled_messages_updated_at on public.scheduled_messages;
create trigger set_scheduled_messages_updated_at
before update on public.scheduled_messages
for each row execute function private.set_updated_at();

drop trigger if exists set_sms_templates_updated_at on public.sms_templates;
create trigger set_sms_templates_updated_at
before update on public.sms_templates
for each row execute function private.set_updated_at();

insert into public.sms_templates (organization_id, template_key, language, body)
select
  null::uuid,
  'appointment_reminder_24h',
  'fr',
  'Bonjour {firstName}, rappel de votre rendez-vous chez {businessName} demain à {time} pour {serviceName}. Répondez OUI pour confirmer ou NON pour annuler. STOP pour vous désinscrire.'
where not exists (
  select 1
  from public.sms_templates
  where organization_id is null
    and template_key = 'appointment_reminder_24h'
    and language = 'fr'
);

insert into public.sms_templates (organization_id, template_key, language, body)
select
  null::uuid,
  'appointment_reminder_24h',
  'en',
  'Hi {firstName}, reminder for your appointment at {businessName} tomorrow at {time} for {serviceName}. Reply YES to confirm or NO to cancel. STOP to unsubscribe.'
where not exists (
  select 1
  from public.sms_templates
  where organization_id is null
    and template_key = 'appointment_reminder_24h'
    and language = 'en'
);

insert into public.sms_templates (organization_id, template_key, language, body)
select
  null::uuid,
  'appointment_confirmed',
  'fr',
  'Merci {firstName}, votre rendez-vous chez {businessName} à {time} est confirmé.'
where not exists (
  select 1
  from public.sms_templates
  where organization_id is null
    and template_key = 'appointment_confirmed'
    and language = 'fr'
);

insert into public.sms_templates (organization_id, template_key, language, body)
select
  null::uuid,
  'appointment_confirmed',
  'en',
  'Thanks {firstName}, your appointment at {businessName} at {time} is confirmed.'
where not exists (
  select 1
  from public.sms_templates
  where organization_id is null
    and template_key = 'appointment_confirmed'
    and language = 'en'
);

insert into public.sms_templates (organization_id, template_key, language, body)
select
  null::uuid,
  'appointment_cancelled',
  'fr',
  'Merci {firstName}, votre annulation a été reçue. Si une autre place se libère, {businessName} pourra vous recontacter selon vos préférences SMS.'
where not exists (
  select 1
  from public.sms_templates
  where organization_id is null
    and template_key = 'appointment_cancelled'
    and language = 'fr'
);

insert into public.sms_templates (organization_id, template_key, language, body)
select
  null::uuid,
  'appointment_cancelled',
  'en',
  'Thanks {firstName}, your cancellation has been received. If another spot opens up, {businessName} may contact you based on your SMS preferences.'
where not exists (
  select 1
  from public.sms_templates
  where organization_id is null
    and template_key = 'appointment_cancelled'
    and language = 'en'
);

alter table public.appointments enable row level security;
alter table public.scheduled_messages enable row level security;
alter table public.sms_templates enable row level security;
alter table public.appointment_events enable row level security;

revoke all privileges on table public.appointments from public;
revoke all privileges on table public.appointments from anon;
revoke all privileges on table public.scheduled_messages from public;
revoke all privileges on table public.scheduled_messages from anon;
revoke all privileges on table public.sms_templates from public;
revoke all privileges on table public.sms_templates from anon;
revoke all privileges on table public.appointment_events from public;
revoke all privileges on table public.appointment_events from anon;

grant select, insert, update on public.appointments to authenticated;
grant select, insert, update on public.scheduled_messages to authenticated;
grant select, insert, update on public.sms_templates to authenticated;
grant select, insert on public.appointment_events to authenticated;

drop policy if exists "members can read appointments" on public.appointments;
create policy "members can read appointments"
on public.appointments for select to authenticated
using (private.is_org_member(organization_id));

drop policy if exists "staff can create appointments" on public.appointments;
create policy "staff can create appointments"
on public.appointments for insert to authenticated
with check (
  private.has_org_role(
    organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  )
);

drop policy if exists "staff can update appointments" on public.appointments;
create policy "staff can update appointments"
on public.appointments for update to authenticated
using (
  private.has_org_role(
    organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  )
)
with check (
  private.has_org_role(
    organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  )
);

drop policy if exists "members can read scheduled messages" on public.scheduled_messages;
create policy "members can read scheduled messages"
on public.scheduled_messages for select to authenticated
using (private.is_org_member(organization_id));

drop policy if exists "staff can create scheduled messages" on public.scheduled_messages;
create policy "staff can create scheduled messages"
on public.scheduled_messages for insert to authenticated
with check (
  private.has_org_role(
    organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  )
);

drop policy if exists "staff can update scheduled messages" on public.scheduled_messages;
create policy "staff can update scheduled messages"
on public.scheduled_messages for update to authenticated
using (
  private.has_org_role(
    organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  )
)
with check (
  private.has_org_role(
    organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  )
);

drop policy if exists "members can read sms templates" on public.sms_templates;
create policy "members can read sms templates"
on public.sms_templates for select to authenticated
using (organization_id is null or private.is_org_member(organization_id));

drop policy if exists "owners and managers can create sms templates" on public.sms_templates;
create policy "owners and managers can create sms templates"
on public.sms_templates for insert to authenticated
with check (
  organization_id is not null
  and private.has_org_role(
    organization_id,
    array['owner', 'manager']::public.organization_role[]
  )
);

drop policy if exists "owners and managers can update sms templates" on public.sms_templates;
create policy "owners and managers can update sms templates"
on public.sms_templates for update to authenticated
using (
  organization_id is not null
  and private.has_org_role(
    organization_id,
    array['owner', 'manager']::public.organization_role[]
  )
)
with check (
  organization_id is not null
  and private.has_org_role(
    organization_id,
    array['owner', 'manager']::public.organization_role[]
  )
);

drop policy if exists "members can read appointment events" on public.appointment_events;
create policy "members can read appointment events"
on public.appointment_events for select to authenticated
using (private.is_org_member(organization_id));

drop policy if exists "staff can append appointment events" on public.appointment_events;
create policy "staff can append appointment events"
on public.appointment_events for insert to authenticated
with check (
  private.has_org_role(
    organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  )
);
