-- Public waitlist reads and writes are served by server-side code using the
-- service role. The browser should not receive direct anon table access.

revoke all privileges on table public.organizations from anon;
revoke all privileges on table public.organization_members from anon;
revoke all privileges on table public.services from anon;
revoke all privileges on table public.customers from anon;
revoke all privileges on table public.sms_consents from anon;
revoke all privileges on table public.waitlist_entries from anon;
revoke all privileges on table public.waitlist_entry_services from anon;
revoke all privileges on table public.import_batches from anon;
revoke all privileges on table public.openings from anon;
revoke all privileges on table public.opening_offers from anon;
revoke all privileges on table public.booking_requests from anon;
revoke all privileges on table public.sms_messages from anon;
revoke all privileges on table public.audit_logs from anon;

revoke all privileges on table public.organizations from public;
revoke all privileges on table public.organization_members from public;
revoke all privileges on table public.services from public;
revoke all privileges on table public.customers from public;
revoke all privileges on table public.sms_consents from public;
revoke all privileges on table public.waitlist_entries from public;
revoke all privileges on table public.waitlist_entry_services from public;
revoke all privileges on table public.import_batches from public;
revoke all privileges on table public.openings from public;
revoke all privileges on table public.opening_offers from public;
revoke all privileges on table public.booking_requests from public;
revoke all privileges on table public.sms_messages from public;
revoke all privileges on table public.audit_logs from public;

grant select, insert, update on public.organizations to authenticated;
grant select, insert, update on public.organization_members to authenticated;
grant select, insert, update on public.services to authenticated;
grant select, insert, update on public.customers to authenticated;
grant select, insert, update on public.sms_consents to authenticated;
grant select, insert, update on public.waitlist_entries to authenticated;
grant select, insert, delete on public.waitlist_entry_services to authenticated;
grant select, insert, update on public.import_batches to authenticated;
grant select, insert, update on public.openings to authenticated;
grant select, insert, update on public.opening_offers to authenticated;
grant select, insert, update on public.booking_requests to authenticated;
grant select, insert, update on public.sms_messages to authenticated;
grant select, insert, update on public.audit_logs to authenticated;
