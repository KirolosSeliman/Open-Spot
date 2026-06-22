# Booking Flow Section Redesign

## Branch

- Branch used: `ui-redesign-main`
- Push target: `origin/ui-redesign-main`
- No work was pushed to `main`.

## Files Inspected

- `src/app/page.tsx`
- `src/components/marketing/open-spot-funnel.tsx`
- `src/components/marketing/lunera-open-spot-template.tsx`
- `src/components/marketing/booking-flow-section.tsx`
- `src/components/marketing/open-spot-metrics-showcase.tsx`
- `src/components/marketing/sms-conversation-phone.tsx`
- `src/app/globals.css`
- `src/lib/i18n/dictionaries.ts`
- `src/lib/i18n/locale.ts`
- `src/lib/i18n/shared.ts`
- `tests/unit/public-navigation.test.ts`

## Files Modified Or Created

- `src/components/marketing/booking-flow-section.tsx`
- `src/app/globals.css`
- `tests/unit/public-navigation.test.ts`
- `docs/booking-flow-section-redesign.md`

## Integration Point

The marketing homepage is rendered by `src/app/page.tsx`, which returns `OpenSpotFunnel`. `OpenSpotFunnel` loads `LuneraOpenSpotTemplate`, and the booking-flow compatibility section is integrated in the main landing sequence after the premium revenue calculator and before the setup/how-it-works sections.

## Design Reproduced

The section matches the supplied reference image:

- Centered `Why Open Spot` pill.
- Large two-line desktop title: `Works with the booking` / `flow you already use.`
- Centered blue-gray supporting copy.
- Minimal white/blue background.
- Four white floating cards arranged along a soft arc.
- Blue line icons for calendar, bell, SMS reply, and shield/control.
- No dashboard, payment, banking, crypto, or auto-confirmation framing.

## Dome / Arc CSS

The pale blue dome is implemented with `.open-spot-booking-flow-dome`, an absolutely positioned decorative layer behind the cards:

- `top: 32rem`
- `height: 46rem`
- `width: min(96rem, 132vw)`
- `radial-gradient(ellipse at 50% 0%, ...)`
- large rounded top corners
- subtle inset highlight and soft blue shadow
- negative z-index inside an isolated section so it does not cover text

## Floating Cards

Cards use `.open-spot-booking-flow-card` with white translucent surfaces, rounded corners, soft shadows, centered blue line icons, and centered bold copy.

Desktop positions:

- `No migration / needed`: left low, `--card-rotation: -18deg`
- `Built for / cancellations`: left-center high, `--card-rotation: -5deg`
- `Clients reply / by SMS`: right-center high, `--card-rotation: 7deg`
- `You stay in / control`: right low, `--card-rotation: 16deg`

Card rotation is controlled through `--card-rotation` and `transform: rotate(var(--card-rotation))`, while hover lift uses `translate` so the rotation is preserved.

## Responsive Strategy

- `lg` and wider: absolute floating-card arc over the dome.
- Below `lg`: cards become a clean two-column grid.
- Mobile title and copy are scaled down through existing media queries.
- The mobile grid removes card rotation and absolute positioning to prevent clipping and horizontal overflow.

## QA Results

- Targeted RED test: `npm test -- tests/unit/public-navigation.test.ts` failed before implementation on the missing section background requirement.
- Targeted GREEN test: `npm test -- tests/unit/public-navigation.test.ts` passed after implementation.
- Local dev server: `http://127.0.0.1:3022/#why-open-spot` returned `200`.
- Browser screenshot capture: blocked in this environment. Chrome/Edge `--screenshot` and Chrome CDP both started but failed to complete screenshot capture reliably; temporary browser processes and artifacts were cleaned up.

Final command results:

- `npm install`: passed, 455 packages audited, 0 vulnerabilities.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: passed, 66 test files and 363 tests. Vitest reported post-run worker termination timeout warnings after all tests had passed.
- `npm run build`: passed with Next.js 16.2.6.
- Forbidden wording scan: no landing-section hits; only existing internal billing UI copy matched payment-related terms.

## Vercel Notes

- Confirm Vercel deploys `ui-redesign-main`.
- Redeploy the latest commit.
- Open the preview and compare the `Why Open Spot` section against the supplied reference image.
- Verify desktop widths `1440`, `1280`, `1024`, tablet `768`, and mobile `390`.
- Confirm no horizontal scroll and no clipped floating cards.
