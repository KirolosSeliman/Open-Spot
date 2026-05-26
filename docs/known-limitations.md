# Known Limitations

## Not Yet Launch Ready

2e Chance RDV is not ready for live merchant beta until the items below are completed and verified.

## Major Gaps

- Real Supabase project connection was not available in this environment.
- Migrations were statically reviewed but not applied.
- Supabase Auth UI and server actions now exist for email/password sign-up, sign-in, and sign-out.
- Organization creation and owner bootstrap are implemented through a controlled server action that verifies the current user and uses the server-only service role for the first organization/member write.
- Organization switching is not implemented; the first membership is used as the active organization.
- Dashboard pages mostly render operational shells and empty states.
- CSV import persistence is not connected to Supabase yet.
- Opening creation persistence is not connected to Supabase yet.
- SMS send-opening route fails closed and does not send real SMS.
- Plivo and Twilio providers intentionally fail closed.
- Provider webhook signature verification is not implemented.
- Admin authorization is not fully enforced beyond locked/unconfigured states.
- Stripe billing is not implemented.
- Legal pages are practical placeholders and not lawyer-reviewed.

## Manual QA Not Fully Possible Yet

The complete flow cannot be manually verified without Supabase staging data:

1. Merchant sign-up.
2. Organization creation and owner bootstrap with the real Supabase project.
3. Customer import persistence.
4. QR waitlist persistence.
5. Opening persistence.
6. Simulated SMS send persistence.
7. Inbound reply persistence.
8. Manual validation with confirmed booking and commission record.

## Safe Current Use

Safe for local development and continued implementation:

- Documentation foundation.
- Next.js route skeleton.
- Supabase Auth and organization onboarding code paths, when the required environment variables and migrations are configured.
- Tested domain utilities for phone normalization, consent mapping, CSV parsing, eligibility, SMS classification, commission estimates, and cost controls.
- Simulator-safe API behavior that fails closed when persistence is not configured.
