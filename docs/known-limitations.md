# Known Limitations

## Not Yet Launch Ready

Open Spot is not ready for live merchant beta until the items below are completed and verified.

## Major Gaps

- Real Supabase project connection may not be available in every local agent
  environment. Migrations must still be applied and verified against the linked
  Supabase project before beta use.
- Supabase Auth UI and server actions now exist for email/password sign-up, sign-in, and sign-out.
- Organization creation and owner bootstrap are implemented through an authenticated RPC that creates organization, owner membership, billing settings, and audit records transactionally.
- Organization switching is not implemented; each user is temporarily limited to one organization membership, and the first membership is used as the active organization.
- Dashboard pages use real organization-scoped Supabase data for core services,
  customers, waitlist, openings, and simulated messages. Some secondary pages may
  still need deeper real-data replacement and manual QA.
- CSV and copy-paste customer import persistence are connected to Supabase and
  preserve opted-out consent state.
- Public QR waitlist signup is connected through controlled server/RPC logic and
  must be verified in the linked Supabase project after migrations.
- Opening creation persistence is connected to Supabase and prepares eligible
  opted-in recipients as opening offers.
- Outbound SMS simulator/provider workflow is intentionally excluded from the
  current task. The standalone send-opening API route still fails closed for
  real provider sending.
- Plivo and Twilio providers intentionally fail closed.
- Provider webhook signature verification is not implemented.
- Inbound SMS webhook persistence is incomplete: it classifies inbound messages
  and verifies the configured provider signature path, but STOP/reply persistence
  still needs the dedicated inbound phase.
- Admin authorization is not fully enforced beyond locked/unconfigured states.
- Stripe billing is not implemented.
- Legal pages are practical placeholders and not lawyer-reviewed.

## Manual QA Not Fully Possible Yet

The complete flow cannot be manually verified without Supabase staging data:

1. Merchant sign-up.
2. Organization creation and owner bootstrap with the real Supabase project.
3. Customer import persistence and opted-out preservation.
4. QR waitlist persistence.
5. Opening persistence and eligible recipient preparation.
6. Simulated SMS send persistence.
7. Inbound reply persistence.
8. Manual validation with confirmed booking and commission record.

## Safe Current Use

Safe for local development and continued implementation:

- Documentation foundation.
- Next.js route skeleton.
- Supabase Auth and organization onboarding code paths, when the required environment variables and migrations are configured.
- Tested domain utilities for phone normalization, consent mapping, CSV parsing, eligibility, SMS classification, commission estimates, and cost controls.
- Simulator-safe opening send behavior that writes simulated message records and
  avoids real provider sends.
