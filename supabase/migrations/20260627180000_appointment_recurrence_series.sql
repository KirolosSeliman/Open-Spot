-- Additive recurrence support for appointments.
-- Creates one appointment row per occurrence; series metadata lives in appointment_recurrence_series.

create table if not exists public.appointment_recurrence_series (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  timezone text not null,
  frequency text not null,
  interval_count integer not null default 1,
  weekdays text[] null,
  monthly_pattern text null,
  end_type text not null,
  end_after_count integer null,
  end_date timestamptz null,
  max_occurrences integer not null default 100,
  starts_at_local text not null,
  duration_minutes integer not null default 60,
  notes text null,
  send_reminder boolean not null default false,
  request_confirmation boolean not null default false,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_recurrence_series_frequency_check check (
    frequency in ('none', 'daily', 'weekly', 'monthly', 'yearly', 'custom')
  ),
  constraint appointment_recurrence_series_end_type_check check (
    end_type in ('never', 'after', 'until')
  ),
  constraint appointment_recurrence_series_interval_count_check check (
    interval_count between 1 and 99
  ),
  constraint appointment_recurrence_series_max_occurrences_check check (
    max_occurrences between 1 and 100
  ),
  constraint appointment_recurrence_series_end_after_count_check check (
    end_after_count is null or (end_after_count between 1 and 100)
  )
);

alter table public.appointments
  add column if not exists recurrence_series_id uuid references public.appointment_recurrence_series(id) on delete set null,
  add column if not exists recurrence_instance_index integer null,
  add column if not exists recurrence_original_start timestamptz null;

create index if not exists appointments_recurrence_series_idx
  on public.appointments(recurrence_series_id)
  where recurrence_series_id is not null;

create index if not exists appointment_recurrence_series_org_idx
  on public.appointment_recurrence_series(organization_id, created_at desc);

drop trigger if exists set_appointment_recurrence_series_updated_at on public.appointment_recurrence_series;
create trigger set_appointment_recurrence_series_updated_at
before update on public.appointment_recurrence_series
for each row execute function private.set_updated_at();

alter table public.appointment_recurrence_series enable row level security;

revoke all privileges on table public.appointment_recurrence_series from public;
revoke all privileges on table public.appointment_recurrence_series from anon;

grant select, insert, update on public.appointment_recurrence_series to authenticated;

drop policy if exists "members can read appointment recurrence series" on public.appointment_recurrence_series;
create policy "members can read appointment recurrence series"
on public.appointment_recurrence_series for select to authenticated
using (private.is_org_member(organization_id));

drop policy if exists "staff can create appointment recurrence series" on public.appointment_recurrence_series;
create policy "staff can create appointment recurrence series"
on public.appointment_recurrence_series for insert to authenticated
with check (
  private.has_org_role(
    organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  )
);

drop policy if exists "staff can update appointment recurrence series" on public.appointment_recurrence_series;
create policy "staff can update appointment recurrence series"
on public.appointment_recurrence_series for update to authenticated
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
