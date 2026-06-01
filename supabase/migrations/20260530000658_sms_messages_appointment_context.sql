-- Phase 05: Preserve appointment context for reminder SMS replies.
-- Additive only: enables inbound OUI/NON replies to mutate the correct appointment.

alter table public.sms_messages
  add column if not exists appointment_id uuid references public.appointments(id) on delete set null;

create index if not exists sms_messages_org_appointment_created_idx
  on public.sms_messages(organization_id, appointment_id, created_at)
  where appointment_id is not null;
