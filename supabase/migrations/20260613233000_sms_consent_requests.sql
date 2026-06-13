alter table public.sms_messages
add column if not exists message_type text;

create table if not exists public.sms_consent_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  status text not null default 'pending',
  phone_e164 text not null,
  language text not null default 'fr',
  outbound_sms_message_id uuid references public.sms_messages(id) on delete set null,
  inbound_sms_message_id uuid references public.sms_messages(id) on delete set null,
  provider text,
  provider_message_id text,
  message_body text not null,
  sent_at timestamptz,
  responded_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sms_consent_requests_status_check check (
    status in ('pending', 'sent', 'accepted', 'declined', 'failed', 'expired')
  ),
  constraint sms_consent_requests_language_check check (language in ('fr', 'en')),
  constraint sms_consent_requests_phone_e164_format check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$')
);

create index if not exists sms_consent_requests_org_idx
on public.sms_consent_requests (organization_id, created_at desc);

create index if not exists sms_consent_requests_customer_idx
on public.sms_consent_requests (customer_id, created_at desc);

create index if not exists sms_consent_requests_status_idx
on public.sms_consent_requests (organization_id, status, created_at desc);

create index if not exists sms_consent_requests_provider_message_idx
on public.sms_consent_requests (provider, provider_message_id);

create index if not exists sms_messages_message_type_idx
on public.sms_messages (organization_id, message_type, created_at desc)
where message_type is not null;

drop trigger if exists set_sms_consent_requests_updated_at on public.sms_consent_requests;
create trigger set_sms_consent_requests_updated_at
before update on public.sms_consent_requests
for each row execute function private.set_updated_at();

alter table public.sms_consent_requests enable row level security;

revoke all privileges on table public.sms_consent_requests from anon;
revoke all privileges on table public.sms_consent_requests from public;
grant select, insert, update on public.sms_consent_requests to authenticated;

create policy "members can read sms consent requests"
on public.sms_consent_requests for select to authenticated
using (private.is_org_member(organization_id));

create policy "owners and managers can insert sms consent requests"
on public.sms_consent_requests for insert to authenticated
with check (
  private.has_org_role(
    organization_id,
    array['owner', 'manager']::public.organization_role[]
  )
);

create policy "owners and managers can update sms consent requests"
on public.sms_consent_requests for update to authenticated
using (
  private.has_org_role(
    organization_id,
    array['owner', 'manager']::public.organization_role[]
  )
)
with check (
  private.has_org_role(
    organization_id,
    array['owner', 'manager']::public.organization_role[]
  )
);
