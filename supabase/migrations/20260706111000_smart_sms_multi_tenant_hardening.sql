-- Smart SMS multi-tenant hardening.
-- Additive only: reinforces organization ownership for Smart SMS tables.

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.customers'::regclass
      and conname = 'customers_id_organization_id_unique'
  ) then
    alter table public.customers
      add constraint customers_id_organization_id_unique
      unique (id, organization_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.openings'::regclass
      and conname = 'openings_id_organization_id_unique'
  ) then
    alter table public.openings
      add constraint openings_id_organization_id_unique
      unique (id, organization_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.appointments'::regclass
      and conname = 'appointments_id_organization_id_unique'
  ) then
    alter table public.appointments
      add constraint appointments_id_organization_id_unique
      unique (id, organization_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.customer_sms_preferences'::regclass
      and conname = 'customer_sms_preferences_customer_org_fk'
  ) then
    alter table public.customer_sms_preferences
      add constraint customer_sms_preferences_customer_org_fk
      foreign key (customer_id, organization_id)
      references public.customers (id, organization_id)
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.customer_activity_events'::regclass
      and conname = 'customer_activity_events_customer_org_fk'
  ) then
    alter table public.customer_activity_events
      add constraint customer_activity_events_customer_org_fk
      foreign key (customer_id, organization_id)
      references public.customers (id, organization_id)
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.alert_recipient_decisions'::regclass
      and conname = 'alert_recipient_decisions_customer_org_fk'
  ) then
    alter table public.alert_recipient_decisions
      add constraint alert_recipient_decisions_customer_org_fk
      foreign key (customer_id, organization_id)
      references public.customers (id, organization_id)
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.alert_recipient_decisions'::regclass
      and conname = 'alert_recipient_decisions_alert_org_fk'
  ) then
    alter table public.alert_recipient_decisions
      add constraint alert_recipient_decisions_alert_org_fk
      foreign key (alert_id, organization_id)
      references public.openings (id, organization_id)
      on delete cascade
      not valid;
  end if;
end $$;

drop policy if exists "members can read customer sms preferences" on public.customer_sms_preferences;
create policy "members can read customer sms preferences"
on public.customer_sms_preferences for select to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.customers c
    where c.id = customer_id
      and c.organization_id = organization_id
  )
);

drop policy if exists "operations team can insert customer sms preferences" on public.customer_sms_preferences;
create policy "operations team can insert customer sms preferences"
on public.customer_sms_preferences for insert to authenticated
with check (
  private.has_org_role(
    organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  )
  and exists (
    select 1 from public.customers c
    where c.id = customer_id
      and c.organization_id = organization_id
  )
);

drop policy if exists "operations team can update customer sms preferences" on public.customer_sms_preferences;
create policy "operations team can update customer sms preferences"
on public.customer_sms_preferences for update to authenticated
using (
  private.has_org_role(
    organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  )
  and exists (
    select 1 from public.customers c
    where c.id = customer_id
      and c.organization_id = organization_id
  )
)
with check (
  private.has_org_role(
    organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  )
  and exists (
    select 1 from public.customers c
    where c.id = customer_id
      and c.organization_id = organization_id
  )
);

drop policy if exists "members can read customer activity events" on public.customer_activity_events;
create policy "members can read customer activity events"
on public.customer_activity_events for select to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.customers c
    where c.id = customer_id
      and c.organization_id = organization_id
  )
);

drop policy if exists "operations team can insert customer activity events" on public.customer_activity_events;
create policy "operations team can insert customer activity events"
on public.customer_activity_events for insert to authenticated
with check (
  private.has_org_role(
    organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  )
  and exists (
    select 1 from public.customers c
    where c.id = customer_id
      and c.organization_id = organization_id
  )
  and (
    related_alert_id is null
    or exists (
      select 1 from public.openings o
      where o.id = related_alert_id
        and o.organization_id = organization_id
    )
  )
  and (
    related_appointment_id is null
    or exists (
      select 1 from public.appointments a
      where a.id = related_appointment_id
        and a.organization_id = organization_id
    )
  )
);

drop policy if exists "members can read alert recipient decisions" on public.alert_recipient_decisions;
create policy "members can read alert recipient decisions"
on public.alert_recipient_decisions for select to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.customers c
    where c.id = customer_id
      and c.organization_id = organization_id
  )
  and exists (
    select 1 from public.openings o
    where o.id = alert_id
      and o.organization_id = organization_id
  )
);

drop policy if exists "operations team can insert alert recipient decisions" on public.alert_recipient_decisions;
create policy "operations team can insert alert recipient decisions"
on public.alert_recipient_decisions for insert to authenticated
with check (
  private.has_org_role(
    organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  )
  and exists (
    select 1 from public.customers c
    where c.id = customer_id
      and c.organization_id = organization_id
  )
  and exists (
    select 1 from public.openings o
    where o.id = alert_id
      and o.organization_id = organization_id
  )
);

drop policy if exists "operations team can update alert recipient decisions" on public.alert_recipient_decisions;
create policy "operations team can update alert recipient decisions"
on public.alert_recipient_decisions for update to authenticated
using (
  private.has_org_role(
    organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  )
  and exists (
    select 1 from public.customers c
    where c.id = customer_id
      and c.organization_id = organization_id
  )
  and exists (
    select 1 from public.openings o
    where o.id = alert_id
      and o.organization_id = organization_id
  )
)
with check (
  private.has_org_role(
    organization_id,
    array['owner', 'manager', 'staff']::public.organization_role[]
  )
  and exists (
    select 1 from public.customers c
    where c.id = customer_id
      and c.organization_id = organization_id
  )
  and exists (
    select 1 from public.openings o
    where o.id = alert_id
      and o.organization_id = organization_id
  )
);
