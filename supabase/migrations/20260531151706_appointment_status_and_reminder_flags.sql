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

alter table public.appointments
  drop constraint if exists appointments_status_check;

alter table public.appointments
  add constraint appointments_status_check
  check (status in ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show'));
