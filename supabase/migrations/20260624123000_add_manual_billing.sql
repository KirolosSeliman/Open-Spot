-- Manual billing management for first paying Open Spot clients.
-- This extends the existing organization_billing_settings table instead of
-- introducing a parallel billing source of truth.

update public.organization_billing_settings
set billing_status = 'unpaid'
where billing_status in ('not_configured', 'inactive', '');

alter table public.organization_billing_settings
alter column billing_status set default 'unpaid';

alter table public.organization_billing_settings
add column if not exists plan_name text not null default 'Founder Pilot',
add column if not exists billing_interval text not null default 'monthly',
add column if not exists payment_method text not null default 'manual_external',
add column if not exists external_payment_url text,
add column if not exists external_customer_reference text,
add column if not exists last_payment_at timestamptz,
add column if not exists current_period_start timestamptz,
add column if not exists current_period_end timestamptz,
add column if not exists next_payment_due_at timestamptz,
add column if not exists cancelled_at timestamptz,
add column if not exists internal_notes text,
add column if not exists stripe_customer_id text,
add column if not exists stripe_subscription_id text,
add column if not exists stripe_payment_link_id text,
add column if not exists stripe_invoice_id text;

alter table public.organization_billing_settings
drop constraint if exists organization_billing_settings_billing_status_check;

alter table public.organization_billing_settings
add constraint organization_billing_settings_billing_status_check
check (
  billing_status in (
    'unpaid',
    'payment_link_sent',
    'paid',
    'past_due',
    'cancelled',
    'comped',
    'trial'
  )
);

alter table public.organization_billing_settings
drop constraint if exists organization_billing_settings_billing_interval_check;

alter table public.organization_billing_settings
add constraint organization_billing_settings_billing_interval_check
check (billing_interval in ('monthly', 'yearly', 'one_time', 'custom'));

alter table public.organization_billing_settings
drop constraint if exists organization_billing_settings_payment_method_check;

alter table public.organization_billing_settings
add constraint organization_billing_settings_payment_method_check
check (
  payment_method in (
    'manual_external',
    'stripe_payment_link',
    'stripe_invoice',
    'interac',
    'other'
  )
);

alter table public.organization_billing_settings
drop constraint if exists organization_billing_settings_plan_name_check;

alter table public.organization_billing_settings
add constraint organization_billing_settings_plan_name_check
check (char_length(btrim(plan_name)) > 0 and char_length(plan_name) <= 120);

alter table public.organization_billing_settings
drop constraint if exists organization_billing_settings_external_payment_url_check;

alter table public.organization_billing_settings
add constraint organization_billing_settings_external_payment_url_check
check (
  external_payment_url is null
  or external_payment_url ~* '^https://[^[:space:]]+$'
);

alter table public.organization_billing_settings
drop constraint if exists organization_billing_settings_manual_price_check;

alter table public.organization_billing_settings
add constraint organization_billing_settings_manual_price_check
check (base_plan_amount_cents >= 0);

alter table public.organization_billing_settings
drop constraint if exists organization_billing_settings_manual_currency_check;

alter table public.organization_billing_settings
add constraint organization_billing_settings_manual_currency_check
check (char_length(base_plan_currency) = 3);

create index if not exists organization_billing_settings_status_idx
on public.organization_billing_settings (billing_status, updated_at desc);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  billing_id uuid references public.organization_billing_settings(id) on delete set null,
  event_type text not null,
  old_status text,
  new_status text,
  amount_cents integer check (amount_cents is null or amount_cents >= 0),
  currency char(3) not null default 'CAD',
  note text,
  created_by uuid references public.platform_admins(id) on delete set null,
  created_at timestamptz not null default now(),

  constraint billing_events_event_type_check check (
    event_type in (
      'billing_created',
      'payment_link_sent',
      'marked_paid',
      'marked_past_due',
      'cancelled',
      'status_changed',
      'note_added',
      'plan_updated'
    )
  ),
  constraint billing_events_currency_check check (char_length(currency) = 3)
);

create index if not exists billing_events_org_created_idx
on public.billing_events (organization_id, created_at desc);

create index if not exists billing_events_status_idx
on public.billing_events (organization_id, new_status, created_at desc);

alter table public.billing_events enable row level security;

revoke all privileges on table public.billing_events from anon;
revoke all privileges on table public.billing_events from public;
grant select on public.billing_events to authenticated;

drop policy if exists "members can read billing events" on public.billing_events;
create policy "members can read billing events"
on public.billing_events for select to authenticated
using (private.has_org_role(organization_id, array['owner', 'manager']::public.organization_role[]));

-- Billing status and plan/price mutations are platform-admin only through
-- service-role server actions. Merchants can read a limited summary but cannot
-- write billing state through the Data API.
revoke insert, update on public.organization_billing_settings from authenticated;

drop policy if exists "owners and managers can update billing settings"
on public.organization_billing_settings;

create or replace function public.admin_update_manual_billing_status(
  target_organization_id uuid,
  target_billing_status text,
  target_event_type text,
  target_admin_id uuid,
  target_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.organization_billing_settings%rowtype;
  target_billing_id uuid;
  now_value timestamptz := now();
  next_period_end timestamptz;
begin
  if target_billing_status not in (
    'unpaid',
    'payment_link_sent',
    'paid',
    'past_due',
    'cancelled',
    'comped',
    'trial'
  ) then
    raise exception 'Invalid billing status';
  end if;

  if target_event_type not in (
    'payment_link_sent',
    'marked_paid',
    'marked_past_due',
    'cancelled',
    'status_changed'
  ) then
    raise exception 'Invalid billing event type';
  end if;

  select *
  into existing
  from public.organization_billing_settings
  where organization_id = target_organization_id
  for update;

  if not found then
    insert into public.organization_billing_settings (
      organization_id,
      billing_status,
      plan_name,
      base_plan_amount_cents,
      base_plan_currency,
      billing_interval,
      payment_method
    )
    values (
      target_organization_id,
      'unpaid',
      'Founder Pilot',
      14900,
      'CAD',
      'monthly',
      'manual_external'
    )
    returning * into existing;

    insert into public.billing_events (
      organization_id,
      billing_id,
      event_type,
      new_status,
      amount_cents,
      currency,
      note,
      created_by
    )
    values (
      target_organization_id,
      existing.id,
      'billing_created',
      existing.billing_status,
      existing.base_plan_amount_cents,
      existing.base_plan_currency,
      'Manual billing record created.',
      target_admin_id
    );
  end if;

  if existing.billing_interval = 'yearly' then
    next_period_end := now_value + interval '1 year';
  elsif existing.billing_interval = 'monthly' then
    next_period_end := now_value + interval '1 month';
  else
    next_period_end := null;
  end if;

  update public.organization_billing_settings
  set
    billing_status = target_billing_status,
    last_payment_at = case
      when target_billing_status = 'paid' then now_value
      else last_payment_at
    end,
    current_period_start = case
      when target_billing_status = 'paid' then coalesce(current_period_start, now_value)
      else current_period_start
    end,
    current_period_end = case
      when target_billing_status = 'paid' then coalesce(current_period_end, next_period_end)
      else current_period_end
    end,
    next_payment_due_at = case
      when target_billing_status = 'paid' then coalesce(current_period_end, next_period_end)
      else next_payment_due_at
    end,
    cancelled_at = case
      when target_billing_status = 'paid' then null
      when target_billing_status = 'cancelled' then now_value
      else cancelled_at
    end
  where id = existing.id
  returning id into target_billing_id;

  insert into public.billing_events (
    organization_id,
    billing_id,
    event_type,
    old_status,
    new_status,
    amount_cents,
    currency,
    note,
    created_by
  )
  values (
    target_organization_id,
    target_billing_id,
    target_event_type,
    existing.billing_status,
    target_billing_status,
    case when target_billing_status = 'paid' then existing.base_plan_amount_cents else null end,
    existing.base_plan_currency,
    target_note,
    target_admin_id
  );

  return target_billing_id;
end;
$$;

create or replace function public.admin_update_manual_billing_plan(
  target_organization_id uuid,
  target_admin_id uuid,
  target_plan_name text,
  target_amount_cents integer,
  target_currency text,
  target_billing_interval text,
  target_payment_method text,
  target_external_payment_url text default null,
  target_external_customer_reference text default null,
  target_internal_notes text default null,
  target_stripe_customer_id text default null,
  target_stripe_subscription_id text default null,
  target_stripe_payment_link_id text default null,
  target_stripe_invoice_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.organization_billing_settings%rowtype;
  target_billing_id uuid;
  old_status text;
begin
  select *
  into existing
  from public.organization_billing_settings
  where organization_id = target_organization_id
  for update;

  if not found then
    insert into public.organization_billing_settings (
      organization_id,
      billing_status,
      plan_name,
      base_plan_amount_cents,
      base_plan_currency,
      billing_interval,
      payment_method,
      external_payment_url,
      external_customer_reference,
      internal_notes,
      stripe_customer_id,
      stripe_subscription_id,
      stripe_payment_link_id,
      stripe_invoice_id
    )
    values (
      target_organization_id,
      'unpaid',
      target_plan_name,
      target_amount_cents,
      target_currency,
      target_billing_interval,
      target_payment_method,
      target_external_payment_url,
      target_external_customer_reference,
      target_internal_notes,
      target_stripe_customer_id,
      target_stripe_subscription_id,
      target_stripe_payment_link_id,
      target_stripe_invoice_id
    )
    returning * into existing;

    insert into public.billing_events (
      organization_id,
      billing_id,
      event_type,
      new_status,
      amount_cents,
      currency,
      note,
      created_by
    )
    values (
      target_organization_id,
      existing.id,
      'billing_created',
      existing.billing_status,
      existing.base_plan_amount_cents,
      existing.base_plan_currency,
      'Manual billing record created.',
      target_admin_id
    );
  else
    update public.organization_billing_settings
    set
      plan_name = target_plan_name,
      base_plan_amount_cents = target_amount_cents,
      base_plan_currency = target_currency,
      billing_interval = target_billing_interval,
      payment_method = target_payment_method,
      external_payment_url = target_external_payment_url,
      external_customer_reference = target_external_customer_reference,
      internal_notes = target_internal_notes,
      stripe_customer_id = target_stripe_customer_id,
      stripe_subscription_id = target_stripe_subscription_id,
      stripe_payment_link_id = target_stripe_payment_link_id,
      stripe_invoice_id = target_stripe_invoice_id
    where id = existing.id
    returning * into existing;
  end if;

  target_billing_id := existing.id;
  old_status := existing.billing_status;

  insert into public.billing_events (
    organization_id,
    billing_id,
    event_type,
    old_status,
    new_status,
    amount_cents,
    currency,
    note,
    created_by
  )
  values (
    target_organization_id,
    target_billing_id,
    'plan_updated',
    old_status,
    existing.billing_status,
    target_amount_cents,
    target_currency,
    target_internal_notes,
    target_admin_id
  );

  return target_billing_id;
end;
$$;

revoke all on function public.admin_update_manual_billing_status(
  uuid,
  text,
  text,
  uuid,
  text
) from public, anon, authenticated;
revoke all on function public.admin_update_manual_billing_plan(
  uuid,
  uuid,
  text,
  integer,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.admin_update_manual_billing_status(
  uuid,
  text,
  text,
  uuid,
  text
) to service_role;
grant execute on function public.admin_update_manual_billing_plan(
  uuid,
  uuid,
  text,
  integer,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to service_role;
