-- Potential client lead capture for the public request-call flow.
-- Public submissions must go through the server route; no anon table access is granted.

create extension if not exists pgcrypto;

create schema if not exists private;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, private, public
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create table if not exists public.potential_clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 100),
  business_name text not null check (char_length(btrim(business_name)) between 2 and 120),
  email text not null check (char_length(btrim(email)) <= 160),
  phone text not null,
  phone_normalized text,
  business_type text not null,
  preferred_contact_method text not null default 'either',
  message text,
  status text not null default 'new',
  source text not null default 'book_call_page',
  source_path text,
  consent_to_contact boolean not null,
  consent_text text not null,
  consented_at timestamptz not null,
  consent_ip text,
  consent_user_agent text,
  confirmation_email_sent_at timestamptz,
  confirmation_email_status text,
  owner_notification_sent_at timestamptz,
  owner_notification_status text,
  last_contacted_at timestamptz,
  last_contact_channel text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint potential_clients_contact_method_check
    check (preferred_contact_method in ('sms', 'email', 'either')),
  constraint potential_clients_status_check
    check (status in ('new', 'contacted', 'call_booked', 'qualified', 'not_a_fit', 'won', 'lost', 'archived')),
  constraint potential_clients_contact_channel_check
    check (last_contact_channel is null or last_contact_channel in ('sms', 'email', 'phone', 'other')),
  constraint potential_clients_email_status_check
    check (confirmation_email_status is null or confirmation_email_status in ('pending', 'sent', 'failed', 'skipped')),
  constraint potential_clients_owner_email_status_check
    check (owner_notification_status is null or owner_notification_status in ('pending', 'sent', 'failed', 'skipped')),
  constraint potential_clients_message_length_check
    check (message is null or char_length(message) <= 500),
  constraint potential_clients_notes_length_check
    check (notes is null or char_length(notes) <= 2000),
  constraint potential_clients_consent_required_check
    check (consent_to_contact is true)
);

create index if not exists potential_clients_created_at_idx
  on public.potential_clients(created_at desc);
create index if not exists potential_clients_status_idx
  on public.potential_clients(status);
create index if not exists potential_clients_email_idx
  on public.potential_clients(email);
create index if not exists potential_clients_phone_idx
  on public.potential_clients(phone);
create index if not exists potential_clients_business_type_idx
  on public.potential_clients(business_type);

drop trigger if exists set_potential_clients_updated_at on public.potential_clients;
create trigger set_potential_clients_updated_at
before update on public.potential_clients
for each row execute function private.set_updated_at();

alter table public.potential_clients enable row level security;

revoke all privileges on table public.potential_clients from public;
revoke all privileges on table public.potential_clients from anon;
revoke all privileges on table public.potential_clients from authenticated;

comment on table public.potential_clients is
  'Platform-owned sales leads captured from the public request-call flow. Access is server-side only.';
