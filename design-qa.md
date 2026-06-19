# Open Spot Hero Phone Design QA

final result: passed

## Social Proof And Business Marquee QA - 2026-06-19

final result: passed

Source visual truth:
- C:\Users\kirol\AppData\Local\Temp\codex-clipboard-8c48b334-826a-4980-ab91-9bf8b0366a20.png
- C:\Users\kirol\AppData\Local\Temp\codex-clipboard-f598d1f0-dad5-418d-9327-495e208868d9.png

Implementation screenshots:
- Desktop top: C:\Users\kirol\AppData\Local\Temp\open-spot-qa-marquee\desktop.png
- Tablet top: C:\Users\kirol\AppData\Local\Temp\open-spot-qa-marquee\tablet.png
- Mobile top: C:\Users\kirol\AppData\Local\Temp\open-spot-qa-marquee\mobile.png
- Desktop scrolled: C:\Users\kirol\AppData\Local\Temp\open-spot-qa-marquee\desktop-scrolled.png
- Tablet scrolled: C:\Users\kirol\AppData\Local\Temp\open-spot-qa-marquee\tablet-scrolled.png
- Mobile scrolled: C:\Users\kirol\AppData\Local\Temp\open-spot-qa-marquee\mobile-scrolled.png

Viewport:
- Desktop: 1920 x 1080.
- Tablet: 1024 x 900.
- Mobile: 390 x 844 emulated mobile viewport.

Evidence:
- The social proof block now uses local photographic avatars from public/lunera-style/avatars instead of initials.
- The avatar stack is compact, round, overlapped, bordered in white, and paired with gold five-star social proof text.
- The business categories now render as duplicated marquee groups with a CSS transform animation and side fade mask.
- The marquee uses 38s linear infinite motion and disables animation under prefers-reduced-motion.
- The metrics section starts closer to the marquee after reducing the top padding from py-20/sm:py-28 to pt-12/sm:pt-16.
- CDP checks: desktop/tablet/mobile reported no horizontal overflow, all avatar images loaded, no forbidden fintech or fake social claim text was present.
- Desktop scrolled metrics: marquee bottom 466px, metrics heading top 586px, social proof opacity 1.
- Tablet scrolled metrics: marquee bottom 411px, metrics heading top 531px, social proof opacity 1.

Findings:
- No actionable P0/P1/P2 findings remain.

Source visual truth:
- C:\Users\kirol\AppData\Local\Temp\codex-clipboard-b6c3d969-aa7f-4e07-9187-097d9a1b7a11.png

Implementation screenshots:
- Desktop final: C:\Users\kirol\AppData\Local\Temp\open-spot-phone-desktop-final2-20260619-113913.png
- Mobile final: C:\Users\kirol\AppData\Local\Temp\open-spot-phone-mobile-final2-20260619-113913.png
- Side-by-side comparison: C:\Users\kirol\AppData\Local\Temp\open-spot-phone-vs-lunera-qa-final.png

Viewport:
- Desktop comparison: 1920 x 1000, top-of-page hero state.
- Mobile check: 390 x 1200 emulated mobile viewport.

State:
- Homepage at http://localhost:3000.
- Top-of-page hero state for composition.
- Desktop scroll state also inspected to confirm transform/opacity motion.

Full-view comparison evidence:
- Reference Lunera uses a centered phone with a light 3D right edge, soft shadow, cloud fade, and balanced floating cards.
- Open Spot now keeps the same product content inside the phone while reducing visual heaviness and aligning the phone more closely to the reference hero rhythm.
- Desktop CDP metrics: innerWidth 1920, scrollWidth 1920, phone width 385, phone top 355, subtitle bottom 326, forbidden fintech text [].
- Mobile CDP metrics: innerWidth 390, scrollWidth 390, phone width 288, phone top 417, subtitle bottom 292, forbidden fintech text [].

Focused region comparison evidence:
- Phone scale: old max width was 390px; final max is 385px, with less heavy frame treatment and a stronger cloud fade.
- Phone position: final top-of-phone gap below subtitle is 29px, close enough to the Lunera rhythm while preserving the larger Open Spot headline the brief asked not to change.
- Frame fidelity: right rail is thinner, black inset is reduced, shadow is softer, and angle is calmer.
- Motion: scroll animation now travels from translateY 104px to 16px, with opacity 0.94 to 1 and scale 0.965 to 1 through requestAnimationFrame.
- Responsive: mobile phone remains centered and no horizontal overflow was measured.

Findings:
- No actionable P0/P1/P2 findings remain.

Patches made since previous QA pass:
- Reduced visual weight of the iPhone frame and side rail.
- Adjusted perspective and rotation to a subtler Lunera-style angle.
- Increased scroll motion distance so the phone settles smoothly while animating only transform/opacity.
- Re-anchored floating cards and pills around the smaller/lighter phone.
- Added tests guarding the phone scale, frame, motion, forbidden text, and mobile navbar constraints.

Required fidelity surfaces:
- Fonts and typography: unchanged by this task; Open Spot hero typography remains intentionally larger than Lunera because the brief asked not to change hero content.
- Spacing and layout rhythm: phone now sits with a clearer subtitle gap and a less crowded frame/card relationship.
- Colors and visual tokens: Open Spot blue/white/cloud palette preserved; no fintech palette or text introduced.
- Image quality and asset fidelity: phone remains editable React/CSS as requested, not a copied Lunera image.
- Copy/content: Open Spot appointment workflow copy preserved; no automatic confirmation claim and no forbidden fintech text detected.

Follow-up polish:
- P3: a photographic device asset could match Lunera's physical realism even more closely, but the prompt explicitly asked to keep the Open Spot phone as an editable React/CSS component.
