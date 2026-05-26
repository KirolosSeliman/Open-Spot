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

After deploying with Supabase environment variables:

1. Visit `/signup`.
2. Create a test merchant account.
3. If Supabase email confirmation is enabled, confirm the email and sign in.
4. Visit `/onboarding`.
5. Create an organization with a unique slug.
6. Confirm `/dashboard` shows the organization name, role `owner`, default language, timezone, service count, and customer count.
7. Confirm a signed-out browser is redirected from `/dashboard` to `/sign-in`.

The first organization/member bootstrap uses `SUPABASE_SERVICE_ROLE_KEY` server-side only. Never expose this value in client code.

## Webhook URLs

Production URLs once deployed:

- SMS inbound: `https://YOUR_DOMAIN/api/sms/inbound`
- Waitlist signup: `https://YOUR_DOMAIN/api/waitlist`
- Manual validation: authenticated app route calls `/api/openings/[id]/validate`

## Rollback Notes

- App rollback can use Vercel deployment rollback.
- Database rollback is not automated. Take a Supabase backup before applying migrations.
- Avoid hard-deleting customer consent, SMS, booking, commission, or audit records during rollback.
