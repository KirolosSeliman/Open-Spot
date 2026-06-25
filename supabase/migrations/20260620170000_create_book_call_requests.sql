-- Production request-call capture for /book-call/questions.
-- Public submissions go through the server API with service-role access.

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

create table if not exists public.book_call_requests (
  id uuid primary key default gen_random_uuid(),
  locale text not null default 'fr'
    check (locale in ('fr', 'en')),
  full_name text not null
    check (char_length(btrim(full_name)) between 2 and 120),
  business_name text not null
    check (char_length(btrim(business_name)) between 2 and 160),
  email text not null
    check (char_length(btrim(email)) between 3 and 254),
  phone text not null
    check (char_length(btrim(phone)) between 7 and 25),
  business_type text
    check (business_type is null or char_length(btrim(business_type)) <= 120),
  current_booking_system text
    check (
      current_booking_system is null
      or char_length(btrim(current_booking_system)) <= 160
    ),
  cancellation_volume text
    check (
      cancellation_volume is null
      or char_length(btrim(cancellation_volume)) <= 120
    ),
  preferred_time_message text
    check (
      preferred_time_message is null
      or char_length(preferred_time_message) <= 1000
    ),
  consent_sms_email boolean not null default false,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'closed', 'spam')),
  source_path text not null default '/book-call/questions',
  source_url text,
  user_agent text,
  internal_notes text
    check (internal_notes is null or char_length(internal_notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  contacted_at timestamptz,
  constraint book_call_requests_consent_required_check
    check (consent_sms_email is true)
);

create index if not exists book_call_requests_created_at_idx
  on public.book_call_requests (created_at desc);
create index if not exists book_call_requests_status_idx
  on public.book_call_requests (status);
create index if not exists book_call_requests_email_idx
  on public.book_call_requests (lower(email));

drop trigger if exists set_book_call_requests_updated_at
  on public.book_call_requests;
create trigger set_book_call_requests_updated_at
before update on public.book_call_requests
for each row
execute function private.set_updated_at();

alter table public.book_call_requests enable row level security;

revoke all privileges on table public.book_call_requests from public;
revoke all privileges on table public.book_call_requests from anon;
revoke all privileges on table public.book_call_requests from authenticated;

comment on table public.book_call_requests is
  'Platform-owned call requests captured from /book-call/questions. Public users submit through the server API only.';
