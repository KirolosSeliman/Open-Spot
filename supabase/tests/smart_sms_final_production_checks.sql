begin;

do $$
declare
  guard_source text;
  protected_tables text[] := array[
    'customer_sms_preferences',
    'customer_activity_events',
    'alert_recipient_decisions'
  ];
  protected_table text;
begin
  foreach protected_table in array protected_tables loop
    if to_regclass(format('public.%I', protected_table)) is null then
      raise exception 'Missing Smart SMS table public.%', protected_table;
    end if;

    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = protected_table
        and c.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', protected_table;
    end if;

    if exists (
      select 1
      from information_schema.role_table_grants rtg
      where rtg.table_schema = 'public'
        and rtg.table_name = protected_table
        and grantee = 'anon'
        and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
    ) then
      raise exception 'Anon has direct Smart SMS privileges on public.%', protected_table;
    end if;

    if exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = protected_table
        and cmd = 'DELETE'
    ) then
      raise exception 'Unexpected DELETE RLS policy on public.%', protected_table;
    end if;
  end loop;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'alert_recipient_decisions'
      and column_name = 'recommendation_rank'
  ) then
    raise exception 'Missing recommendation_rank on alert_recipient_decisions';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'alert_recipient_decisions'
      and column_name = 'recommendation_bucket'
  ) then
    raise exception 'Missing recommendation_bucket on alert_recipient_decisions';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'alert_recipient_decisions_customer_org_fk'
  ) then
    raise exception 'Missing multi-tenant customer FK guard';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'alert_recipient_decisions_alert_org_fk'
  ) then
    raise exception 'Missing multi-tenant opening FK guard';
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'opening_offer_status'
      and e.enumlabel = 'invalid'
  ) then
    raise exception 'opening_offer_status must support invalid prepared offers';
  end if;

  select p.prosrc
    into guard_source
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private'
    and p.proname = 'prevent_alert_recipient_decision_audit_regression';

  if guard_source is null then
    raise exception 'Missing alert recipient decision audit guard function';
  end if;

  if guard_source not ilike '%pending_send%'
    or guard_source not ilike '%failed%'
    or guard_source not ilike '%new.final_decision is distinct from old.final_decision%'
    or guard_source not ilike '%new.manual_override is distinct from old.manual_override%'
    or guard_source not ilike '%old.delivery_status is not null and new.delivery_status is null%'
    or guard_source not ilike '%base_decision = ''locked_blocked''%'
    or guard_source not ilike '%final_decision = ''send''%'
  then
    raise exception 'Alert recipient decision audit guard does not cover claimed decision immutability';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'prevent_alert_recipient_decision_audit_regression'
      and tgrelid = 'public.alert_recipient_decisions'::regclass
      and not tgisinternal
  ) then
    raise exception 'Missing alert recipient decision audit guard trigger';
  end if;
end $$;

rollback;
