-- Existing active customers should participate in alert-list eligibility by
-- default. This backfill creates one general active waitlist entry only when an
-- active customer has no active waitlist entry already. It does not alter SMS
-- consent, send messages, or invent service-specific interests.

insert into public.waitlist_entries (
  organization_id,
  customer_id,
  service_id,
  status
)
select
  c.organization_id,
  c.id,
  null,
  'active'::public.waitlist_status
from public.customers c
where c.deleted_at is null
  and not exists (
    select 1
    from public.waitlist_entries w
    where w.organization_id = c.organization_id
      and w.customer_id = c.id
      and w.status = 'active'
  );
