-- Final production hardening for Smart SMS recipient decisions.
-- Additive only: preserves existing decisions, offers, SMS messages, and audit history.

alter table public.alert_recipient_decisions
  add column if not exists recommendation_rank integer,
  add column if not exists recommendation_bucket text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.alert_recipient_decisions'::regclass
      and conname = 'alert_recipient_decisions_recommendation_bucket_check'
  ) then
    alter table public.alert_recipient_decisions
      add constraint alert_recipient_decisions_recommendation_bucket_check
      check (
        recommendation_bucket is null
        or recommendation_bucket in ('eligible', 'protected', 'locked')
      );
  end if;
end $$;

create index if not exists alert_recipient_decisions_recommendation_idx
on public.alert_recipient_decisions (
  organization_id,
  alert_id,
  recommendation_rank,
  created_at
);

create or replace function private.prevent_alert_recipient_decision_audit_regression()
returns trigger
language plpgsql
set search_path = pg_catalog, private, public
as $$
begin
  if new.base_decision = 'locked_blocked' and new.final_decision = 'send' then
    raise exception 'locked_blocked alert recipient decisions cannot be sent';
  end if;

  if old.sent_at is not null and new.sent_at is null then
    raise exception 'alert recipient decision sent_at cannot be cleared';
  end if;

  if old.twilio_message_sid is not null
     and new.twilio_message_sid is distinct from old.twilio_message_sid then
    raise exception 'alert recipient decision provider message id cannot change after being set';
  end if;

  if old.delivery_status is not null and new.delivery_status is null then
    raise exception 'alert recipient decision delivery_status cannot be cleared';
  end if;

  if old.delivery_status in (
    'pending_send',
    'accepted',
    'queued',
    'sending',
    'sent',
    'delivered',
    'submitted_to_provider',
    'simulated',
    'failed'
  ) and (
    new.base_decision is distinct from old.base_decision
    or new.final_decision is distinct from old.final_decision
    or new.manual_override is distinct from old.manual_override
    or new.reason_codes is distinct from old.reason_codes
    or new.reason_label is distinct from old.reason_label
    or new.warning_required is distinct from old.warning_required
    or new.manually_overridden is distinct from old.manually_overridden
    or new.override_reason is distinct from old.override_reason
    or new.overridden_by is distinct from old.overridden_by
    or new.recommendation_rank is distinct from old.recommendation_rank
    or new.recommendation_bucket is distinct from old.recommendation_bucket
  ) then
    raise exception 'claimed alert recipient decisions cannot be manually changed';
  end if;

  if old.sent_at is not null and (
    new.manual_override is distinct from old.manual_override
    or new.final_decision is distinct from old.final_decision
    or new.base_decision is distinct from old.base_decision
    or new.reason_codes is distinct from old.reason_codes
    or new.reason_label is distinct from old.reason_label
    or new.warning_required is distinct from old.warning_required
    or new.manually_overridden is distinct from old.manually_overridden
    or new.override_reason is distinct from old.override_reason
    or new.overridden_by is distinct from old.overridden_by
  ) then
    raise exception 'sent alert recipient decisions cannot be manually changed';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_alert_recipient_decision_audit_regression
on public.alert_recipient_decisions;

create trigger prevent_alert_recipient_decision_audit_regression
before update on public.alert_recipient_decisions
for each row
execute function private.prevent_alert_recipient_decision_audit_regression();
