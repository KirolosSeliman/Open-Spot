-- Phase 06: Trace openings created from appointment SMS cancellations.
-- Additive only and duplicate-safe.

alter table public.openings
  add column if not exists source text not null default 'manual',
  add column if not exists source_appointment_id uuid references public.appointments(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'openings_source_check'
      and conrelid = 'public.openings'::regclass
  ) then
    alter table public.openings
      add constraint openings_source_check
      check (source in ('manual', 'appointment_cancellation'));
  end if;
end $$;

create unique index if not exists openings_unique_source_appointment_idx
  on public.openings(organization_id, source_appointment_id)
  where source_appointment_id is not null
    and source = 'appointment_cancellation';
