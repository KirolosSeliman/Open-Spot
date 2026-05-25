# Known Limitations

## Not Yet Launch Ready

2e Chance RDV is not ready for live merchant beta until the items below are completed and verified.

## Major Gaps

- Real Supabase project connection was not available in this environment.
- Migrations were statically reviewed but not applied.
- Auth UI is placeholder-level.
- Organization creation and owner bootstrap are not implemented end-to-end.
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
2. Organization creation.
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
- Tested domain utilities for phone normalization, consent mapping, CSV parsing, eligibility, SMS classification, commission estimates, and cost controls.
- Simulator-safe API behavior that fails closed when persistence is not configured.
