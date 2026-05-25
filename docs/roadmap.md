# Roadmap

## Phase 0: Product Foundation

Goal: define product scope, architecture, data model, privacy expectations, SMS compliance notes, design direction, and implementation phases.

Output:

- README
- Product requirements
- Architecture notes
- Data model proposal
- Security and privacy notes
- SMS compliance notes
- Design direction
- Roadmap

## Phase 1: Project Setup and Base SaaS

Goal: create a clean Next.js/Supabase-ready SaaS skeleton.

Expected output:

- Next.js App Router project
- TypeScript configuration
- Tailwind CSS
- Base layout
- Navigation shell
- Auth page placeholders
- Dashboard shell
- Environment variable documentation
- Lint/build/test scripts

## Phase 2: Database, Auth, Organizations, and RLS

Goal: build the secure multi-tenant foundation.

Expected output:

- Supabase migration directory
- Organizations
- Profiles and organization members
- Roles
- RLS policies
- Auth helpers
- Seed/dev data that does not use real customer data

## Phase 3: Import, Consent, and Waitlist

Goal: add customer import, consent tracking, and public waitlist signup.

Expected output:

- Customer table and UI
- Import batch tracking
- CSV/Excel parsing
- Consent status handling
- Public QR waitlist page
- Validation for phone and consent inputs

## Phase 4: Openings, SMS, Replies, and Validation

Goal: build the core cancellation recovery engine.

Expected output:

- Opening creation
- Optional offer/discount
- Eligible recipient selection
- SMS simulator
- Provider abstraction
- Inbound reply webhook
- Reply ordering by timestamp
- Manual merchant validation
- Confirmation and unavailable messages
- STOP opt-out handling

## Phase 5: Dashboard, Reports, and Admin

Goal: make the app operationally useful and sellable.

Expected output:

- Merchant dashboard
- Opening status views
- Reply/respondent views
- Recovered revenue reporting
- Basic admin/support screens
- Operational empty, loading, and error states

## Phase 6: Landing, Onboarding, and Legal

Goal: make the product marketable and beta-ready.

Expected output:

- Bilingual landing pages
- Pricing page
- Onboarding flow
- Terms/privacy placeholders requiring legal review
- Consent copy visible to customers

## Phase 7: Billing and Cost Controls

Goal: prepare paid usage without uncontrolled SMS costs.

Expected output:

- Billing-ready data model
- Stripe integration plan or implementation
- SMS spend controls
- Usage tracking
- Commission configuration groundwork

## Phase 8: QA, Security, and Deployment

Goal: prepare beta launch.

Expected output:

- Security review
- RLS review
- Consent review
- SMS safety review
- Deployment documentation
- Manual QA checklist
- Known limitations and beta-readiness verdict

## Phase Discipline

Do not move to a later phase while the current phase has unresolved critical issues. Later-phase requirements discovered early should be documented instead of implemented out of sequence.
