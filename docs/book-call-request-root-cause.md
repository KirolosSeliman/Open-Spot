# Book Call Request Root Cause

## Branches

- Starting worktree branch: `fix/final-lunera-phone-composition`
- Target branch: `ui-redesign-main`
- Target worktree used: `C:/Users/kirol/AppData/Local/Temp/open-spot-ui-candidate`
- `ui-redesign-main` already existed locally and on `origin`; it was checked out in the target worktree and was clean before edits.
- No work was pushed to `main`.

## Search Result

The broken screenshot form was found in `ui-redesign-main`.

Working-tree search found:

- `src/components/marketing/request-call-form.tsx`
  - `Message / preferred time`
  - `Tell us when you are usually available or what you want help with.`
  - `Request my call`
  - `Something went wrong. Please try again, or contact us directly.`
- `src/app/api/potential-clients/route.ts`
  - `Something went wrong. Please try again, or contact us directly.`
- `src/lib/potential-clients/validation.ts`
  - `I agree to be contacted by Open Spot by SMS and email about booking a call and learning more about the product. I understand I can unsubscribe at any time.`

Remote branch search found the full form only on:

- `refs/remotes/origin/ui-redesign-main`

Other remote branches only contained the generic i18n string `Something went wrong.` in `src/lib/i18n/dictionaries.ts`.

History search found the form was introduced by:

- Commit: `e468208`
- Source: `refs/heads/ui-redesign-main`
- Subject: `Add premium request-call lead capture flow`
- Files introduced by that commit included:
  - `src/components/marketing/request-call-form.tsx`
  - `src/app/api/potential-clients/route.ts`
  - `src/app/admin/potential-clients/page.tsx`
  - `src/lib/potential-clients/*`
  - `supabase/migrations/20260620123000_potential_clients_leads.sql`

## Root Cause

The production form was not from an unknown branch. It came from `ui-redesign-main`, commit `e468208`.

The visible production failure was caused by a fragile request-call implementation:

1. The public form posted to `/api/potential-clients`.
2. That route returned the same generic message for invalid JSON, missing Supabase service configuration, and database insert failures.
3. A missing `SUPABASE_SERVICE_ROLE_KEY`, missing Supabase URL, unapplied `potential_clients` migration, or database insert error would all surface to the visitor as `Something went wrong. Please try again, or contact us directly.`
4. `/book-call/questions`, the required product path, still rendered an informational booking-link page instead of the persisted request flow.

Because the route masked backend failure modes, the UI could not show a useful error and the production user had no recovery path.

## Implementation Chosen

The old `potential-clients` flow was replaced with a dedicated `book_call_requests` flow:

- Public page: `/book-call/questions`
- Public API: `/api/book-call-requests`
- Admin page: `/admin/call-requests`
- Legacy aliases:
  - `/book-call` redirects to `/book-call/questions`
  - `/admin/potential-clients` redirects to `/admin/call-requests`

No SMS is sent automatically. No appointment is created. No client is confirmed automatically.

## Files Changed Or Created

- `src/app/api/book-call-requests/route.ts`
- `src/app/book-call/page.tsx`
- `src/app/admin/call-requests/actions.ts`
- `src/app/admin/call-requests/page.tsx`
- `src/app/admin/layout.tsx`
- `src/app/admin/potential-clients/page.tsx`
- `src/app/api/potential-clients/route.ts`
- `src/components/admin/call-requests-table.tsx`
- `src/components/marketing/book-call-request-form.tsx`
- `src/components/marketing/open-spot-booking-page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/globals.css`
- `src/components/marketing/lunera-open-spot-template.tsx`
- `src/lib/admin/call-requests.ts`
- `src/lib/book-call/admin.ts`
- `src/lib/book-call/validation.ts`
- `src/lib/i18n/dictionaries.ts`
- `src/lib/marketing/revenue-calculator.ts`
- `src/lib/reports/metrics.ts`
- `src/lib/supabase/service.ts`
- `src/types/database.ts`
- `supabase/migrations/20260620170000_create_book_call_requests.sql`
- `tests/unit/dashboard-real-data.test.ts`
- `tests/unit/book-call-admin.test.ts`
- `tests/unit/book-call-feature.test.ts`
- `tests/unit/book-call-request-route.test.ts`
- `tests/unit/book-call-request-validation.test.ts`
- `tests/unit/public-navigation.test.ts`
- `tests/unit/revenue-calculator.test.ts`
- `docs/revenue-calculator-redesign.md`

Removed obsolete runtime files:

- `src/components/admin/potential-client-copy-button.tsx`
- `src/components/marketing/request-call-form.tsx`
- `src/lib/potential-clients/actions.ts`
- `src/lib/potential-clients/data.ts`
- `src/lib/potential-clients/email.ts`
- `src/lib/potential-clients/validation.ts`

The legacy `/api/potential-clients` route remains as a thin alias to the new
`/api/book-call-requests` handler so stale clients receive structured validation
instead of an old generic failure.

## Database

Added migration:

- `supabase/migrations/20260620170000_create_book_call_requests.sql`

The migration is additive:

- Creates `public.book_call_requests` if missing.
- Preserves existing tables and historical lead data.
- Enables RLS.
- Revokes table privileges from `public`, `anon`, and `authenticated`.
- Does not create public select or public insert policies.
- Uses server-side service-role inserts through the API route.
- Uses the existing `private.set_updated_at()` trigger pattern.

## Required Environment Variables

Required for the public API and admin data loader:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Required for existing Supabase auth and protected admin access:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `PLATFORM_ADMIN_EMAILS`

No Twilio, Plivo, Resend, or SMTP variable is required for this form.

## Verification Commands

Final verification run:

- `npm install`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `rg -n -i "Apple Store|Spotify|My Cards|credit card|spending|secured purchase|automatically confirmed|confirmed automatically" src`
- `rg -n -i "Something went wrong|Request my call|Message / preferred time|I agree to be contacted" src`

Results:

- `npm install`: passed, reported `up to date`; npm emitted peer dependency warnings for WASM runtime packages.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: passed, 66 test files and 359 tests.
- `npm run build`: passed, Next compiled successfully and generated routes including `/book-call/questions`, `/api/book-call-requests`, and `/admin/call-requests`.
- Forbidden wording scan: zero matches in `src`.
- Controlled form wording scan: matches only in `src/components/marketing/book-call-request-form.tsx`.

## Vercel Checks

Before production release:

1. Confirm Vercel Production Branch is `ui-redesign-main`.
2. Confirm the deployed commit is the final pushed commit from this branch.
3. Apply the Supabase migration before testing production form submission.
4. Redeploy Vercel after branch and environment checks.
5. Test `/book-call/questions`.
6. Submit a real request.
7. Verify the request appears in `/admin/call-requests`.
