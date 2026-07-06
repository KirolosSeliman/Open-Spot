-- Smart SMS recipient controls for Open Spot.
-- Additive only: preserves existing openings, offers, SMS, consent, and audit history.

alter table public.organization_settings
  add column if not exists smart_sending_enabled boolean not null default true,
  add column if not exists cooldown_after_completed_appointment_days integer not null default 7,
  add column if not exists cooldown_after_filled_spot_days integer not null default 14,
  add column if not exists max_sms_per_day integer not null default 1,
  add column if not exists max_sms_per_7_days integer not null default 2,
  add column if not exists max_sms_per_30_days integer not null default 5,
  add column if not exists block_if_future_appointment_exists boolean not null default true,
  add column if not exists future_appointment_window_days integer not null default 14,
  add column if not exists allowed_send_start_time text not null default '08:00',
  add column if not exists allowed_send_end_time text not null default '20:00',
  add column if not exists always_review_recipients_before_send boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organization_settings'::regclass
      and conname = 'organization_settings_smart_sms_nonnegative_check'
  ) then
    alter table public.organization_settings
      add constraint organization_settings_smart_sms_nonnegative_check
      check (
        cooldown_after_completed_appointment_days >= 0
        and cooldown_after_filled_spot_days >= 0
        and max_sms_per_day >= 0
        and max_sms_per_7_days >= 0
        and max_sms_per_30_days >= 0
        and future_appointment_window_days >= 0
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organization_settings'::regclass
      and conname = 'organization_settings_smart_sms_time_check'
  ) then
    alter table public.organization_settings
      add constraint organization_settings_smart_sms_time_check
      check (
        allowed_send_start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        and allowed_send_end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      );
  end if;
end $$;

create table if not exists public.customer_sms_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  sms_consent_status public.sms_consent_status,
  consented_at timestamptz,
  consent_source text,
  opted_out_at timestamptz,
  opt_out_source text,
  manual_send_mode text not null default 'auto',
  manual_snooze_until timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_sms_preferences_org_customer_unique unique (organization_id, customer_id),
  constraint customer_sms_preferences_manual_send_mode_check check (
    manual_send_mode in (
      'auto',
      'prefer_include',
      'prefer_exclude',
      'never_send_last_minute'
    )
  )
);

create table if not exists public.customer_activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  event_type text not null,
  event_at timestamptz not null default now(),
  related_alert_id uuid references public.openings(id) on delete set null,
  related_appointment_id uuid references public.appointments(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint customer_activity_events_event_type_check check (
    event_type in (
      'appointment_booked',
      'appointment_confirmed',
      'appointment_completed',
      'appointment_cancelled',
      'appointment_no_show',
      'spot_filled',
      'sms_sent',
      'sms_replied_yes',
      'sms_opted_out',
      'manual_snooze_added',
      'manual_snooze_removed',
      'manual_recipient_included',
      'manual_recipient_excluded'
    )
  )
);

create table if not exists public.alert_recipient_decisions (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.openings(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  base_decision text not null,
  final_decision text not null,
  decision_type text not null default 'auto',
  manual_override text not null default 'auto',
  reason_codes text[] not null default array['eligible']::text[],
  reason_label text not null,
  manually_overridden boolean not null default false,
  warning_required boolean not null default false,
  override_reason text,
  overridden_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  twilio_message_sid text,
  delivery_status text,
  constraint alert_recipient_decisions_alert_customer_unique unique (alert_id, customer_id),
  constraint alert_recipient_decisions_base_check check (
    base_decision in ('eligible', 'protected', 'locked_blocked')
  ),
  constraint alert_recipient_decisions_final_check check (
    final_decision in ('send', 'do_not_send', 'locked_blocked')
  ),
  constraint alert_recipient_decisions_type_check check (
    decision_type in ('auto', 'manual_include', 'manual_exclude', 'manual_locked')
  ),
  constraint alert_recipient_decisions_override_check check (
    manual_override in ('auto', 'include', 'exclude')
  ),
  constraint alert_recipient_decisions_no_locked_send_check check (
    not (base_decision = 'locked_blocked' and final_decision = 'send')
  ),
  constraint alert_recipient_decisions_reason_codes_check check (
    reason_codes <@ array[
      'eligible',
      'blocked_opted_out',
      'blocked_no_consent',
      'blocked_invalid_phone',
      'blocked_duplicate_alert',
      'blocked_archived_customer',
      'blocked_delivery_quarantine',
      'protected_recent_completed_appointment',
      'protected_recent_filled_spot',
      'protected_frequency_cap_24h',
      'protected_frequency_cap_7d',
      'protected_frequency_cap_30d',
      'protected_future_appointment',
      'protected_manual_snooze',
      'protected_manual_prefer_exclude',
      'protected_low_service_match',
      'manual_include',
      'manual_exclude',
      'manual_never_send_last_minute',
      'outside_allowed_sending_hours'
    ]::text[]
  )
);

create index if not exists customer_sms_preferences_org_customer_idx
on public.customer_sms_preferences (organization_id, customer_id);

create index if not exists customer_activity_events_org_customer_event_idx
on public.customer_activity_events (organization_id, customer_id, event_type, event_at desc);

create index if not exists customer_activity_events_org_event_at_idx
on public.customer_activity_events (organization_id, event_at desc);

create index if not exists customer_activity_events_alert_idx
on public.customer_activity_events (organization_id, related_alert_id);

create index if not exists alert_recipient_decisions_org_alert_idx
on public.alert_recipient_decisions (organization_id, alert_id);

create index if not exists alert_recipient_decisions_org_customer_idx
on public.alert_recipient_decisions (organization_id, customer_id);

create index if not exists alert_recipient_decisions_final_idx
on public.alert_recipient_decisions (organization_id, alert_id, final_decision);

drop trigger if exists set_customer_sms_preferences_updated_at on public.customer_sms_preferences;
create trigger set_customer_sms_preferences_updated_at
before update on public.customer_sms_preferences
for each row execute function private.set_updated_at();

drop trigger if exists set_alert_recipient_decisions_updated_at on public.alert_recipient_decisions;
create trigger set_alert_recipient_decisions_updated_at
before update on public.alert_recipient_decisions
for each row execute function private.set_updated_at();

alter table public.customer_sms_preferences enable row level security;
alter table public.customer_activity_events enable row level security;
alter table public.alert_recipient_decisions enable row level security;

revoke all privileges on table public.customer_sms_preferences from public, anon;
revoke all privileges on table public.customer_activity_events from public, anon;
revoke all privileges on table public.alert_recipient_decisions from public, anon;

grant select, insert, update on public.customer_sms_preferences to authenticated;
grant select, insert on public.customer_activity_events to authenticated;
grant select, insert, update on public.alert_recipient_decisions to authenticated;

drop policy if exists "members can read customer sms preferences" on public.customer_sms_preferences;
create policy "members can read customer sms preferences"
on public.customer_sms_preferences for select to authenticated
using (private.is_org_member(organization_id));

drop policy if exists "operations team can insert customer sms preferences" on public.customer_sms_preferences;
create policy "operations team can insert customer sms preferences"
on public.customer_sms_preferences for insert to authenticated
with check (
  private.has_org_role(
    organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  )
);

drop policy if exists "operations team can update customer sms preferences" on public.customer_sms_preferences;
create policy "operations team can update customer sms preferences"
on public.customer_sms_preferences for update to authenticated
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

drop policy if exists "members can read customer activity events" on public.customer_activity_events;
create policy "members can read customer activity events"
on public.customer_activity_events for select to authenticated
using (private.is_org_member(organization_id));

drop policy if exists "operations team can insert customer activity events" on public.customer_activity_events;
create policy "operations team can insert customer activity events"
on public.customer_activity_events for insert to authenticated
with check (
  private.has_org_role(
    organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  )
);

drop policy if exists "members can read alert recipient decisions" on public.alert_recipient_decisions;
create policy "members can read alert recipient decisions"
on public.alert_recipient_decisions for select to authenticated
using (private.is_org_member(organization_id));

drop policy if exists "operations team can insert alert recipient decisions" on public.alert_recipient_decisions;
create policy "operations team can insert alert recipient decisions"
on public.alert_recipient_decisions for insert to authenticated
with check (
  private.has_org_role(
    organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  )
);

drop policy if exists "operations team can update alert recipient decisions" on public.alert_recipient_decisions;
create policy "operations team can update alert recipient decisions"
on public.alert_recipient_decisions for update to authenticated
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
