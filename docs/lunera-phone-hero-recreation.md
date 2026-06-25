# Lunera-Style Phone Hero Recreation

## Branch

- Branch: `ui-redesign-main`
- Base SHA: `33ad575445d46643edf8420f22a2b5142e4cebed`
- Remote: `origin/ui-redesign-main`
- Main branch: not modified

## Files Inspected

- `src/app/page.tsx`
- `src/components/marketing/open-spot-funnel.tsx`
- `src/components/marketing/lunera-open-spot-template.tsx`
- `src/components/marketing/sms-conversation-phone.tsx`
- `src/components/marketing/open-spot-metrics-showcase.tsx`
- `src/components/marketing/booking-flow-section.tsx`
- `src/app/globals.css`
- `src/lib/i18n/dictionaries.ts`
- `tests/unit/public-navigation.test.ts`
- `tests/unit/sms-conversation-phone.test.ts`
- `package.json`
- `tsconfig.json`
- `eslint.config.mjs`

## Previous Phone Location

The active homepage is rendered by `src/app/page.tsx`, which renders `OpenSpotFunnel`.
`OpenSpotFunnel` renders `LuneraOpenSpotTemplate`.
The active hero phone is `SmsConversationPhone` in `src/components/marketing/sms-conversation-phone.tsx`, inside `HeroPhoneMockup`.

## Root Cause

The phone hero had the right general idea but not the final reference composition:

- the phone was too low and too small against the supplied reference;
- desktop scene height pushed social proof and CTA too far down;
- the phone bottom stayed visible too long instead of fading into clouds;
- tablet-sized layouts still showed floating cards that collided with the phone;
- the phone copy showed unsupported ranking language: `Best match`, `90% match`, `80% match`, and `ranked SMS replies`;
- the black badge used an unproven compliance claim: `Secure & compliant`.

## Files Modified

- `src/components/marketing/sms-conversation-phone.tsx`
- `src/components/marketing/lunera-open-spot-template.tsx`
- `src/app/globals.css`
- `tests/unit/public-navigation.test.ts`
- `tests/unit/sms-conversation-phone.test.ts`

## Files Created

- `docs/lunera-phone-hero-recreation.md`

## Reference Analysis

Primary reference was the screenshot supplied in the task. The visual target is:

- centered iPhone-style device under the hero copy;
- large but not full-height phone silhouette;
- visible right-side dark metal rail and side button;
- Dynamic Island centered near the top;
- pale blue sky background;
- lower white cloud occlusion that hides the lower phone body;
- four floating elements placed around the phone, not on top of it;
- social proof and CTA sitting in the cloud layer under the phone.

Direct live Lunera browser measurement was not claimed. Local browser automation was used against Open Spot with Chrome/Playwright and the supplied screenshots were used as visual truth.

## Final Measurements

Captured locally at `1254x1254` after pass 5:

| Element | X | Y | W | H |
| --- | ---: | ---: | ---: | ---: |
| Hero title | 139 | 128 | 976 | 138 |
| Phone motion box | 447 | 414 | 369 | 735 |
| Left black badge | 155 | 588 | 138 | 30 |
| Left metric card | 132 | 694 | 196 | 140 |
| Right revenue card | 903 | 554 | 196 | 124 |
| Right black badge | 961 | 767 | 115 | 30 |
| Social proof | 426 | 1011 | 403 | 40 |
| CTA row | 16 | 1077 | 1222 | 45 |

Captured locally at `1440x900` after pass 3:

| Element | X | Y | W | H |
| --- | ---: | ---: | ---: | ---: |
| Hero title | 232 | 144 | 976 | 138 |
| Phone motion box | 521 | 432 | 410 | 818 |

## Final Geometry

- Phone width: `clamp(370px, 28.5vw, 430px)`
- Perspective: `1350px`
- Rotation Y: `-6.25deg`
- Rotation Z: `1.15deg`
- Initial transform Y: `42px`
- Settled transform Y: `0px`
- Initial scale: `0.965`
- Settled scale: `1`
- Desktop hero visual height: `35rem`, `37rem` at `1440px+`
- Bottom mask: fades after `63%`, transparent by `90%`

## Motion Strategy

The phone keeps the existing lightweight `requestAnimationFrame` strategy:

- scroll listener is passive;
- progress is read from the hero position;
- CSS custom properties are updated directly on the phone scene;
- React state is not updated on every animation frame;
- reduced motion applies a static final state.

Reduced motion final variables:

- `--lunera-phone-opacity: 1`
- `--lunera-phone-progress: 1`
- `--lunera-phone-scale: 1`
- `--lunera-phone-y: 0px`

## Product Copy

Phone copy is localized in `smsConversationPhoneCopy`.

English states:

- `Manual review`
- `SMS replies`
- `Reply received`
- `Available`
- `To confirm`
- `Confirm Sarah M.`

French states:

- `Revision manuelle`
- `Reponses SMS`
- `Reponse recue`
- `Disponible`
- `A confirmer`
- `Confirmer Sarah M.`

The broader hero copy now says replies are centralized, not ranked.

## Accessibility

- The visual phone wrapper is now a `figure` with a localized accessible label.
- Decorative mockup internals are wrapped with `aria-hidden="true"`.
- Fake phone controls are rendered as non-focusable visual spans instead of real buttons.
- The label states SMS reply queue and manual merchant confirmation.

## Anti-Fintech And Anti-Auto-Confirm Checks

Production marketing sources were scanned for:

- fintech content such as `My Cards`, `Apple Store`, `Spotify`, `Secure payment`, `wallet`, `bank`, `crypto`;
- unsupported ranking or match labels such as `Best match`, `90% match`, `80% match`;
- automatic confirmation language such as `automatically confirmed`, `auto-confirm`, `first reply wins`.

No matches remained in production marketing sources.

## Visual QA Passes

Pass 1:

- Baseline showed the phone lower and smaller than the reference.
- Floating card positions did not match the supplied reference.
- Unsupported match score wording was still present in the phone UI.

Pass 2:

- Phone copy was corrected.
- Phone was enlarged and moved up.
- Tablet/mobile floating cards were hidden below `lg` to prevent collisions.

Pass 3:

- Desktop `1440x900` measured phone at `x=521`, `y=432`, `w=410`, `h=818`.
- No horizontal overflow.
- No forbidden text rendered.

Pass 4:

- Square capture showed social proof too low and lower phone body visible too long.
- Desktop visual scene height was reduced.
- Phone bottom mask was moved earlier so the device fades into the cloud layer.

Pass 5:

- Square capture aligned phone and floating cards with the supplied reference composition.
- Final square measurements are listed above.

## Responsive QA

Screenshots were captured locally for:

- `1440x900`
- `1280x800`
- `768x1024`
- `390x844`
- `375x812`
- `390x844` with reduced motion
- `1254x1254` reference-comparison viewport

Observed:

- no horizontal overflow in measured desktop/square captures;
- hero title is no longer covered by the navbar;
- desktop cards surround the phone;
- tablet/mobile avoid card collisions because floating cards are hidden below `lg`;
- reduced motion applies the final static phone state.

The local Next dev overlay appears in screenshots only in development mode. It is not part of the marketing UI.

## QA Commands

Final completed command results:

- `npm.cmd ci --prefer-offline --no-audit --progress=false`: passed, 454 packages installed in 11 minutes
- `npm.cmd run lint`: passed
- `npm.cmd run typecheck`: passed
- `npm.cmd run test`: passed, 66 files and 363 tests
- `npm.cmd run build`: passed

Earlier in the work, one `npm ci` attempt timed out and temporarily left `.bin` entries incomplete. The final validation above was run after a clean successful `npm ci`.

## Remaining Notes

- The implementation matches the supplied screenshot composition closely but does not claim pixel-perfect parity with the live Lunera site.
- The phone keeps Open Spot product truth, so unsupported match scores and compliance claims were intentionally not recreated.
- Vercel should deploy `ui-redesign-main`, then the preview should be checked against the final pushed SHA.

## Vercel Checklist

1. Confirm Vercel preview source branch is `ui-redesign-main`.
2. Redeploy the final pushed SHA.
3. Visit `/`.
4. Check desktop, tablet, and mobile hero composition.
5. Test `/sign-in`.
6. Test `/book-call/questions`.
7. Confirm the full landing continues after the hero into metrics, calculator, booking flow, pricing, FAQ, CTA, and footer.
