# Arumee — Design System

Editorial, warm, unhurried. The site should feel like a small family mill that
takes its craft seriously, not like a template storefront. Every choice below
exists to keep that tone consistent across pages and future changes.

## 1. Principles

1. **Quiet confidence.** Fewer boxes, more whitespace, hairlines instead of
   cards. Let typography and the product photography carry the page.
2. **One accent.** Gold is the only accent colour. It marks eyebrows, numerals,
   italics and the primary call to action. Never use it for large fills.
3. **Left-aligned editorial headers.** Section titles sit left, with no
   numbered eyebrow — the heading already names the section, and numerals
   belong to items (benefit rows, FAQ questions), not sections. The lead
   paragraph sits beside or below, never centred under a decorative underline.
4. **Motion is a whisper.** Entrances ease out over ~1s with small travel
   (14–36px). Nothing bounces, nothing loops except the slow bottle float.
   Everything respects `prefers-reduced-motion`.
5. **Features are sacred.** Styling lives in `arumee_assets/editorial.css` and
   `arumee_assets/motion.js`. IDs, classes, handlers and the Playwright
   selectors in `tests/e2e` stay untouched.

## 2. Colour

| Token               | Value                      | Use                                   |
| ------------------- | -------------------------- | ------------------------------------- |
| `--ed-forest`       | `#1A3328`                  | Headings, primary dark surfaces       |
| `--ed-forest-deep`  | `#0E1F16`                  | Buttons, combo band                   |
| `--ed-forest-ink`   | `#0A1A12`                  | Footer, text on gold                  |
| `--ed-gold`         | `#C49A6C`                  | Eyebrows, numerals, hairline accents  |
| `--ed-gold-light`   | `#D4AC80`                  | Primary CTA fill, italic title word   |
| `--ed-gold-pale`    | `#E8D4B8`                  | Badge text on dark                    |
| `--ed-cream`        | `#FDFBF6`                  | Page background, text on dark         |
| `--ed-paper`        | `#F6F0E4`                  | Alternate section background          |
| `--ed-ink`          | `#162B20`                  | Body text                             |
| `--ed-muted`        | `rgba(22,43,32,.72)`       | Secondary text                        |
| `--ed-line`         | `rgba(26,51,40,.14)`       | Dividers                              |

Section rhythm: cream → paper → cream. Dark bands (hero, combo, footer) are
forest with a gold hairline border, never a heavy 3px rule.

## 3. Typography

- **Display:** Cormorant Garamond 500 (hero) / 600 (sections, cards, FAQ).
  Tracking `-0.02em` to `-0.025em`, line-height 1.0–1.04, `text-wrap: balance`.
  The second line of the hero title is *real* italic 500 in gold: the italic
  faces are loaded in `cormorant-fonts.css`, and `font-synthesis: none`
  forbids faux slanting anywhere.
- **Body:** Plus Jakarta Sans 400, 16px, line-height 1.65. Leads (section
  intros, hero summary, subpage hero copy) are 17px. Dense product copy and
  the delivery notice are 15px. Nothing renders below 11px.
  Jakarta is declared in `cormorant-fonts.css` under its own name *and* as
  `Inter`, so legacy Inter rules resolve to it. Real Inter faces must never be
  declared alongside the alias: at 400–600 they win and the site splits
  across two sans faces.
- **Measure:** body max `34em` (~65 characters), leads `32em` (~60). Use em,
  not ch — Jakarta's wide "0" makes `62ch` run ~82 real characters. Tokens:
  `--ed-measure`, `--ed-lead-measure` in `editorial.css`.
- **Eyebrows:** Cormorant italic 500, 1.2–1.25rem, gold, sentence case, with a
  20px gold rule before them. Only where they add information the heading
  doesn't (hero: "Namakkal, Tamil Nadu"). Never shouting caps.
- **Labels:** one role — Plus Jakarta Sans 500, 11px, uppercase, tracking
  `0.2em` (`--ed-label-size`, `--ed-label-track`). Used for proof markers,
  card meta, pack size, price note, the notice title, subpage kickers and
  combo tags. Badges and combo tags are the same at 600. Subpage hero
  eyebrows follow the eyebrow rule above, not the label rule.
- **Buttons:** Plus Jakarta Sans 600, 12px, uppercase, tracking `0.18em`. The
  primary CTA carries a nested 38px forest circle with a cream arrow.
- **Prices:** Cormorant 600, 30px, `lining-nums tabular-nums`.

Scale: hero title `clamp(2.75rem, 4.7vw, 4.5rem)` and never more than two
lines on desktop (spans are `nowrap` ≥1100px); section title
`clamp(2.1rem, 3.8vw, 3.25rem)`; card title 26px; FAQ question 19–22px.

## 4. Layout

- Container `min(1200px, 92vw)`.
- Section padding `clamp(64px, 8vw, 112px)` top and bottom.
- Section heads (oils, benefits, FAQ) share the benefit-row grid
  `64px 80px 0.9fr 1.5fr`, gap 32px: the title spans the first three tracks,
  the lead sits in the fourth, so every lead starts on the same line as the
  benefit text. Aligned to the baseline (`align-items: end`). One column
  under 900px.
- Why Arumee: a scroll story, not rows of icon cards. One groundnut bottle
  is pinned across the first three grid tracks; the four claims sit in the
  fourth (the lead column). Scrolling fills the bottle from drained glass to
  golden oil (`clip-path`, scroll-linked); each claim's level mark lights as
  the oil passes it, and the claim at the reading line is at full strength.
  No numerals, no icons. Under 900px the bottle becomes a 56px rail.
  `body` must stay `overflow-x: clip` (not hidden) or every scroll timeline
  on the page freezes.
- Our Story (about.html): a narrative in five beats on the shared grid —
  opening statement + facts row (mill, method, licence) → why (prose +
  pull quote on a 1px gold rule) → from seed to bottle (a real sequence,
  so numbered; a gold line draws down the rail as you read, markers fill)
  → what never goes in (the page's one dark band, large serif lines) →
  invitation. No cards, no kickers. Photo slots (`.story-photo--open`,
  `.story-photo--why`) are optional and documented in the markup.
- Contact (contact.html): one paper panel. Left: "Contact us" with a 56px
  gold rule, intro, details (location, hours, WhatsApp, call, email) with
  1.5px line icons in gold-tint circles. No product imagery. Right: the form — white 12px-radius fields with leading
  gold icons, visually hidden labels (never remove them), forest send
  button. Subject and phone are folded into the Google Form's message
  field. Motion: focus ring 150ms, send press 120ms, status 200ms.
- FAQ: head on the shared grid; filter chips and the question list start
  at the third track (the benefit-title line). Questions are numbered cards:
  closed = 4% forest tint, open = white with a soft shadow, gold numeral and
  a forest cross. Answers open by animating `grid-template-rows` (260ms
  strong ease-out); newly filtered questions settle in 40ms apart.

## 5. Components

- **Primary button:** pill, gold-light fill, forest-ink text, serif arrow
  after the label, lifts 2px and turns cream on hover.
- **Secondary / card button:** pill, forest-deep fill, turns gold-light on
  hover.
- **Product card:** 28px radius with a double bezel (1px hairline ring plus a
  7px tinted tray ring), warm radial stage behind the bottle, drop shadow on
  the bottle, lifts 6px on hover.
- **Icons:** no emoji anywhere in the chrome. Cart, home, FAQ, menu and the
  delivery truck are 1.5px line icons drawn as CSS masks (`--ico-*` tokens).
- **Notice:** one-line inline note on a gold tint, serif italic "i" badge.
- **Footer:** forest-ink with a giant italic "Arumee" watermark at 3.5%.

## 6. Motion (GSAP + ScrollTrigger + Lenis)

- Lenis smooth scrolling runs only where `(hover: hover) and (pointer: fine)`.
  Touch devices keep native scrolling. Anchor handling stays with the app.
- Hero entrance: copy children stagger 0.09s, 26px rise, 1.1s `power3.out`;
  bottles rise 40px and settle from 0.94 scale.
- Scroll reveals use IntersectionObserver to fire a single GSAP tween per
  group, then clear inline styles. A 9s safety timer guarantees visibility.
- Parallax: bottles drift +14% and copy -6% across the hero's scroll range;
  pointer parallax moves bottles up to 22px with ±2° rotation.
- A 2px gold progress hairline sits under the nav.

## 7. Don'ts

- No centred titles with gradient underlines.
- No white cards floating on cream for text-only content; use hairlines.
- No emoji as UI icons. Use the `--ico-*` mask icons or an image.
- No Inter, Arial or system sans for body copy.
- No new fonts, no new accent colours, no heavy borders.
- No animation longer than 1.4s or travelling further than 40px.
