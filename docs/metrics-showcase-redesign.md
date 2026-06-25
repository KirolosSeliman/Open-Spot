# Metrics Showcase Redesign

## Branch

- `ui-redesign-main`

## Scope

Replaced the public homepage surface with a screenshot-matched Open Spot metrics showcase. The change is frontend-only and does not touch backend APIs, Supabase, Twilio, authentication logic, environment variables, migrations, or dashboard routes.

## Files Inspected

- `src/app/page.tsx`
- `src/components/marketing/open-spot-funnel.tsx`
- `src/components/marketing/lunera-open-spot-template.tsx`
- `src/components/i18n/language-switcher.tsx`
- `src/app/globals.css`
- `tests/unit/public-navigation.test.ts`
- `package.json`

## Files Changed

- `src/components/marketing/open-spot-funnel.tsx`
- `src/components/marketing/open-spot-metrics-showcase.tsx`
- `src/app/globals.css`
- `tests/unit/public-navigation.test.ts`
- `docs/metrics-showcase-redesign.md`

## Integration Point

`src/app/page.tsx` still renders `OpenSpotFunnel`. `OpenSpotFunnel` now resolves the request locale and renders `OpenSpotMetricsShowcase`, keeping the homepage route stable while replacing the old hero-and-phone marketing page.

## Design Notes

- The page uses a centered floating header, Open Spot mark, desktop navigation, language toggle, and login CTA.
- The content grid follows the screenshot structure: three top metric cards and two wider bottom cards.
- The visuals are lightweight inline SVG/CSS treatments for the line chart, confirmation ring, fill-time progress, and filled-spots gauge.
- Copy avoids the restricted appointment-assignment and fintech framing named in the brief.
- The French copy is included for the existing bilingual language switcher.

## Responsive Strategy

- Mobile starts with a single-column card stack.
- Tablet uses two columns.
- Wide desktop uses a 12-column grid with top cards at four columns each and bottom cards at six columns each.
- New styles are scoped under `.open-spot-metrics-showcase-page` so older marketing CSS cannot override the redesigned homepage.

## Verification

- `npm install`: completed, dependencies already up to date. npm reported peer-resolution warnings for optional WASM bindings.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: passed with 66 test files and 362 tests.
- `npm run build`: passed.
- Targeted forbidden-term scan on the new homepage files returned no matches.
- Broad `src` scan still reports pre-existing unrelated billing copy and an unused legacy-template sentence.
- Browser QA at `1440x900`: floating header rendered, five metric cards rendered, desktop grid is 3 cards over 2 cards, EN active, no legacy hero copy, no horizontal overflow.
- Browser QA at `390x844`: cards stack in one column, nav and language toggle are hidden, login remains visible, no horizontal overflow.

## Vercel Notes

After `ui-redesign-main` is pushed, Vercel should deploy from that branch if the project is configured to build preview deployments for non-production branches. If a manual promotion is needed, use the Vercel dashboard to select the latest deployment from `ui-redesign-main`, inspect the homepage at `/`, then promote only after the preview visually matches the metrics showcase and all automated checks are green.
