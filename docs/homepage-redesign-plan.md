# Homepage Redesign Plan

## Scope

This plan covers the marketing homepage redesign only. It must not change Supabase, Auth, RLS, database migrations, SMS delivery, Stripe, or dashboard logic.

The homepage should make Open Spot understandable in a few seconds for salons, barbers, beauty/esthetic businesses, and appointment-based merchants. French is the default language.

## Current Homepage Audit

The current homepage is clear but too product-skeleton oriented for conversion. It explains features and constraints, but it does not yet create the emotional moment of an empty appointment, a stressed merchant, and a recovered spot.

Current reusable pieces:

- `PageShell` and `SiteHeader` can remain the page frame.
- `ButtonLink` already supports primary and secondary CTAs.
- `Card` is useful for small repeated panels, but the redesign should avoid stacking many cards inside a marketing hero.
- `SectionHeading` can support later sections, but the hero may need custom typography and layout.
- `globals.css` already defines a restrained neutral/green/orange palette suitable for a professional salon/barber visual direction.

Current issues to fix in later phases:

- Header navigation and CTAs are English-first.
- Primary homepage CTA currently points to pricing/dashboard instead of `/remplir-mes-annulations`.
- The homepage should describe controlled targeting without claiming automated AI decisions.
- The page does not yet include the cartoonish scroll story.
- There is no booking-intent page for the primary CTA.

## Content Strategy

The homepage should follow this order:

1. Hero: immediate promise, current booking-system reassurance, controlled targeting line, primary CTA, secondary CTA.
2. Scroll story: a simple salon/barber scene showing cancellation stress, service/consent targeting, SMS replies, merchant validation, and recovered appointment.
3. Targeting explanation: make clear that Open Spot helps contact eligible customers without guaranteeing bookings or automating merchant decisions.
4. Why different: not a booking system replacement, no customer app, merchant stays in control.
5. Who it is for: salons, barbers, esthetics, and appointment-based businesses with repeat customers.
6. Pricing preview: simple expectation-setting, without adding Stripe or checkout.
7. Final CTA: repeat the booking-intent action.

## Final French-First Copy

Hero title:

```text
Remplissez vos annulations de dernière minute par SMS.
```

Hero subtitle:

```text
Gardez votre système de rendez-vous actuel. Quand une place se libère, les bons clients sont notifiés par SMS et peuvent réserver rapidement.
```

Targeting line:

```text
Open Spot aide à contacter les clients admissibles selon les services choisis et le consentement SMS.
```

Primary CTA:

```text
Remplir mes annulations
```

Primary CTA path:

```text
/remplir-mes-annulations
```

Secondary CTA:

```text
Voir comment ça fonctionne
```

Scroll story title:

```text
Une annulation. Une alerte ciblée. Une place récupérée.
```

Targeting trust copy:

```text
Open Spot ne promet pas de remplir chaque place. Le ciblage aide à contacter des clients admissibles pour envoyer moins de messages inutiles.
```

Differentiation copy:

```text
Open Spot travaille à côté de votre système actuel. Vos clients reçoivent un SMS, répondent simplement, et vous choisissez qui confirmer.
```

## Visual Direction

Use a modern cartoonish universal salon/barber scene. It should feel emotional, simple, slightly funny, and professional, not childish.

No external images should be used. Visuals should be built with CSS/HTML/SVG-like shapes inside React components. A friendly SMS/list signal can appear as a bubble/halo/light form, not a robot.

Story sequence:

1. A last-minute appointment gets cancelled.
2. The merchant is stressed and tries to message people manually.
3. Open Spot prepares an eligible customer list.
4. The alert targets relevant customers instead of notifying everyone.
5. Selected customers receive an SMS.
6. Replies arrive in order.
7. The merchant chooses who to confirm.
8. The empty spot becomes a recovered appointment.

## Copy Architecture

For the redesign phases, homepage copy should live in a small local data object inside `src/app/page.tsx` or a nearby marketing-only module if the page becomes too large.

Do not introduce a new i18n system in this pack. Keep the copy structure English-ready by grouping strings by section and avoiding hard-coded copy scattered across many components. A future language switch can map the same structure to English.

## Guardrails

- Do not claim automated intelligence guarantees bookings or confirmations.
- Do not make last-minute discounts the homepage focus.
- Do not imply real SMS is active in local/dev mode.
- Do not claim the full product is launched.
- Do not add heavy animation libraries.
- If scroll effects are used later, use CSS or a tiny client component with IntersectionObserver.
- Keep mobile layout readable and CTAs visible.
- Keep interactive controls accessible by keyboard and screen readers.
