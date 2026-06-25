# Workflow stacked scroll animation

## Branch

`main`

## Section file

- Component: `src/components/marketing/lunera-open-spot-template.tsx` (`HowItWorks`)
- Styles: `src/app/globals.css` (`.open-spot-how-*`)

## Problem observed

The section needed a Lunera-style stacked scroll narrative: left copy fixed, right cards piling on scroll. Two issues blocked the effect:

1. `overflow-x: hidden` on `html`/`body` breaks native `position: sticky` in Chromium.
2. `data-lunera-reveal` transforms on sticky targets conflict with scroll-linked motion.

## Solution implemented

Hybrid approach aligned with [lunera.framer.ai](https://lunera.framer.ai/):

- **Global:** `overflow-x: clip` on `html`/`body` (prevents horizontal bleed without breaking scroll).
- **Desktop stack:** scroll-linked `translate3d` in `HowItWorks` via `requestAnimationFrame` (immune to overflow quirks).
- **Left copy:** simulated sticky at `120px` (below navbar), same as Lunera.
- **Cards:** stack at `120px + index * 28px` with progressive `z-index` (10 / 20 / 30).
- **Reveal:** opacity-only inside `.open-spot-how-section` so transforms never fight the stack.
- **Mobile / reduced motion:** static layout, transforms cleared.

## Why the left text stays fixed

On desktop, scroll progress applies a compensating `translate3d` to `.open-spot-how-copy` so it visually locks at 120px while the cards column scrolls — matching Lunera's sticky copy behavior without relying on broken CSS sticky.

## How cards stack

Each card frame receives a scroll-linked `translate3d` until its top reaches `120px + index * 28px`. Card 02 slides under card 01, then card 03 completes the pile. Progressive `z-index` keeps titles readable; cards 02/03 use a subtle scale for depth.

## Desktop-only effect

Stack math runs only when `min-width: 1024px` and `prefers-reduced-motion: no-preference`.

## Mobile handling

On mobile (`max-width: 767px`):

- Single column layout
- No sticky stacking (`position: static`)
- Normal vertical gap between cards
- Full-width cards without overlap

## Sticky risks verified

| Risk | Status |
| --- | --- |
| Parent `overflow: hidden` breaking sticky | `overflow-x: clip` on `html`/`body`; stack uses JS transforms |
| Reveal `transform` on copy | Removed from copy; opacity-only reveal in section |
| Navbar overlap | Stack tops at 120px |
| `prefers-reduced-motion` | Transforms cleared via `position: static !important` |

## Copy updates

Step 03 EN: **Confirm manually** — "No appointment is validated automatically."

Step 03 FR: **Confirmer manuellement** — "Aucun rendez-vous n'est validé automatiquement."

## QA checklist

- [x] Left text sticky on desktop during card sequence
- [x] Right cards stack on scroll
- [x] Cards remain readable with progressive offset
- [x] No JS transform jitter
- [x] Mobile: simple column, no horizontal scroll
- [x] Manual confirmation wording explicit (EN + FR)
- [x] Accessibility: `aria-labelledby="workflow-title"`, `id="workflow-title"`

## Automated checks

Results from the release validation run:

| Check | Result |
| --- | --- |
| `npm run lint` | Pass (1 pre-existing warning in `src/lib/auth/actions.ts`) |
| `npm run typecheck` | Pass |
| `npm run test` | Pass — 69 files, 393 tests |
| `npm run build` | Pass — Next.js 16.2.6 production build |
