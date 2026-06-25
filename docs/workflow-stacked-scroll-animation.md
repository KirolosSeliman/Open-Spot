# Workflow stacked scroll animation

## Branch

`main`

## Section file

- Component: `src/components/marketing/lunera-open-spot-template.tsx` (`HowItWorks`)
- Styles: `src/app/globals.css` (`.open-spot-how-*`)

## Problem observed

The previous implementation simulated sticky stacking with JavaScript scroll listeners and `translate3d` transforms on both the left copy block and the right card frames. This caused jitter, inconsistent stacking, and fragile behavior because:

1. Card frames used `position: relative` instead of native `position: sticky`.
2. Scroll-linked transforms fought the natural document flow and were sensitive to resize and fast scrolling.
3. The left copy block was translated by JS instead of staying fixed with CSS sticky.

## Solution implemented

Replaced the JS scroll stack with a CSS-only sticky narrative layout on desktop (`min-width: 1024px`):

- Left column (`.open-spot-how-copy`): `position: sticky; top: 8rem; align-self: start;`
- Right column cards (`.open-spot-how-card-frame`): each frame is sticky with progressive `top` offsets and `z-index`:
  - Card 01: `top: 7.5rem`, `z-index: 10`
  - Card 02: `top: 9.25rem`, `z-index: 20`, slight `scale(0.985)`
  - Card 03: `top: 11rem`, `z-index: 30`, slight `scale(0.97)`
- Large `margin-bottom` on frames 01 and 02 creates enough scroll runway for the stacking effect.
- Section shell uses `min-height: calc(100vh + 38rem)` and cards column `min-height: calc(38rem + 72vh)`.

The JavaScript `useEffect` that applied scroll transforms to `.open-spot-how-copy` and `.open-spot-how-card-frame` was removed.

## Why the left text stays sticky

The copy block is a direct grid child with `position: sticky` and `top: 8rem` (below the fixed navbar). As the user scrolls through the tall cards column, the copy sticks within the section bounds without JS transforms.

## How cards stack

Each card frame sticks at a slightly lower viewport offset than the previous one. When scrolling, card 02 rises and settles just below card 01; card 03 completes the pile. Progressive `z-index` ensures newer cards appear above earlier ones while keeping titles readable.

## Desktop-only effect

Sticky stacking is scoped to `@media (min-width: 1024px)`. Below that breakpoint, cards use normal static flow.

## Mobile handling

On mobile (`max-width: 767px`):

- Single column layout
- No sticky stacking (`position: static`)
- Normal vertical gap between cards
- Full-width cards without overlap

## Sticky risks verified

| Risk | Status |
| --- | --- |
| Parent `overflow: hidden` breaking sticky | `.open-spot-how-section` uses `overflow: visible` |
| `.lunera-template` overflow | `overflow: visible` on desktop |
| Parent `transform` on section | None on how-it-works ancestors |
| Navbar overlap | `top: 8rem` / card tops at 7.5–11rem |
| `prefers-reduced-motion` | Sticky disabled via `position: static !important` |

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
