# Revenue Calculator Slider Fixes

## Branch

- `ui-redesign-main`

## Files

- Calculator section: `src/components/marketing/lunera-open-spot-template.tsx`
- Slider math: `src/lib/marketing/revenue-calculator.ts`
- Slider/result styling: `src/app/globals.css`
- Tests: `tests/unit/revenue-calculator.test.ts`, `tests/unit/public-navigation.test.ts`

## Root Causes

The large oval on click came from `.open-spot-slider-input-wrap:focus-within`, which applied a full-track `box-shadow` around the slider wrapper whenever the invisible native range received focus.

The mobile/touch risk came from depending mostly on the transparent native range input. Some browsers and automation surfaces can focus a fully transparent range without moving its native value through track clicks. The visual slider now has explicit pointer, mouse, and click fallbacks that map the interaction coordinate to the correct stepped value.

## Slider Implementation

`RevenueSlider` keeps a real `input[type="range"]` for accessibility, keyboard focus, and form semantics. The visible slider is custom CSS: a thin inactive track, a blue active track, and a 3px vertical marker.

The native input uses `revenue-slider-native` styles to remove browser outlines, shadows, tap highlights, and native thumb visuals while preserving a 44px interaction target.

Pointer/touch/click math is centralized in `sliderValueFromClientX`, which maps the interaction X coordinate into a clamped stepped value. The recovery slider is configured as:

- `min={10}`
- `max={100}`
- `step={1}`
- ticks: `10 %`, `25 %`, `50 %`, `75 %`, `100 %`

## Accessibility

Each slider keeps a visible label plus:

- `aria-label`
- `aria-valuemin`
- `aria-valuemax`
- `aria-valuenow`
- `aria-valuetext`

The result value keeps `aria-live="polite"`. Keyboard focus no longer creates a full oval around the track; the only focus treatment is a subtle marker-level highlight.

## Visual Changes

Slider values now use navy text (`#071126`), lighter numeric weight, and tighter letter spacing so they feel closer to the large recovered-revenue number instead of blue UI accents.

The right-column white trust-note block was removed completely. The remaining context line stays because it explains the monthly revenue at risk before recovery.

## Formula

```text
monthlyRevenueAtRisk = averageServicePrice * lostSpotsPerWeek * 4
recoveredRevenue = monthlyRevenueAtRisk * (recoveryRate / 100)
```

Default French state:

```text
110 $ * 4 spots * 4 weeks = 1 760 $ at risk
1 760 $ * 30% = 528 $ recovered
```

At 100% recovery, `recoveredRevenue` equals `monthlyRevenueAtRisk`.

## QA Results

- `npm.cmd install`: passed, with existing `@napi-rs/wasm-runtime` peer dependency warnings.
- `npm.cmd run lint`: passed.
- `npm.cmd run typecheck`: passed.
- `npm.cmd test`: passed, 66 files / 361 tests.
- `npm.cmd run build`: passed.
- Trust-note scan: no matches in `src`.
- Forbidden-word scan: one existing unrelated dashboard billing hit at `src/app/dashboard/billing/page.tsx`.

## Visual QA

Captured on a clean local Next dev server at `http://127.0.0.1:3013`:

- `docs/visual-qa/revenue-slider-fixes-desktop.png`
- `docs/visual-qa/revenue-slider-fixes-mobile.png`

Rendered checks confirmed:

- default result is `528 $`;
- at-risk line is `1 760 $ de revenu mensuel à risque avant récupération.`;
- trust-note block is absent;
- slider values compute to navy;
- slider hitboxes are 48px high;
- mobile layout has no horizontal overflow;
- wrapper and input shadows/outlines are `none` after focus/click attempts.

The in-app browser automation focused the transparent native range but did not actuate its value through coordinate click/drag or keypress. The production code keeps the native range for accessibility and adds pointer, mouse, and click fallbacks; the fallback coordinate math is covered by unit tests.
