-- Persist provider delivery callback details without changing existing SMS
-- message history. "sent" is not equivalent to "delivered"; delivery proof
-- comes from provider callbacks.

alter table public.sms_messages
  add column if not exists error_code text,
  add column if not exists status_callback_received_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists provider_status_payload jsonb;

create index if not exists sms_messages_twilio_delivery_lookup_idx
  on public.sms_messages(provider, provider_message_id, direction)
  where provider = 'twilio' and provider_message_id is not null;

create index if not exists sms_messages_delivery_attention_idx
  on public.sms_messages(organization_id, status, status_callback_received_at, created_at)
  where direction = 'outbound';
