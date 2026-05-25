# Security Audit

## Verdict

Not beta-launch ready for live merchants yet. The repository is now safer than the initial empty state, but live use requires Supabase project verification, real auth flows, provider webhook verification, and end-to-end persistence testing.

## Findings Fixed During Phase 8

- Manual validation API no longer uses the service-role client. It calls the validation RPC through the authenticated Supabase server client so RLS and `auth.uid()` apply.
- Public waitlist writes stay behind a server route and atomic database function; no anonymous table grants were added.
- Real SMS providers fail closed until credentials and webhook verification are configured.
- Production environment validation blocks real SMS providers unless `ALLOW_REAL_SMS_SENDS=true`.

## Security Checks

- Secrets: no real secrets found in tracked files. `.env.example` contains placeholders only.
- Service role exposure: `SUPABASE_SERVICE_ROLE_KEY` is not prefixed with `NEXT_PUBLIC_`.
- RLS: migration files enable RLS on organization-scoped business tables.
- Tenant isolation: policies use organization membership helpers and avoid user-editable metadata.
- Public waitlist: does not expose customer or merchant tables directly.
- Consent: `needs_consent` and `opted_out` are excluded by tested eligibility logic.
- STOP handling: inbound classifier recognizes STOP, UNSUBSCRIBE, CANCEL, ARRET, and accented ARRÊT.
- Admin: admin pages do not show platform data unless platform admin config is present, but full platform-admin auth enforcement still needs implementation.
- File import: CSV parsing is tested, but large-file streaming and browser-freezing safeguards are not complete.

## Remaining Security Risks

- Supabase migrations were not applied to a live or local Supabase database in this environment.
- RLS policies were reviewed statically, not verified with real users from multiple organizations.
- SMS provider webhook signature verification is not implemented for Plivo/Twilio yet.
- `/api/sms/send-opening` is intentionally not wired to real persistence/sending.
- Rate limiting is modeled but not enforced at the API edge yet.
- Legal pages are placeholders and require legal review.

## Required Before Beta

1. Apply migrations to a Supabase staging project.
2. Run RLS tests with two organizations and multiple roles.
3. Implement real sign-up, login, organization creation, and membership bootstrap.
4. Implement provider signature verification before real SMS webhooks.
5. Add API rate limits for public waitlist and SMS webhook endpoints.
6. Verify audit logs for import, consent, send, validation, billing, and settings changes.
