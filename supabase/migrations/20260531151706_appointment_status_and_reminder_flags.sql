-- Align appointment display statuses and persist per-appointment reminder choices.
-- Additive and data-preserving: no rows are deleted, and existing operational
-- reminder/confirmation status fields remain available for scheduling internals.

alter table public.appointments
  add column if not exists reminder_24h_enabled boolean not null default false,
  add column if not exists confirmation_request_enabled boolean not null default false;

update public.appointments
set reminder_24h_enabled = true
where reminder_status in ('scheduled', 'sent');

update public.appointments
set confirmation_request_enabled = true
where confirmation_status in (
  'pending',
  'confirmed_by_client',
  'cancelled_by_client'
);

update public.appointments
set status = 'scheduled'
where status in ('confirmed', 'completed', 'no_show');

update public.appointments
set status = 'not_yet_confirmed'
where status = 'scheduled'
  and confirmation_status = 'pending';

alter table public.appointments
  drop constraint if exists appointments_status_check;

alter table public.appointments
  add constraint appointments_status_check
  check (status in ('scheduled', 'cancelled', 'not_yet_confirmed'));
