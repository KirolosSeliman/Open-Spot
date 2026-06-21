# Open Spot Revenue Calculator Redesign

## Branch

- Active branch: `ui-redesign-main`
- Remote target: `origin/ui-redesign-main`
- No work was pushed to `main`.

## Files Inspected

- `package.json`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/components/marketing/open-spot-funnel.tsx`
- `src/components/marketing/lunera-open-spot-template.tsx`
- `src/lib/i18n/dictionaries.ts`
- `tests/unit/public-navigation.test.ts`

## Files Changed Or Created

- `src/components/marketing/lunera-open-spot-template.tsx`
- `src/app/globals.css`
- `src/lib/marketing/revenue-calculator.ts`
- `tests/unit/public-navigation.test.ts`
- `tests/unit/revenue-calculator.test.ts`
- `docs/revenue-calculator-redesign.md`

## Integration Point

The public landing route is `src/app/page.tsx`, which renders `OpenSpotFunnel`.
`OpenSpotFunnel` renders `LuneraOpenSpotTemplate`, and the calculator is integrated
there as `RevenueCalculatorSection` after the "How it works" section and before
personalized pricing. No parallel page or duplicate header was added.

## Design

The redesigned section follows the supplied reference direction:

- pale white/blue background with a subtle bottom backlight;
- centered calculator heading;
- large white calculator card;
- left column with three accessible custom sliders;
- right column with a pale blue result panel;
- large recovered revenue result;
- secondary monthly revenue-at-risk line;
- compact dark primary CTA and quiet secondary CTA.

## Slider Implementation

Each slider uses a real `input type="range"` for keyboard and assistive technology
support. The input is visually transparent and sits above a custom track. The visible
track uses a thin active fill and a 3px vertical marker instead of a large native
thumb. The input exposes `aria-label`, `aria-valuemin`, `aria-valuemax`,
`aria-valuenow`, and `aria-valuetext`.

## Formula

The shared helper in `src/lib/marketing/revenue-calculator.ts` calculates:

```text
monthlyRevenueAtRisk = averageServicePrice * lostSpotsPerWeek * 4
recoveredRevenue = monthlyRevenueAtRisk * (recoveryRate / 100)
```

With the default inputs:

```text
110 * 11 * 4 = 4,840 monthly revenue at risk
4,840 * 50% = 2,420 potential recovered revenue
```

The large result shows the mathematically correct recovered revenue. The at-risk
value is still shown as context, but it is not mislabeled as recovered revenue.

## QA Results

- `npm.cmd install --no-audit --no-fund`: passed; dependencies were already up to date, with existing peer override warnings from `@napi-rs/wasm-runtime`.
- `npm.cmd test -- tests/unit/revenue-calculator.test.ts tests/unit/public-navigation.test.ts`: passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run typecheck`: passed.
- `npm.cmd test`: passed, 66 files and 359 tests.
- `npm.cmd run build`: passed.
- `design-qa.md`: final result passed.
- Visual captures created for `375`, `390`, `768`, `1024`, and `1440` widths in `docs/visual-qa/`.
- Forbidden wording scan: one existing unrelated dashboard billing match remains at `src/app/dashboard/billing/page.tsx:38` (`Payment method`).

## Remaining Limits

- This task did not modify Supabase, backend APIs, RLS, auth, Twilio, or financial
  persistence logic.
- The `ui-redesign-main` worktree already contained unrelated dirty book-call/admin
  changes before this task; they were left intact and are not part of the calculator
  redesign scope.
