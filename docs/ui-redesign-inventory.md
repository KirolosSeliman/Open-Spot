# Open Spot UI Redesign Inventory

## 1. Verified repository remote

- Expected repository: `KirolosSeliman/Open-Spot`
- Actual remote: `https://github.com/KirolosSeliman/Open-Spot.git`
- Repository root: `C:/Documents/Github Kirolos/2e chance RDV`
- Repository verified: yes
- Unrelated project context ignored: yes

## 2. Active branch

- Active branch: `codex/NouveauUITemplate`
- Branch safety: non-main branch
- Upstream: not shown by `git branch -vv` at inventory time
- Decision: continue on the current non-main UI branch because it is already a UI redesign branch and the working tree contains in-progress Open Spot changes.

## 3. Marketing routes found

- `/`
- `/pricing`
- `/how-it-works`
- `/industries`
- `/contact`
- `/remplir-mes-annulations`
- `/book-call/questions`
- `/book-call/ready`
- `/privacy`
- `/terms`
- `/dashboard-preview`

## 4. Auth routes found

- `/login`
- `/sign-in`
- `/signup`
- `/onboarding`

## 5. Connected app routes found

- `/dashboard`
- `/dashboard/analytics`
- `/dashboard/appointments`
- `/dashboard/billing`
- `/dashboard/cancellations`
- `/dashboard/cancellations/[id]`
- `/dashboard/clients`
- `/dashboard/clients/[id]/edit`
- `/dashboard/customers`
- `/dashboard/import`
- `/dashboard/import/paste`
- `/dashboard/messages`
- `/dashboard/new-cancellation`
- `/dashboard/openings`
- `/dashboard/openings/new`
- `/dashboard/openings/[id]`
- `/dashboard/qr-code`
- `/dashboard/reports`
- `/dashboard/responses`
- `/dashboard/services`
- `/dashboard/settings`
- `/dashboard/sms`
- `/dashboard/team`
- `/dashboard/waitlist`
- `/admin`
- `/admin/audit`
- `/admin/compliance`
- `/admin/organizations`
- `/admin/organizations/[id]`
- `/admin/organizations/[id]/compliance`
- `/admin/organizations/[id]/replies`
- `/admin/organizations/[id]/sms`
- `/admin/replies`
- `/admin/reports`
- `/admin/sms`
- `/platform-admin`
- `/platform-admin/billing`
- `/platform-admin/businesses`
- `/platform-admin/businesses/[id]`
- `/platform-admin/sms`

## 6. Public waitlist and QR routes found

- `/b/[slug]/waitlist`
- `/b/[slug]/waitlist/kiosk`
- `/dashboard/waitlist`
- `/dashboard/qr-code`
- `/api/waitlist`

## 7. API routes that must not be touched

- `/api/cron/send-scheduled-messages`
- `/api/health`
- `/api/openings/[id]/validate`
- `/api/sms/inbound`
- `/api/sms/send-opening`
- `/api/waitlist`
- `/api/webhooks/twilio/inbound`
- `/api/webhooks/twilio/status`
- Dashboard import export routes:
  - `/dashboard/import/export/customers`
  - `/dashboard/import/export/template`

These routes protect SMS sending, inbound reply processing, scheduled messaging, public waitlist submission, Twilio webhooks, manual validation, health checks, and customer import/export. The redesign should not change their contracts.

## 8. Existing UI components

- Layout: `src/components/layout/site-header.tsx`, `src/components/layout/page-shell.tsx`
- Marketing: `src/components/marketing/open-spot-funnel.tsx`, `home-story-section.tsx`, `animated-recovery-story.tsx`, `open-spot-booking-page.tsx`, `section-heading.tsx`
- Dashboard: `src/components/dashboard/dashboard-shell.tsx`, `dashboard-ui.tsx`, `new-cancellation-flow.tsx`, `responses-queue.tsx`, `status-tile.tsx`
- Forms: `src/components/forms/phone-input.tsx`, `phone-number-field.tsx`, `waitlist-preview.tsx`
- Import: `src/components/import/import-export-panel.tsx`
- Waitlist: `src/components/waitlist/qr-code.tsx`, `copy-link-button.tsx`
- Customers: `src/components/customers/consent-badge.tsx`
- UI primitives: `src/components/ui/button.tsx`, `src/components/ui/card.tsx`
- Onboarding: `src/components/onboarding/organization-onboarding-form.tsx`

## 9. Components to create or improve

- Marketing shell, navbar, footer, CTA sections, feature cards, pricing cards, FAQ blocks, and dashboard mockup cards.
- App shell, sidebar, mobile nav, app page header, metric cards, status badges, empty/loading/error states, responsive tables/cards.
- Language switcher and shared i18n-aware copy helpers.
- Button, card, badge, form-field, input, select, textarea, alert/notice, SMS preview, reply card, opening card, customer card, QR preview card.

## 10. Existing style files

- `src/app/globals.css`
- Tailwind v4 through `@tailwindcss/postcss`
- Current CSS variables use a green/accent palette:
  - `--background`
  - `--foreground`
  - `--muted`
  - `--line`
  - `--surface`
  - `--primary`
  - `--primary-strong`
  - `--accent`
- Existing utility classes include Open Spot-specific marketing helpers such as `.os-primary-cta`, `.os-chip`, `.os-soft-card`, `.os-section-heading`, and animation classes.

## 11. Hardcoded visible text locations

High-priority visible strings are currently hardcoded in:

- `src/components/layout/site-header.tsx`
- `src/components/dashboard/dashboard-shell.tsx`
- `src/components/dashboard/*.tsx`
- `src/components/marketing/*.tsx`
- `src/app/page.tsx` through marketing component composition
- `src/app/pricing/page.tsx`
- `src/app/login/page.tsx`
- `src/app/sign-in/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/onboarding/page.tsx`
- `src/app/dashboard/**/page.tsx`
- `src/app/admin/**/page.tsx`
- `src/app/platform-admin/**/page.tsx`
- `src/app/b/[slug]/waitlist/page.tsx`
- `src/components/forms/*.tsx`
- `src/components/import/import-export-panel.tsx`
- `src/components/customers/consent-badge.tsx`

The repo already has an initial dictionary in `src/lib/i18n/dictionaries.ts`, but it only covers a small common/navigation subset.

## 12. i18n strategy

- Keep French as the fallback/default locale.
- Expand the existing `src/lib/i18n` module rather than adding a heavy i18n dependency.
- Organize dictionaries by product domain: common, marketing, auth, onboarding, dashboard, openings, responses, customers, import, services, waitlist, reports, settings, admin, statuses, errors.
- Add a small locale resolver and translation helper that can be used by server and client components.
- Add a client `LanguageSwitcher` that persists locale through localStorage and/or a cookie.
- Avoid translating user-generated business names, customer names, service names, imported data, and database content.

## 13. Critical flows to preserve

- Merchant sign up, sign in, sign out.
- Organization onboarding and workspace selection/current organization behavior.
- Dashboard navigation and private route authorization.
- Opening/cancellation creation, eligible audience calculation, SMS preview, SMS send, and state transitions.
- Inbound SMS processing through simulator and Twilio routes.
- Reply ranking by timestamp.
- Manual validation and confirmation flow.
- STOP, ARRET, UNSUBSCRIBE, CANCEL opt-out handling.
- Customer creation/editing/import/export and consent states.
- Public QR/waitlist signup and consent collection.
- Services management.
- Admin/platform-admin permissions, audit, reports, diagnostics, and manager mode.
- Reports and recovered revenue metrics without invented data.

## 14. Functional risks

- The working tree already contains broad uncommitted changes across docs, package files, dashboard pages, SMS logic, Supabase service code, migrations, and tests. Future commits must stage only intended files or explicitly account for existing work.
- Some current visible text appears mojibake in terminal output; source encoding should be checked before large text edits.
- Existing backend-adjacent changes appear in SMS, waitlist, admin, Supabase service, and migrations. The UI redesign should not silently change those areas.
- Current i18n coverage is incomplete. Moving too quickly could create mixed French/English UI.
- Mobile nav and dashboard tables/cards need careful testing to avoid horizontal overflow.
- Public waitlist and webhook/API routes must remain stable because external QR codes and SMS providers may depend on them.

## 15. QA commands to run

From `package.json`:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

Additional possible check:

- `npm run twilio:smoke` only if environment variables and local setup are available.

## 16. Manual test checklist

- Marketing page in French and English.
- Language switcher persistence.
- Marketing nav and CTAs on 375px, 768px, 1024px, and 1440px.
- Auth pages: sign up, sign in, sign out, error states.
- Onboarding organization creation and redirect.
- Dashboard empty/data states.
- New opening/cancellation form, eligible audience, SMS preview, consent warning, send action.
- Responses: OUI, YES, 1, unknown replies, STOP, timestamp ranking, manual validation.
- Customers and import: add/edit, consent statuses, invalid import errors, duplicate behavior where supported.
- QR/waitlist: QR visible, copy link, public page, consent checkbox, success/error states.
- Settings/admin/reporting: permissions preserved, no secret exposure, mobile layout.
- SMS simulator flow only if env permits.

## 17. Branch and push strategy

- Continue on `codex/NouveauUITemplate` unless a later git check proves it is unrelated.
- Do not work on `main`.
- Do not merge into `main`.
- Commit and push after each required step.
- Stage narrowly when preserving existing dirty worktree state.
- If push fails because of authentication, permission, or network, stop and report the exact error.
