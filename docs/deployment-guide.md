# Deployment Guide

## Required Services

- Vercel for the Next.js app.
- Supabase for Auth and Postgres.
- SMS provider later: simulator first, Plivo or Twilio only after webhook verification.
- Stripe later, only when billing secrets and webhook verification are configured.

## Environment Variables

Configure these in Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SMS_PROVIDER=simulator
ALLOW_REAL_SMS_SENDS=false
APP_BASE_URL=
PLATFORM_ADMIN_EMAILS=
```

Provider-specific values remain empty until used:

```text
PLIVO_AUTH_ID=
PLIVO_AUTH_TOKEN=
PLIVO_SOURCE_NUMBER=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_SOURCE_NUMBER=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Migration Order

Apply Supabase migrations in filename order:

1. `20260525180000_phase_2_multi_tenant_foundation.sql`
2. `20260525191500_phase_3_waitlist_signup_rpc.sql`
3. `20260525203000_phase_4_manual_validation_rpc.sql`
4. `20260525214500_phase_7_billing_cost_controls.sql`
5. `20260526001000_phase_2_security_advisor_hardening.sql`
6. `20260526002000_phase_4_organization_bootstrap_rpc.sql`
7. `20260526003000_phase_5_single_org_until_switcher.sql`
8. `20260526004000_phase_6_org_data_quality_audit.sql`

## Migration Tracking Drift

The live Supabase project may already contain the tables, RLS policies, and functions from these migration files even if `supabase migration list` shows no matching remote migration history. That usually means the SQL was applied manually or through a tool path that did not write rows to `supabase_migrations.schema_migrations`.

Do not reset the database, drop tables, or blindly reapply migrations to fix tracking. Preserve existing merchant, waitlist, consent, SMS, booking, commission, and audit data.

Safe owner workflow:

1. Install and authenticate the Supabase CLI.
2. Link the project, if it is not already linked:

```bash
supabase link --project-ref fuksavmwmfqyfmjcbgsx
```

3. Inspect migration history before changing anything:

```bash
supabase migration list --linked
```

4. Confirm the live schema matches each local migration before repairing history. At minimum, verify all expected tables, RLS policies, enums, RPC functions, trigger functions, and the Phase 2 security-advisor hardening are present.
5. After confirming a migration was already applied to the live schema, mark only that migration version as applied. This updates migration history; it does not rerun the SQL:

```bash
supabase migration repair 20260525180000 --status applied --linked
supabase migration repair 20260525191500 --status applied --linked
supabase migration repair 20260525203000 --status applied --linked
supabase migration repair 20260525214500 --status applied --linked
supabase migration repair 20260526001000 --status applied --linked
supabase migration repair 20260526002000 --status applied --linked
supabase migration repair 20260526003000 --status applied --linked
supabase migration repair 20260526004000 --status applied --linked
```

6. Recheck history:

```bash
supabase migration list --linked
```

Only use `supabase db push --linked` after migration history is consistent. If any local migration has not actually been applied live, apply it normally in filename order instead of marking it as applied.

## Verification Commands

Run locally and in CI:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=moderate
```

## Auth and Organization Smoke Test

After deploying with Supabase environment variables and applying all migrations in order:

1. Keep `SMS_PROVIDER=simulator` and `ALLOW_REAL_SMS_SENDS=false`.
2. Visit `/signup`.
3. Create a dedicated test merchant account, not a real merchant account.
4. If Supabase email confirmation is enabled, confirm the email and sign in.
5. Confirm a signed-in user with no organization lands on `/onboarding`.
6. Create an organization with a unique slug, valid email if provided, and a Canadian phone number or valid E.164 number if provided.
7. Confirm `/dashboard` shows the organization name, role `owner`, default language, timezone, service count, and customer count.
8. Confirm a signed-out browser is redirected from `/dashboard` to `/sign-in`.
9. Confirm a signed-in user who already has an organization is redirected away from `/onboarding` to `/dashboard`.
10. In Supabase SQL Editor, verify bootstrap records were created without exposing secrets:

```sql
select role
from public.organization_members
where user_id = '<test-user-id>';

select billing_status, subscription_status
from public.organization_billing_settings
order by created_at desc
limit 1;

select action, entity_type, metadata
from public.audit_logs
where action = 'organization.created'
order by created_at desc
limit 1;
```

The organization bootstrap uses an authenticated RPC and `auth.uid()` inside Postgres. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only for routes that still require it, and never expose this value in client code.

## Webhook URLs

Production URLs once deployed:

- SMS inbound: `https://YOUR_DOMAIN/api/sms/inbound`
- Waitlist signup: `https://YOUR_DOMAIN/api/waitlist`
- Manual validation: authenticated app route calls `/api/openings/[id]/validate`

## Rollback Notes

- App rollback can use Vercel deployment rollback.
- Database rollback is not automated. Take a Supabase backup before applying migrations.
- Avoid hard-deleting customer consent, SMS, booking, commission, or audit records during rollback.
