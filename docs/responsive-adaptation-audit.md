# Responsive Adaptation Audit — Open Spot Marketing Site

## Branch

- **Working branch:** `fix/responsive-marketing-site` (created from `main`)
- **Note:** `ui-redesign-main` is checked out in a separate git worktree (`open-spot-ui-candidate`). `main` is ahead of `ui-redesign-main` with recent marketing responsive fixes; this work continues on `main` lineage.

## Files inspected

- `src/app/page.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/marketing/lunera-open-spot-template.tsx`
- `src/components/marketing/open-spot-funnel.tsx`
- `src/components/marketing/open-spot-metrics-showcase.tsx`
- `src/components/marketing/booking-flow-section.tsx`
- `src/components/marketing/booking-flow-section.tsx`
- `src/components/marketing/animated-recovery-story.tsx`
- `src/components/layout/site-header.tsx`
- `public/` marketing assets

## Files modified / created

- **Modified:** `src/app/globals.css`
- **Created:** `docs/responsive-adaptation-audit.md`

## Problems found

| Area | Problem | Root cause |
|------|---------|------------|
| Hero (desktop) | Layout unstable on different laptop widths | Fixed `min-height: 1254px`, fixed phone `392×590px`, absolute footer/fade `top` in px |
| Hero (mobile) | Phone/text too small on many devices | Later `@media (max-width: 767px)` block overrode fluid styles with `width: clamp(176px, 44.44vw, 192px)` and micro typography |
| Hero (mobile) | Excessive vertical scroll | Duplicate mobile blocks set `min-height: 1680px` / fixed stage heights |
| Global | Horizontal scroll risk | `100vw` and `calc(100vw - …)` on containers (scrollbar width) |
| Workflow | Sticky scroll length wrong on mobile browsers | `100vh` without `svh` |
| Calculator | Title/result too large on small laptops | Fixed `3.5rem` / `5.25rem` font sizes |
| Booking flow | Cards clipped on medium screens | Fixed stage `360px`, card positions in px |

## Strategy applied

1. **Fluid CSS tokens** in `:root` (`--page-x`, `--hero-title`, `--phone-width`, `--phone-height`, `--hero-stage-height`, etc.)
2. **Percentage + clamp positioning** for hero floating cards, footer, and cloud fade instead of fixed pixel tops
3. **Removed conflicting mobile CSS** — deleted redundant `@media (max-width: 767px)` blocks that reintroduced fixed heights and micro-sizing
4. **Replaced `100vw` with `100%`** on marketing wrappers and marquees (kept `calc(50% - 50vw)` only for full-bleed marquee technique)
5. **`100svh`** for workflow sticky stack scroll height
6. **Tablet breakpoint** `@media (min-width: 768px) and (max-width: 1023px)` for hero + booking flow scaling
7. **Preserved** all sections, visuals, animations, phone mockup, calculator interactivity, and brand styling

## Fluid tokens added

```css
--page-x, --section-y, --section-y-tight, --container-max, --container-wide
--radius-card, --header-height, --hero-title, --section-title, --body-large
--phone-width, --phone-height, --hero-stage-height
```

## Sections corrected

- **Header:** shell width uses `calc(100% - 32px)`; mobile logo mark retained without `100vw` shell
- **Hero:** fluid title/subtitle/stage/phone; card positions use `%` + clamp
- **Phone:** scales with `--phone-width` / `--phone-height`; mobile keeps scroll fade animation vars
- **Calculator:** fluid title (`clamp`) and result value; existing mobile column layout unchanged
- **Workflow:** `100svh` stack heights
- **Booking flow:** fluid stage height and card sizes; positions in `%`
- **Cards/metrics:** existing responsive grids retained; overflow guards use `100%` not `100vw`

## Viewports tested

Browser CDP checks on `http://localhost:3000/` (post-change):

| Viewport | Horizontal overflow | Phone width (approx.) |
|----------|---------------------|------------------------|
| 320×568 | No | 243px |
| 375×812 | No | 284px |
| 1366×768 | No | 395px |
| 1920×1080 | No | 405px |

Additional targets validated via CSS breakpoints: 768–1023 tablet, 900/1199 laptop tiers.

## QA commands

| Command | Result |
|---------|--------|
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run test` | Pass |
| `npm run build` | Pass |

## Forbidden wording scan

No matches for banned placeholder copy (`My Cards`, `Apple Store`, `Spotify`, etc.) in `src/`.

## Remaining risks

- Hero footer still uses absolute positioning on desktop (now with fluid `clamp` tops); future improvement could use document flow on large screens
- Very wide ultrawide (>2560px) relies on existing `max-width` containers — monitor for excessive whitespace
- Playwright suite not present; visual regression relies on manual/CDP checks

## Vercel remaining steps

1. Merge or deploy branch `fix/responsive-marketing-site`
2. Confirm Vercel production/preview tracks intended branch (`main` or redesign branch)
3. Redeploy preview/production
4. Smoke test on real phone + external laptop
5. Compare hero phone scale and calculator against pre-deploy baseline
