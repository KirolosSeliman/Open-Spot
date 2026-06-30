-- Enforce inbound webhook idempotency at the database layer.
-- The application already checks provider_message_id before insert; this unique
-- index closes the concurrent duplicate webhook race window.

create unique index if not exists sms_messages_inbound_provider_message_unique_idx
on public.sms_messages (provider, provider_message_id)
where direction = 'inbound'
  and provider_message_id is not null;
