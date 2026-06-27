-- Platform SMS logs for Open Spot administrative messages (book call confirmations,
-- billing payment reminders). Separate from merchant-to-customer sms_messages.

create table if not exists public.platform_sms_messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'platform',
  message_type text not null,
  provider text not null,
  provider_message_id text,
  from_number text not null,
  to_number text not null,
  body text not null,
  status text not null,
  error_message text,
  organization_id uuid references public.organizations(id) on delete set null,
  book_call_request_id uuid references public.book_call_requests(id) on delete set null,
  billing_id uuid references public.organization_billing_settings(id) on delete set null,
  recipient_type text not null,
  recipient_name text,
  sent_by_platform_admin_id uuid references public.platform_admins(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint platform_sms_messages_channel_check check (channel = 'platform'),
  constraint platform_sms_messages_message_type_check check (
    message_type in ('book_call_confirmation', 'billing_payment_reminder')
  ),
  constraint platform_sms_messages_recipient_type_check check (
    recipient_type in ('prospect', 'business_contact')
  )
);

create index if not exists platform_sms_messages_book_call_idx
  on public.platform_sms_messages (book_call_request_id, message_type)
  where book_call_request_id is not null;

create index if not exists platform_sms_messages_org_billing_idx
  on public.platform_sms_messages (organization_id, message_type, created_at desc)
  where organization_id is not null;

create index if not exists platform_sms_messages_to_number_idx
  on public.platform_sms_messages (to_number, created_at desc);

alter table public.platform_sms_messages enable row level security;

revoke all privileges on table public.platform_sms_messages from anon;
revoke all privileges on table public.platform_sms_messages from authenticated;
revoke all privileges on table public.platform_sms_messages from public;

alter table public.billing_events
drop constraint if exists billing_events_event_type_check;

alter table public.billing_events
add constraint billing_events_event_type_check check (
  event_type in (
    'billing_created',
    'payment_link_sent',
    'marked_paid',
    'marked_past_due',
    'cancelled',
    'status_changed',
    'note_added',
    'plan_updated',
    'payment_reminder_sent'
  )
);
