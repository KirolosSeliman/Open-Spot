# Lunera-Style Template Recreation Plan

## Source Boundary

Reference inspected: https://lunera.framer.ai/

This plan recreates the Lunera-style experience with original Open Spot code. It must not copy Framer source, proprietary assets, Lunera finance copy, logos, images, or template files. The target is an original premium SaaS layout and motion system that feels like a Lunera-style template adapted to Open Spot.

## 1. Lunera Page Sections In Order

1. Floating pill navbar over a pale sky/white hero.
2. Centered hero with large headline, short subtitle, layered product mockup, floating cards, proof row, and dual CTAs.
3. Horizontal logo/category strip below the hero.
4. Feature card grid with large rounded cards and internal visual mockups.
5. Integrations/tools section with centered headline and orbit/arc of square tool cards.
6. Sticky/two-column how-it-works section with left headline and stacked animated cards on the right.
7. Three-card pricing section with one highlighted middle card.
8. Testimonial/results section with horizontally moving/repeated cards and a stats row.
9. FAQ section with left copy and right accordion list.
10. Blog/resources section with three article cards.
11. Final CTA / footer entry.
12. Full footer with product summary and grouped links.

## 2. Hero Layout Structure

Lunera uses a centered, high-air hero:

- pale blue radial/sky background;
- floating pill navbar centered at the top;
- huge rounded headline with tight line-height;
- compact subtitle;
- central phone/product mockup placed partly below the fold;
- small floating metric cards around the mockup;
- primary filled CTA and secondary outline CTA below proof/social elements.

Open Spot recreation:

- use the same centered hero rhythm;
- replace phone/finance visuals with a layered SMS cancellation recovery mockup;
- include floating cards for cancellation time, eligible customers, reply queue, manual validation, estimated recovered revenue, and STOP respected;
- use the required French/English Open Spot hero copy.

## 3. Navbar Behavior

Lunera navbar behavior:

- floating rounded white pill;
- centered horizontally;
- sticky/fixed feeling while scrolling;
- logo on the left, links centered, black CTA on the right;
- soft shadow and blurred background.

Open Spot recreation:

- build an original floating navbar with Open Spot branding;
- keep links to features/how-it-works/pricing/resources;
- preserve sign-in/sign-up routes;
- keep the existing language switcher;
- make it responsive with compact wrapping on mobile.

## 4. Visual Card / Mockup Structure

Lunera uses:

- large rounded white cards;
- soft shadows and light borders;
- internal chart/card illustrations;
- overlapping floating mini cards;
- centered product device visual in hero;
- big spacing between content bands.

Open Spot recreation:

- create original CSS/React mockups, not copied images;
- use dashboard-style cards, SMS bubbles, reply queue rows, consent/status pills, and QR-style blocks;
- keep manual validation visually prominent;
- use hover lift on cards.

## 5. Scroll Animations

Lunera feel:

- sections enter with fade/rise;
- cards stagger into view;
- hero cards float subtly;
- sticky navigation remains present;
- how-it-works cards feel scroll-progressive.

Open Spot recreation:

- add isolated client animation components;
- use framer-motion if needed;
- avoid making backend/data pages client components;
- include reduced-motion support;
- keep operational app screens mostly static.

## 6. Reveal Animations

Required recreation:

- hero eyebrow/title/subtitle/CTA stagger;
- feature cards reveal with stagger;
- pricing cards reveal with a slight vertical rise;
- FAQ answers animate open/closed;
- resources cards reveal.

## 7. Sticky Sections

Lunera how-it-works has a sticky two-column feel:

- left label/headline remains visually anchored;
- right side presents large rounded step cards;
- visual content changes as the user scrolls.

Open Spot recreation:

- sticky left headline on desktop;
- right column with three Open Spot steps;
- cards show customer signup, opening creation, and manual validation;
- use scroll-linked movement or progress indicator.

## 8. Marquee Or Continuous Motion Sections

Lunera includes continuous horizontal movement in logo/testimonial style areas.

Open Spot recreation:

- category strip marquee for appointment-based businesses;
- optional repeated use-case/testimonial card rail;
- pause or simplify under reduced motion.

## 9. Pricing Section Structure

Lunera pricing:

- centered section label and title;
- three large pricing cards;
- middle card highlighted with stronger border/accent;
- checkmark feature lists;
- full-width pill CTA in each card.

Open Spot recreation:

- use three cards: Pilote, Croissance, Sur mesure;
- do not invent fixed prices;
- include requested feature lists and CTAs;
- emphasize manual validation and consent.

## 10. FAQ Behavior

Lunera FAQ:

- two-column desktop layout;
- left title/copy/action;
- right stacked accordion rows;
- plus icon affordance;
- smooth open/close behavior.

Open Spot recreation:

- animated accordion with the six required FR/EN questions;
- first item can be open by default;
- preserve keyboard-friendly buttons;
- reduced motion disables height/opacity animation.

## 11. Footer Structure

Lunera footer:

- final brand message;
- grouped platform/resource links;
- CTA links;
- clean white background after final CTA.

Open Spot recreation:

- Open Spot brand summary;
- platform links to features, pricing, FAQ, resources;
- account links to sign in/create account;
- legal links to privacy/terms;
- no copied design credits or Framer marketplace links.

## 12. Responsive Behavior

Lunera responsive traits:

- desktop uses wide centered max-width sections;
- hero mockup crops/overlaps vertically;
- card grids collapse cleanly;
- nav stays compact;
- large headings remain readable.

Open Spot recreation:

- use mobile-first grids;
- avoid horizontal overflow;
- stack hero CTAs and mockup cards on small screens;
- make sticky sections become normal stacked sections on mobile;
- keep text inside buttons/cards.

## 13. Parts Recreated With Original Open Spot Code

- Floating navbar.
- Hero layout and layered mockup.
- Floating cards and SMS reply visuals.
- Category marquee.
- Feature card grid.
- Tools/integrations arc.
- Sticky how-it-works section.
- Three pricing cards.
- Use case/testimonial rail.
- FAQ accordion.
- Resource/blog card section.
- Final CTA and footer.
- Animation primitives and reduced-motion handling.

## 14. Parts Replaced With Open Spot Content

- Product name becomes Open Spot.
- Finance/investment language becomes appointment cancellation recovery.
- Download app CTAs become create account / see how it works / contact team.
- Bank/integration visuals become calendar, booking system, phone, SMS, QR, consent, and Open Spot dashboard.
- Finance metrics become eligible customers, replies received, manual validation, STOP respected, and estimated recovered revenue.
- Pricing names become Pilote, Croissance, Sur mesure.
- Testimonials become use-case cards for salons, barbers, beauty, and care services.
- Blog cards become guides for reducing lost cancellations, SMS consent, and useful waitlists.

## Implementation Notes

- Keep existing Open Spot routes, auth, dashboard, SMS, waitlist, import, i18n, and backend logic intact.
- Build marketing animation in isolated client components.
- Do not add animation to server actions, forms, SMS validation flows, or backend routes.
- Preserve French default and English language switcher.
- The first OUI/YES/1 reply must never be presented as automatically confirmed.
