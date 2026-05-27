# Design Direction

## Product Feel

Open Spot should feel trustworthy, calm, and practical for small appointment-based businesses. The product is not an enterprise control center and not a flashy consumer app.

Design keywords:

- Simple
- Professional
- Mobile-first
- Bilingual-ready
- Fast to understand
- Operationally clear
- Low stress

## Visual Direction

Use:

- Soft off-white or light neutral backgrounds.
- Charcoal text.
- Clear spacing.
- Clean cards for repeated business objects.
- Simple tables and lists.
- Clear status badges.
- Strong primary calls to action.
- Accessible contrast.

Avoid:

- Full-dark sci-fi styling.
- Neon-heavy palettes.
- Overly decorative gradients.
- Dense enterprise dashboards.
- Marketing copy inside operational tools.
- UI that implies automatic confirmation when merchant validation is required.

## Core Screens

MVP screens should include:

- Marketing landing page.
- Pricing page.
- Sign in/sign up.
- Organization onboarding.
- Dashboard overview.
- Customers/import page.
- Waitlist setup and QR page preview.
- Openings list.
- Opening detail with respondent ranking.
- Manual validation flow.
- Recovered revenue report.
- Settings.
- Simple admin/support view.

## Mobile Behavior

Merchants may handle cancellations from a phone. The dashboard must support:

- Creating an opening on mobile.
- Reviewing respondents on mobile.
- Validating a customer on mobile.
- Seeing clear send/failed/closed states.

Tables should collapse into readable stacked lists on narrow screens.

## Bilingual Copy

Do not hardcode English-only user-facing text in final product surfaces. Phase 1 may scaffold copy, but the architecture should leave room for French and English strings.

Tone:

- Clear.
- Friendly.
- Direct.
- No hype.

## Status Language

Important statuses should be visible and unambiguous:

- Draft opening
- Sending
- Sent
- No eligible customers
- Replies received
- Customer validated
- Closed
- Failed
- Opted in
- Needs consent
- Opted out

## Dangerous or Sensitive Actions

The UI must make consequences explicit for:

- Sending SMS.
- Importing customers.
- Changing consent status.
- Validating a recovered booking.
- Changing organization settings.
- Changing member roles.
