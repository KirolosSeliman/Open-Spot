-- Prevent Smart SMS decision audit regression.
-- Additive only: protects sent/claimed recipient decisions from unsafe updates.

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

  if old.sent_at is not null and (
    new.manual_override is distinct from old.manual_override
    or new.final_decision is distinct from old.final_decision
    or new.base_decision is distinct from old.base_decision
    or new.reason_codes is distinct from old.reason_codes
    or new.reason_label is distinct from old.reason_label
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
