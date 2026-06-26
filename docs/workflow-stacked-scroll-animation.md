# Workflow stacked scroll animation

## Branch

`main`

## Section file

- Component: `src/components/marketing/lunera-open-spot-template.tsx` (`HowItWorks`)
- Hook: `src/lib/marketing/use-workflow-stack-scroll.ts`
- Styles: `src/app/globals.css` (`.open-spot-how-*`)

## Problem observed

The section needed a Lunera-style stacked scroll narrative: left copy fixed, right cards piling on scroll. Issues that blocked the effect across machines:

1. `overflow-x: hidden` on `html`/`body` breaks native `position: sticky` in Chromium.
2. `data-lunera-reveal` transforms on sticky targets conflict with scroll-linked motion.
3. CSS-only sticky at `min-width: 1024px` missed smaller desktops, zoomed viewports, and browsers where sticky is unreliable.

## Solution implemented

Hybrid CSS + JS approach aligned with [lunera.framer.ai](https://lunera.framer.ai/):

- **Global:** `overflow-x: clip` on `html`/`body` (prevents horizontal bleed without breaking scroll).
- **CSS fallback:** `position: sticky` from `768px` for no-JS and progressive enhancement.
- **JS stack (primary on desktop):** `useWorkflowStackScroll` applies scroll-linked `translate3d` via `requestAnimationFrame`. When active, the section gets `is-js-stack` and sticky is disabled in favor of transforms — consistent across browsers and window sizes.
- **Left copy:** locks at `--how-stack-top` (7.5rem), below the navbar.
- **Cards:** stack at `--how-stack-top + --how-title-offset + index * --how-stack-gap` with progressive `z-index` (10 / 20 / 30). Cards stay below the left headline via `--how-title-offset`.
- **Reveal:** opacity-only inside `.open-spot-how-section` so transforms never fight the stack.
- **Mobile / reduced motion:** static layout, transforms cleared.

## Why the left text stays fixed

On viewports ≥768px, scroll progress applies a compensating `translate3d` to `.open-spot-how-copy` so it visually locks at `--how-stack-top` while the cards column scrolls — matching Lunera's sticky copy without relying on fragile CSS sticky alone.

## How cards stack

Each card frame receives a scroll-linked `translate3d` until its top reaches the computed stack offset. Card 02 slides under card 01, then card 03 completes the pile. A trailing `::after` spacer on `.open-spot-how-cards` gives card 03 enough scroll runway.

## Desktop / tablet effect

Stack math runs when `min-width: 768px` and `prefers-reduced-motion: no-preference`. This covers laptops, tablets in landscape, and desktops with browser zoom — not only wide 1024px+ screens.

## Mobile handling

Below `768px`:

- Single column layout
- No sticky stacking (`position: static`)
- Normal vertical gap between cards
- Full-width cards without overlap

## Sticky risks verified

| Risk | Status |
| --- | --- |
| Parent `overflow: hidden` breaking sticky | `overflow-x: clip` on `html`/`body`; JS transforms when sticky fails |
| Reveal `transform` on copy | Removed from copy; opacity-only reveal in section |
| Navbar overlap | Stack tops at `--how-stack-top` |
| Cards above left headline | `--how-title-offset` caps card stack below title |
| Cross-browser / cross-desktop variance | JS hook at 768px+ with CSS sticky fallback |
| `prefers-reduced-motion` | Transforms cleared, static layout |

## Copy updates

Step 03 EN: **Confirm manually** — "No appointment is validated automatically."

Step 03 FR: **Confirmer manuellement** — "Aucun rendez-vous n'est validé automatiquement."

## QA checklist

- [x] Left text sticky on desktop during card sequence
- [x] Right cards stack on scroll
- [x] Cards remain readable with progressive offset
- [x] Cards do not rise above left headline
- [x] Works on 768px+ viewports (not only 1024px+)
- [x] Mobile: simple column, no horizontal scroll
- [x] Manual confirmation wording explicit (EN + FR)
- [x] Accessibility: `aria-labelledby="workflow-title"`, `id="workflow-title"`

## Automated checks

| Check | Command |
| --- | --- |
| Lint | `npm run lint` |
| Types | `npm run typecheck` |
| Tests | `npm run test` |
| Build | `npm run build` |
