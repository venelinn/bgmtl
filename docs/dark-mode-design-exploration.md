# Dark Mode Design Exploration — "Midnight Marina"

> Design audit + dark-mode redesign direction for Dream Boats. Grounded in the
> current token pipeline (`tokens/*.json` → `styles/_css-variables.css` /
> `styles/_base-variables.scss`) and the existing Hero, Button, BoatCard, and
> OwnerBoatCard components.
>
> **Status:** exploration — not yet ratified. Read alongside
> `component-audit-badges-pills-cards.md` and `component-consolidation-todo.md`.
> **Last updated:** 2026-05-08

---

## 1. Design Audit

### Strengths

- **Token discipline is real.** `tokens/*.json` is compiled through
  style-dictionary into `styles/_css-variables.css` and
  `styles/_base-variables.scss`. HSL output makes a dark-mode overlay genuinely
  tractable — semantic tokens can be re-mapped without touching component CSS.
- **Component-scoped private custom properties.** `--_card-shadow`,
  `--_card-background`, `--_btn-bg-color` in `Button.module.scss` and
  `BoatCard.module.scss` mean theming is mostly a matter of swapping a handful
  of upstream tokens.
- **Hero overlay logic** in `Hero.module.scss` already darkens images for
  legibility — the foundation for cinematic dark treatment exists.
- **Container queries** are used (`@container (min-width: 36rem)` in card
  SCSS), which is modern and means card responsive behavior scales by surface,
  not viewport.
- **Color naming is semantic at the leaves** (`system-error`, `system-success`,
  `cards-info-*`) — that is the layer dark mode hooks into.

### Weaknesses & UI Inconsistencies

- **Token drift in components.** `BoatCard.module.scss` hardcodes `#f9f9f9`,
  `#eaeaea`, `#1f2937`, `#6b7280`, `#d97706`, `#e0e0e0`. None of these are in
  `colors.json`. Dark mode will silently break here.
- **Phantom token reference.** `OwnerBoatCard.module.scss` uses
  `var(--color-gr-400)` for focus rings — that variable does not exist in
  `colors.json`. Falls back to `currentColor`.
- **Two parallel shadow systems.** Cards use `0 2px 8px rgba(0,0,0,0.1)`
  inline; tokens define `--box-shadow-base` from `rgba(56,65,74,0.15)`. Neither
  survives dark mode without rework.
- **Body weight 300.** `typography.json` sets `ui-body-font-weight: light`
  (300). On dark backgrounds, light weights at 16px sub-pixel-render poorly
  and harm contrast — must lift to 400 in dark mode.
- **Heading scale jumps are uneven.** Hero 54 / H1 50 / H2 32 / H3 24 / H4 20 /
  H5 18. The 50→32 cliff is awkward; Hero/H1 are nearly identical.
- **`corner-shape: squircle`** in `Hero.module.scss` has near-zero browser
  support (Safari TP only as of 2026). Currently a no-op for ~98% of users.
- **Hero overlay is a flat 30% black.** Reads as muddy, not cinematic. A
  vertical gradient would carry far more luxury weight.
- **Border-radius inconsistency.** Tokens say 8px (`--border-radius`); buttons
  use 6px (`spacing-1-5`); OwnerBoatCard uses 12px (`spacing-3`); BoatCard uses
  8px (`var(--border-radius)`); Hero uses 32px. No documented hierarchy.
- **`--color-blue-dark` (#0f2541)** exists but is barely used. It is the most
  luxury-coded token in the palette and gets wasted.
- **Eight pastel info-card colors** — beautiful for light, brutally hard to
  translate to dark without losing semantic identity.

### UX Issues

- **Owner card density.** `OwnerBoatCard.tsx` crams title, verified badge,
  progress ring, status switch, location block, and four action buttons into
  ~10rem of vertical space.
- **Status toggle as a Switch is risky.** A flick of the thumb takes a listing
  offline silently — no confirmation, only `console.error` on failure. Worth
  surfacing toast/undo.
- **No visible price** on the owner card despite this being the metric owners
  care about most.
- **Hero search hidden on mobile** is the right call but the comment hints the
  global header search icon is the substitute — verify the visual hierarchy
  still pulls users into search above the fold on mobile.

### Accessibility Concerns

- **Focus styles are ad-hoc.** Buttons rely on default browser focus;
  OwnerBoatCard sets a custom outline using a non-existent token. No app-wide
  focus-ring policy.
- **`text-shadow: 0 4px 8px rgba(0,0,0,0.2)`** on hero title is decorative —
  does not meet WCAG SC 1.4.11 over varying imagery. Need a guaranteed dark
  scrim, not a shadow.
- **Body weight 300 + `color-grey-dark` (#444444) on white** is 9.7:1 — fine.
  But the same weight on luxury photo backgrounds is unreadable.
- **Switch component as primary destructive action** without confirmation
  violates good a11y patterns for irreversible-feeling state changes.

### Missed Opportunities

- `--color-blue-dark` (#0f2541) is the secret weapon — a deep navy that already
  exists in the brand and is the natural anchor for a dark-mode primary
  surface.
- The `color-mix`-based hover system means dark mode only needs *base* colors
  swapped — interactions inherit automatically.
- Glassmorphism on the search bar over a hero image is a near-zero-effort
  luxury win once dark mode is live.

---

## 2. Existing Design System (Extracted)

### Color (light mode, current)

| Role | Token | Value |
|---|---|---|
| Brand primary text | `--color-main` | `hsl(223, 37%, 24%)` deep navy |
| Brand accent | `--color-blue` | `hsl(203, 98%, 50%)` saturated cyan-blue |
| Brand deep | `--color-blue-dark` | `hsl(214, 62%, 16%)` near-black navy |
| Success | `--color-green` / `--system-active` | teal-green |
| Body text | `--color-grey-dark` | `hsl(0, 0%, 27%)` |
| Surface | `--color-white` | `#ffffff` |
| Surface tint | `--color-grey-lighter` | `hsl(0, 0%, 98%)` |
| Hairline | `--color-grey-border` | `hsl(216, 12%, 84%)` |
| Info card tints | `cards-info-*` | 8 pastels at ~94% L |

### Typography

- Family: inherits from the app (system sans-serif via Next.js — confirm in
  `globals.scss`).
- Scale: Hero 54 / H1 50 / H2 32 / H3 24 / H4 20 / H5 18 / Body 16 / Caption 14
  / Small 12 / XS 10.
- Weights in use: 300 (body), 500 (h4/h5, button), 600 (h3, semibold/bold
  alias), 700 (extrabold), 800 (black — h1/h2/hero).

### Spacing

4px base, half-step variant available (`-0-5` through `-8-5`). Effectively a
4px grid with 2px refinement — generous for a luxury aesthetic.

### Radius

- Base: 8px (`--border-radius`)
- Buttons: 6px (`spacing-1-5`)
- "Pill" buttons: 44px
- Detail chips on BoatCard: 44px
- Hero: 32px
- Cards: 8–12px (drift)

### Elevation

Two undocumented shadow tiers used in components:

- Resting: `0 2px 8px rgba(0,0,0,0.1)`
- Hover: `0 4px 12–16px rgba(0,0,0,0.08–0.15)`

Token-defined `--box-shadow-base` is rarely used.

### Buttons

7+ variants: `primary` (blue), `secondary` (dark green), `success`, `danger`,
`warning`, `ghost`, `toggle` (navy), `link`, `transparent`. Each has a
`.is-outlined` modifier. Hover states are derived via
`color-mix(in srgb, X, black 10%)` — clean and dark-mode-friendly.

### Cards

- Default: white surface, soft shadow, 8px radius.
- `--compact`: bordered, no shadow.
- `--naked`: transparent, no chrome.
- Image aspect 16/9 with `object-fit: cover`.
- Container query at 581px to switch to side-by-side layout.

### Motion

- `--animation-line-speed: 300ms`
- `--animation-line: cubic-bezier(0.42, 0.63, 0.13, 0.99)` — eased-in
- Buttons transition color/border/background over 0.4–0.6s.
- Cards transition transform + box-shadow over 0.2s.

### Design principles inferred

> Spacious, photo-led, blue accents on white, pastel info surfaces, soft
> shadows over hard borders, generous radii on hero/pill elements, lightweight
> body type, color-mix derivation for hover states.

---

## 3. Dark Mode Concept — "Midnight Marina"

The brief is explicit: not cyberpunk, not gaming, not neon. The reference is
**Apple TV's app shelf at night, Aman Resorts' web aesthetic, Airbnb Luxe's
quiet typography on charcoal**.

### Core idea

`--color-blue-dark` (#0f2541) — already in the palette — becomes the
**canvas**. Surfaces lift via subtle blue-shifted layering, not via gray. Blues
stay saturated for accent moments but desaturate slightly for text and chrome,
so the UI reads as ocean-at-night rather than tech-product-at-night.

### Background layer system (5 levels)

| Layer | Token | Value | Purpose |
|---|---|---|---|
| L0 — Void | `--color-bg` | `hsl(214, 50%, 7%)` (#0a1320) | Page background, full bleed |
| L1 — Canvas | `--color-surface` | `hsl(214, 45%, 10%)` (#0f1d2e) | Primary content surface |
| L2 — Raised | `--color-surface-raised` | `hsl(214, 40%, 13%)` (#152639) | Cards, modals base |
| L3 — Floating | `--color-surface-floating` | `hsl(214, 36%, 17%)` (#1d3046) | Hovered cards, popovers |
| L4 — Overlay | `--color-surface-overlay` | `hsl(214, 32%, 22%)` (#293f5a) | Tooltips, top-most chrome |

Hue is held constant at ~214° (matches `color-blue-dark`); only lightness
ladders. This is the trick that makes it feel like *one ocean*, not five
grays.

### Text

| Role | Token | Value | Contrast on L1 |
|---|---|---|---|
| Primary | `--color-text` | `hsl(210, 30%, 96%)` | 15.2:1 |
| Secondary | `--color-text-muted` | `hsl(212, 18%, 75%)` | 9.1:1 |
| Tertiary | `--color-text-faint` | `hsl(213, 15%, 58%)` | 5.4:1 |
| Inverse (on accent buttons) | `--color-text-inverse` | `hsl(214, 50%, 7%)` | — |

**Body weight lifts from 300 → 400 in dark mode.** Light weights cause
sub-pixel artifacts on dark — hard requirement.

### Accents

The cyan-blue (`#029cfd`) stays as the primary accent but gets a slightly
cooler night-mode sibling for headers and links so it does not vibrate.

| Token | Light | Dark |
|---|---|---|
| `--color-accent` | `hsl(203, 98%, 50%)` | `hsl(199, 90%, 60%)` (#34b8f5) |
| `--color-accent-hover` | derived | `hsl(199, 90%, 68%)` |
| `--color-accent-soft` | `--color-blue-light` | `hsl(203, 60%, 18%) / 0.6` (translucent) |

A second, **warm** accent — soft champagne — adds the luxury hospitality cue
(bedside reading lamp on a yacht):

| Token | Value |
|---|---|
| `--color-warm` | `hsl(36, 55%, 75%)` (#dfc28d) |
| `--color-warm-soft` | `hsl(36, 40%, 30%) / 0.4` |

Use sparingly — verified badges, "Featured" pills, premium-tier indicators.
Not for primary CTAs.

### Borders

Hairlines become luminance-based, not color-based:

```css
--color-border: hsla(212, 30%, 80%, 0.08);          /* default */
--color-border-strong: hsla(212, 30%, 80%, 0.16);   /* focus / dividers */
--color-border-accent: hsla(199, 90%, 60%, 0.4);    /* focus rings */
```

### Shadows + glow (replaces light-mode drop shadow)

In dark mode, shadows almost disappear — depth comes from **luminance + a 1px
inner highlight**.

```css
--shadow-sm: 0 1px 0 hsla(212, 30%, 100%, 0.04) inset, 0 2px 8px hsla(0, 0%, 0%, 0.5);
--shadow-md: 0 1px 0 hsla(212, 30%, 100%, 0.05) inset, 0 8px 24px hsla(0, 0%, 0%, 0.55);
--shadow-lg: 0 1px 0 hsla(212, 30%, 100%, 0.06) inset, 0 16px 48px hsla(0, 0%, 0%, 0.6);
--shadow-glow-accent: 0 0 0 1px hsla(199, 90%, 60%, 0.3), 0 8px 32px hsla(199, 90%, 60%, 0.15);
```

The inset top highlight is the single most important detail — it gives
surfaces their lifted-glass quality on dark backgrounds.

### Image treatment

Hero gets a **vertical gradient scrim**, not a flat overlay:

```css
linear-gradient(
  180deg,
  hsla(214, 50%, 7%, 0.20) 0%,
  hsla(214, 50%, 7%, 0.40) 40%,
  hsla(214, 50%, 7%, 0.85) 100%
);
```

Cards get a faint bottom fade so the image meets the dark card body without a
hard edge:

```css
linear-gradient(180deg, transparent 60%, hsla(214, 45%, 10%, 0.4) 100%);
```

### Glassmorphism — yes, but only here

- Sticky header (over hero):
  `backdrop-filter: blur(20px) saturate(140%)`,
  bg `hsla(214, 45%, 10%, 0.6)`.
- Search bar floating over hero:
  `backdrop-filter: blur(24px)`,
  bg `hsla(214, 40%, 13%, 0.55)`,
  border `hsla(255, 100%, 100%, 0.08)`.
- Modals: solid L3 surface, no glass. (Glass on glass is muddy.)

---

## 4. Component Redesigns

### Header / Navigation

- **Default state:** transparent over hero, glass when scrolled past hero
  (`backdrop-filter: blur(20px) saturate(140%)` + `hsla(214, 45%, 10%, 0.6)`).
- Bottom hairline `1px solid var(--color-border)` only after scroll.
- Logo: keep current mark; if a navy lockup exists, switch to white-on-
  transparent variant in dark.
- Nav links: `--color-text-muted` resting → `--color-text` on hover, with a 1px
  underline at `--color-accent`.
- Mobile menu: full-bleed L1 sheet, slide from right,
  `box-shadow: -32px 0 64px hsla(0,0,0,0.6)`. Items
  `padding-block: var(--spacing-4)`, hairline divider `--color-border`.

### Hero

- Same image, swap overlay to the vertical gradient scrim above.
- Title: weight 800, tracking -0.02em, color `--color-text` (no shadow needed
  against scrim).
- Description: `--color-text-muted`, 18px, max-width 60ch.
- Remove `corner-shape: squircle` (no support); keep
  `border-radius: var(--radius-xl)` (32px) on the hero frame so it floats
  inside the page padding.
- A subtle 1px inset border in `hsla(255,100%,100%,0.06)` on the hero frame
  defines the edge against L0.

### Search Bar

- Floats below hero title, glass-effect surface (L2 with backdrop-filter).
- Border `hsla(255,100%,100%,0.10)`, inner highlight
  `inset 0 1px 0 hsla(255,100%,100%,0.05)`.
- Field dividers: 1px column rules `--color-border`, no full borders per
  field.
- Input text `--color-text`, placeholder `--color-text-faint`.
- Focus moves the full bar: subtle `--shadow-glow-accent` ring + accent-colored
  hairline on the active segment only.
- Submit button: solid `--color-accent`, 44px tall, pill radius, white text,
  soft accent glow on hover.

### Destination / Boat Cards

Light → dark mapping for `BoatCard.module.scss`:

- `--_card-background` → `--color-surface-raised` (L2).
- `--_card-shadow` → `--shadow-md`.
- `--_card-shadow-hover` → `--shadow-lg` plus a 1px accent border
  `hsla(199, 90%, 60%, 0.25)` instead of a transform-only effect (transform
  scale 1.02 is fine but feels gimmicky in luxury context — prefer a slow
  opacity lift on a dim image overlay).
- Detail chips (`.detail`): swap `#f9f9f9` and `#eaeaea` for
  `--color-surface-floating` and `--color-border`. **This is a token-drift fix
  that should ship regardless of dark mode.**
- Price value: `--color-text`, weight 600. Price label: `--color-text-faint`.
- Footer top border: `--color-border`, not `--color-grey-border`.
- Image: add the bottom-fade gradient overlay as a `::after` so it merges
  into the card body.

### Owner Boat Card

Token swaps + a few opinionated changes:

- Background `--color-white` → `--color-surface-raised`.
- Shadow `0 2px 8px rgba(0,0,0,0.1)` → `--shadow-md`.
- Title color `--color-main` → `--color-text`.
- Location street `--color-main` → `--color-text`; detail
  `--color-grey-dark` → `--color-text-muted`; icon `--color-grey` →
  `--color-text-faint`.
- Verified icon `--system-success` is currently dark green (#046239) —
  invisible on dark. Swap to `--color-warm` (champagne) in dark; reads more
  luxurious anyway and aligns with "trust + premium."
- **Fix the phantom token**: `--color-grey` → `--color-accent`. Ships the
  focus ring properly in both modes.
- Status switch (`theme="green"`): on dark, the active state should shift to
  `--color-accent` so it reads as the brand, and the off-state track should be
  `hsla(212, 30%, 80%, 0.16)`.

### Carousels / Sliders

- Arrows: glass pill, `hsla(214,40%,13%,0.7)` + blur, `--color-text` icon, ring
  on hover.
- Dot indicators: 6px circles, `hsla(212,30%,80%,0.3)` resting,
  `--color-accent` active.
- Edge fade: linear gradient from L1 transparent to L1 solid over the last
  48px on each side, so off-screen cards dissolve rather than abruptly clip.

### Feature / Value-Prop Cards

- Pastel info-card backgrounds (`cards-info-*`) do not translate. Encode the
  same semantic via low-saturation tinted L2:
  - `cards-info-blue` → `hsla(203, 50%, 25%, 0.4)` over L1
  - `cards-info-sand` → `hsla(36, 35%, 30%, 0.35)` over L1
  - `cards-info-sage` → `hsla(150, 25%, 28%, 0.35)` over L1
  - and so on. Aim for ~8% chroma so they read as ambient hint, not bright
    callout.
- Icon tint: matches the card hue family at higher saturation
  (`hsl(203, 80%, 70%)` for blue card icons, etc.).

### Footer

- L0 background, top border `--color-border`.
- Three columns of `--color-text-muted` links, headers in `--color-text`.
- Newsletter input: glass treatment same as search.
- Bottom row: legal links in `--color-text-faint`, separator dots.
- Optional: a single faint warm-accent line in the brand mark area to
  subliminally close the page with the same luxury cue the verified badge
  uses.

### Buttons

Re-mapped variants. Hover via `color-mix(... white ...)` instead of
`... black ...` — that is the single non-obvious change for dark mode.

```css
--_btn-bg-color: var(--color-accent);
--_btn-hover-bg-color: color-mix(in srgb, var(--color-accent), white 12%);
```

- **Primary**: solid accent, white text, `--shadow-glow-accent` on hover.
- **Secondary**: L3 surface, `--color-text`, hairline border, lifts to L4 on
  hover.
- **Ghost**: transparent, hairline border `--color-border`, hover bg
  `hsla(255,100%,100%,0.04)`.
- **Danger**: keep red but lift to `hsl(354, 80%, 60%)` so it remains a
  warning without going crimson-on-black, and add a subtle red-tinted glow on
  hover.
- **Transparent**: white border 2px on hero — already works in dark, but
  tighten to `hsla(255,100%,100%,0.7)` so it does not fight the scrim.

### Forms / Inputs

- Background: `hsla(255,100%,100%,0.04)` (subtle white wash, not solid L2 —
  feels lighter and more luxurious).
- Border: `--color-border`.
- Focus: `--color-border-accent` (1px) +
  `0 0 0 3px hsla(199,90%,60%,0.18)` outer ring.
- Label: `--color-text-muted`, 14px, weight 500.
- Helper text: `--color-text-faint`, 12px.
- Error: text `hsl(354, 80%, 70%)`, border `hsla(354, 80%, 60%, 0.5)`, no red
  flood-fill.

### Modals

- Solid `--color-surface-raised` (L2) — **not glass**.
- 16px radius.
- Backdrop: `hsla(214, 50%, 5%, 0.7)` + `backdrop-filter: blur(8px)`.
- `--shadow-lg` plus the inset highlight.
- Close button: ghost icon, top-right, 36px hit target.

### Mobile Menu

- Full-height L1 sheet from right, max-width 360px.
- Header section: avatar + greeting at top, hairline below.
- Items: 56px tall, `--color-text`, chevron right in `--color-text-faint`.
- Active page: thin 2px accent bar on the left + `hsla(199,90%,60%,0.06)`
  background.

---

## 5. Design Tokens

These plug into the existing `_css-variables.css` pipeline. Keep the
auto-generated `:root` block as the **light** mode (no change) and add a
`[data-theme="dark"]` block that overrides only the semantic layer.

The recommended path is to introduce a new **semantic layer** —
`--color-bg`, `--color-surface`, `--color-text`, etc. — that both modes target,
so components stop binding directly to `--color-white`, `--color-grey-dark`,
etc.

### New semantic tokens (add to both modes)

```css
:root {
  /* Surfaces */
  --color-bg: var(--color-white);
  --color-surface: var(--color-white);
  --color-surface-raised: var(--color-white);
  --color-surface-floating: var(--color-grey-lighter);
  --color-surface-overlay: var(--color-grey-light);

  /* Text */
  --color-text: var(--color-main);
  --color-text-muted: var(--color-grey-dark);
  --color-text-faint: var(--color-grey);
  --color-text-inverse: var(--color-white);

  /* Accents */
  --color-accent: var(--color-blue);
  --color-accent-hover: color-mix(in srgb, var(--color-blue), black 10%);
  --color-accent-soft: var(--color-blue-light);
  --color-warm: hsl(36, 60%, 55%);
  --color-warm-soft: hsl(36, 55%, 92%);

  /* Borders */
  --color-border: var(--color-grey-border);
  --color-border-strong: var(--color-grey-dark);
  --color-border-accent: var(--color-blue);

  /* Elevation */
  --shadow-sm: 0 1px 2px hsla(212, 20%, 30%, 0.08);
  --shadow-md: 0 4px 12px hsla(212, 20%, 30%, 0.10);
  --shadow-lg: 0 16px 40px hsla(212, 20%, 30%, 0.16);
  --shadow-glow-accent: 0 0 0 3px hsla(203, 98%, 50%, 0.18);

  /* Radius (codified, no more drift) */
  --radius-xs: 4px;
  --radius-sm: 6px;        /* buttons */
  --radius-md: 8px;        /* default — = --border-radius */
  --radius-lg: 12px;       /* cards */
  --radius-xl: 24px;       /* hero, large surfaces */
  --radius-pill: 999px;    /* replaces 44px magic number */

  /* Image scrims */
  --scrim-hero: linear-gradient(180deg,
    hsla(214, 50%, 7%, 0.20) 0%,
    hsla(214, 50%, 7%, 0.40) 40%,
    hsla(214, 50%, 7%, 0.85) 100%);
  --scrim-card-bottom: linear-gradient(180deg,
    transparent 60%, hsla(214, 45%, 10%, 0.4) 100%);
}
```

### Dark mode override

```css
[data-theme="dark"] {
  /* Surfaces — single hue (214°), lightness ladder */
  --color-bg: hsl(214, 50%, 7%);
  --color-surface: hsl(214, 45%, 10%);
  --color-surface-raised: hsl(214, 40%, 13%);
  --color-surface-floating: hsl(214, 36%, 17%);
  --color-surface-overlay: hsl(214, 32%, 22%);

  /* Text */
  --color-text: hsl(210, 30%, 96%);
  --color-text-muted: hsl(212, 18%, 75%);
  --color-text-faint: hsl(213, 15%, 58%);
  --color-text-inverse: hsl(214, 50%, 7%);

  /* Accents */
  --color-accent: hsl(199, 90%, 60%);
  --color-accent-hover: color-mix(in srgb, hsl(199, 90%, 60%), white 12%);
  --color-accent-soft: hsla(203, 60%, 35%, 0.35);
  --color-warm: hsl(36, 55%, 75%);
  --color-warm-soft: hsla(36, 40%, 30%, 0.4);

  /* Borders — luminance, not chroma */
  --color-border: hsla(212, 30%, 80%, 0.08);
  --color-border-strong: hsla(212, 30%, 80%, 0.16);
  --color-border-accent: hsla(199, 90%, 60%, 0.4);

  /* Elevation — black + inner highlight */
  --shadow-sm: inset 0 1px 0 hsla(212, 30%, 100%, 0.04),
               0 2px 8px hsla(0, 0%, 0%, 0.50);
  --shadow-md: inset 0 1px 0 hsla(212, 30%, 100%, 0.05),
               0 8px 24px hsla(0, 0%, 0%, 0.55);
  --shadow-lg: inset 0 1px 0 hsla(212, 30%, 100%, 0.06),
               0 16px 48px hsla(0, 0%, 0%, 0.60);
  --shadow-glow-accent: 0 0 0 1px hsla(199, 90%, 60%, 0.30),
                        0 8px 32px hsla(199, 90%, 60%, 0.15);

  /* System colors that need lifting */
  --system-success: hsl(154, 60%, 55%);   /* was 20% L — invisible on dark */
  --system-error: hsl(354, 80%, 65%);
  --system-warning: hsl(41, 85%, 65%);

  /* Body weight bump */
  --ui-body-font-weight: 400;             /* was 300 (light) */
}
```

### Pixel-token-only changes (independent of dark mode)

```css
:root {
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 24px;
  --radius-pill: 999px;
}
```

Worth shipping regardless — fixes existing radius drift across the codebase.

---

## 6. Implementation Plan

### Phase A — Pre-work (no visible change)

1. **Add semantic tokens** to `_css-variables.css`. Style-dictionary does not
   need to know about them — they can live in a sibling file
   `_css-variables-semantic.css` imported after the generated one, or added to
   a `tokens/semantic.json` if they belong in the pipeline.
2. **Sweep components** to migrate from raw tokens to semantic tokens. A grep
   for `--color-white`, `--color-main`, `--color-grey-dark`,
   `--color-grey-border`, `box-shadow:` literals in `*.module.scss` will find
   the offenders. Top of the list: `BoatCard.module.scss` (hardcoded hex),
   `OwnerBoatCard.module.scss` (broken token reference).
3. Codify the **radius scale** and migrate `var(--border-radius)`, `44px`,
   `8px`, `12px` literals to `--radius-*`.
4. Lift body weight token to 400 in dark-mode override only.

### Phase B — Dark-mode plumbing

1. Add `[data-theme="dark"]` block.
2. Add a `ThemeProvider` (or small client hook) that:
   - Reads `prefers-color-scheme` on first visit.
   - Persists user choice in `localStorage` (e.g. key `db-theme`).
   - Sets `data-theme` on `<html>` early — in `app/layout.tsx`, inline a tiny
     script before hydration to avoid flash of light mode.
3. Add a toggle in the user menu / mobile menu. Three states: System / Light /
   Dark.

### Phase C — Component-by-component

Ship one surface at a time, in this order (least → most risk):

1. Footer + static marketing pages
2. Cards (Boat, Destination, Owner) — component-scoped private vars do most of
   the work
3. Forms / Inputs
4. Buttons (verify all 9 variants)
5. Hero + Search bar (most visual impact, also most risk for image
   legibility)
6. Modals + overlays
7. Header / Navigation (sticky behavior + glass effect)

For each, take a Playwright screenshot in both themes and review side by
side.

### Image overlays — best practices

- Use the `--scrim-hero` gradient on every full-bleed image where text
  overlays. Do not trust `text-shadow`.
- Card images: bottom fade only (60%→100%), no blanket darkening.
- Lazy-load with a placeholder of `--color-surface-raised` (not light gray) so
  dark-mode users never see a flash of white.

### Contrast targets

- Body / paragraph text: ≥ 7:1 (AAA).
- Large headings, muted captions: ≥ 4.5:1 (AA).
- Non-text UI (focus rings, dividers used to convey state): ≥ 3:1.
- Proposed text tokens hit 15.2 / 9.1 / 5.4 against L1 — comfortable margins.

### Animation

- Keep existing 300ms / `cubic-bezier(0.42, 0.63, 0.13, 0.99)` curve.
- Theme transition: animate `background-color` and `color` on `body` and on
  key surface classes for **150ms only**, then remove. Long theme-toggle
  transitions feel cheap.
- Respect `prefers-reduced-motion: reduce` — buttons already do this.

### Mobile

- Glass effects (`backdrop-filter`) are GPU-cheap on iOS but can drop frames
  on lower-end Androids. Provide a fallback:
  `@supports not (backdrop-filter: blur(20px))` → solid L2 with 0.92 alpha.
- Increase touch targets by 4–8px in dark mode if visual weight on borders
  drops.
- Test on real OLED — pure black (#000) is tempting but causes smearing on
  scroll. The recommended L0 (#0a1320) avoids this and reads as luxurious.

### Performance

- No new images required.
- Adds ~2KB to CSS for the dark override.
- `backdrop-filter` is the only meaningful cost — confined to header + search
  + modal backdrop.

### Pitfalls

- **Status colors silently failing.** `--system-success` at 20% lightness is
  unreadable on dark. Override or every "active" badge becomes a black
  smudge.
- **Photography.** Some boat listings have flat overcast/white-sky images that
  look orphaned on a dark canvas. Add a `--scrim-card-bottom` gradient so
  card images always merge into the body.
- **Maps.** `components/Map/` likely uses Google Maps default tiles — switch
  to a dark map style in dark mode or it is a glaring white box.
- **Stripe Elements.** Stripe inputs need a separate dark theme via their
  `appearance` API — token swapping will not reach inside their iframe.
- **Contentful images.** If creators upload PNGs with white backgrounds, they
  print as white rectangles in dark. Either enforce transparency in the upload
  flow or wrap with a fitted dark frame.

---

## 7. Final Recommendations

1. **Do not ship dark mode without first paying the token-drift debt.**
   `BoatCard.module.scss` has 6+ hardcoded hex values; `OwnerBoatCard`
   references a phantom `--color-grey`. Dark mode will surface every
   shortcut anyone took. The cleanup ships value either way.
2. **Make `--color-blue-dark` (#0f2541) the canvas.** It is already in the
   brand. Anchoring dark mode in a token that is already approved is the
   difference between "visual evolution" and "skin."
3. **Adopt a semantic token layer.** `--color-surface`, `--color-text`,
   `--color-border` are the abstractions that make this maintainable for a
   year, not just one launch.
4. **Lift body weight to 400 in dark mode.** Non-negotiable. 300 weight on
   dark is the single most common reason luxury dark redesigns feel cheap.
5. **Replace flat overlays with vertical scrims everywhere images carry
   text.** Largest perceived-luxury delta for the smallest amount of code.
6. **Use the warm champagne accent for verified / featured / premium markers
   only.** It is the differentiator from "another nice dark UI" to "a yacht
   charter brand at night."
7. **Ship the toggle as a tri-state** (System / Light / Dark) in the user
   menu. Forcing dark or auto-detecting without an opt-out always generates
   support tickets.
8. **Plan a maps + Stripe pass.** Both bypass the token system; both will
   look broken if missed.

The bones of the token system support this redesign. The work is in the
cleanup and the semantic layer, not in inventing a new aesthetic —
`color-blue-dark` and `color-blue` already are the dark mode being described.
The redesign is mostly *making them load-bearing*.

---

# Addendum — Global Scope Findings

The first pass leaned heavily on card examples. Re-reading at the global level
(`app/layout.tsx`, `styles/globals.scss`, `Navigation.module.scss`,
`Footer.module.scss`, `Section.module.scss`, `_mixins.scss`,
`tailwind.config.js`) surfaced material that changes the strategy. The
sections below supersede or extend, not replace, the report above.

## G1. The site already has dark "islands"

The brand is not light-mode-only — it is light-mode *with embedded dark
moments*:

- **Footer**: `Section.module.scss` defaults `--_section-bgr: var(--color-main)`
  with white text. Every page closes on a deep-navy band already.
- **Hero scrim**: `Hero.module.scss` overlays `rgba(0,0,0,0.3)` over the hero
  image so the `--color-white` title reads.
- **Section image overlay**: `Section.module.scss` does the same on any image
  section: `--_section-image-overlay-color: rgba(0, 0, 0, 0.3)`.
- **Navigation when `is-open`** on mobile: switches to `--color-sapphire`
  (phantom — see G6) and goes full-bleed.

**Implication.** The dark-mode redesign is not introducing a new aesthetic; it
is letting the *island take over the whole canvas*. That reframes the brief —
the visual language is already in the codebase, just confined to small
moments.

## G2. The platform stopped one inch short of dark mode

`styles/globals.scss` contains:

```scss
// color-scheme: light dark;            // line 96, commented
// color: light-dark(var(--color-main), var(--color-white));  // line 103, commented
```

Someone planned dark mode, wired up the CSS hooks, and reverted. **Don't
re-introduce these unless you commit to `light-dark()` as the strategy.**
`light-dark()` is elegant for tokens but blocks SSR-safe theme persistence
(it follows OS preference at runtime; it cannot be forced from a cookie / pref
without `color-scheme` on the root). The recommended path remains
`[data-theme="dark"]` so the user's saved preference wins over OS.

A separate signal: `app/layout.tsx` already ships **two favicons**:

```tsx
<link rel="icon" href="/favicon.ico" media="(prefers-color-scheme: light)" />
<link rel="icon" href="/favicon-dark.ico" media="(prefers-color-scheme: dark)" />
```

So the brand asset for dark mode exists. Verify the file is the inverted /
luminous version of the logo; if not, this is a quick design fix.

## G3. Typography — it's Poppins, not "system sans"

Found in `styles/globals.scss`: `--body-font-family: "Poppins", sans-serif;`,
loaded via Next.js fonts in `utils/fonts.ts` and applied at the root with
`body className={poppins.className}`.

Poppins-specific consequences for dark mode:

- **Poppins 300** has thin verticals and ovular o/e/c bowls. On dark canvases
  these get eaten by glow / sub-pixel rendering, especially on Retina at 16px.
  The earlier recommendation (lift body to 400) is **non-negotiable** with
  Poppins specifically.
- **Heading 800 ("black")** is solid; preserve.
- Poppins reads "luxury but friendly." It is correct for the brand. The dark
  treatment must not turn it cold — keep generous tracking on display sizes
  (-0.01 to -0.02em is fine; do not crunch tighter).
- Poppins has no italic with the brand voice. Don't introduce it; use weight
  shifts for emphasis.
- Consider preloading `Poppins-400` in addition to whatever weights you
  currently preload — the dark switch will swap the body weight from 300 to
  400 and you do not want a reflow.

## G4. The dual-accent system

Two distinct accent colors are in use, doing different jobs:

| Token | Value | Job |
|---|---|---|
| `--color-blue` | `hsl(203, 98%, 50%)` | UI accent — buttons, links, swiper, focus |
| `--color-highlight` | `hsl(0, 90%, 54%)` (#F31F1F red) | **Logo brand fill** — `.logo-brand { fill: var(--color-highlight); }` |

The first pass treated `color-blue` as the only accent. The logo carries a
red brand mark that does not appear anywhere else in the UI.

**Dark mode implication.** The red logo is the only saturated red in the whole
site. On a deep-navy canvas, #F31F1F at 50% L vibrates aggressively — chromatic
aberration, halation. Two options:

1. **Keep the red, drop saturation slightly in dark:** `hsl(0, 75%, 60%)` —
   reads as the same red, doesn't hum.
2. **Substitute `--color-warm` (champagne)** in dark mode, treating the logo
   accent as a hospitality cue rather than a brand-loud beacon. Higher-end,
   matches the luxury direction. Riskier brand call — needs sign-off.

Do not leave the red unmodified. Test on OLED before deciding.

## G5. The page background isn't actually white

```scss
body { background-color: var(--_body-bgr, color-mix(in srgb, var(--color-grey), white 98%)); }
```

It's a 2%-tinted warm-gray off-white. Imperceptible, but it means
`--color-white` is **not** the page surface — it's the card surface. The
dark-mode mapping needs to make this distinction:

- `--color-bg` = L0 (page) → was the off-white tint in light, becomes the
  void in dark.
- `--color-surface` = L1 (cards / nav) → was `--color-white` in light,
  becomes L1 in dark.

The semantic layer in section 5 already encodes this; the addendum is the
*recognition* that the existing `--color-white` references are doing
double-duty and should split into `--color-bg` and `--color-surface` during
the migration sweep.

The `[data-admin]` body has `--_body-bgr: var(--color-grey-light)` — admin
pages already have a different surface. Dark mode for admin should also
slightly shift L0 (e.g. `hsl(214, 50%, 5%)` instead of 7%) to preserve the
admin / consumer differentiation.

## G6. Phantom-token inventory (full audit, not just OwnerBoatCard)

The first pass identified one phantom token. The actual inventory:

| Phantom | Files affected (count) | Likely intent |
|---|---|---|
| `--color-grey-100` | `_mixins.scss` (card-clickable shadow) | very-light grey |
| `--color-grey-200` | `_mixins.scss`, `Calendar`, `Pagination` (commented), GalleryBase (commented) | light grey — focus/hover |
| `--color-grey` | `_mixins.scss` (card-clickable, swiper), `Pagination`, `OwnerBoatCard`, `Gallery`, `Mosaic`, `InfoCard` | mid grey — primary accent in places |
| `--color-grey-dark` | `Pagination` | dark teal |
| `--color-ocean` | `globals.scss` (tap highlight) | mobile tap highlight |

**This is a hidden second design language.** Someone was building toward a
teal/sapphire/ocean accent system that never made it into `tokens/colors.json`.
Either:

- **Resolve forward:** add the missing tokens to `colors.json`, decide the
  values, and ship them as part of the dark-mode work (it's the natural moment
  to clean up).
- **Resolve backward:** sweep the codebase and replace each phantom with the
  intended existing token (`--color-grey` → `--color-blue` or
  `--color-green` depending on context).

Option 1 is faster but expands the palette permanently. Option 2 is the
"don't add a new system on the way out" call.

The `card-clickable` mixin in `styles/_mixins.scss:202` is especially load-
bearing — it defines the *global* clickable-card behavior. Whatever you decide
for the phantoms, this mixin must resolve to real tokens before dark mode
ships, or every hover state degrades to `currentColor`.

## G7. Navigation is the brand's signature shape — and the riskiest dark surface

`Navigation.module.scss` reveals:

- **Floating capsule:** `position: sticky; top: var(--spacing-4); margin-top: var(--spacing-4)` — the nav floats inside the page padding, not edge-to-edge.
- **Pill geometry:** `border-radius: var(--spacing-8)` (32px) plus
  `corner-shape: squircle` (no support — same dead CSS as Hero).
- **Scroll-state container query:** `@container header scroll-state(stuck: top)` toggles a shadow when stuck. Modern, correct, recently-supported.
- **Inner menu capsule:** `.navigation__menu` is a `--color-grey-light` pill
  *inside* the white nav, holding the link group — a "pill within a pill."
- **Sublist** drops with `box-shadow: 0 10px 40px color-mix(...)` and a 1px
  hairline border via color-mix.

**Dark-mode implication.** This floating capsule is the most identity-bearing
chrome on the site. Treating it as a glass capsule (translucent L2 +
backdrop-filter) is the highest-impact dark-mode move you can make. Keep the
32px radius. Replace the inner `--color-grey-light` capsule with a 1-stop
brighter L3 surface so the nested-pill effect survives. The sublist gets
solid L3 (no glass-on-glass) with a 1px highlight border.

**Hard constraint.** The mobile `is-open` state goes full-bleed and switches
to `--color-sapphire` (a phantom). On dark mode, the full-bleed sheet should
become L1 with the same hairline divider treatment as cards — and the
`--color-sapphire` reference must be resolved to a real token first.

## G8. Footer is *already* the dark mode

`Section.module.scss:8` sets default section background to `--color-main`
(deep navy, `hsl(223, 37%, 24%)`) with `--color-white` text and white-alpha
borders (`rgba(255,255,255,0.2)` on `.footer__bottom`).

Three consequences:

1. The footer is a **near-perfect ergonomic preview** of how the rest of the
   page will feel in dark mode. Get its readability, hover states, and link
   density right *first* — it doubles as a dark-mode design lab without
   touching anything else.
2. In the dark redesign, the footer needs to *not look the same as the page
   above it*. If L0 is `hsl(214, 50%, 7%)` and the footer remains
   `hsl(223, 37%, 24%)`, the footer becomes the lightest band on the page —
   inverted from light mode. The fix: footer drops to L0 (`--color-bg`) and
   page elevates to L1.
3. `--color-main` itself probably becomes a *light-mode-only* surface token
   in dark mode — it cannot reuse value because it's no longer dark enough to
   be a contrast anchor.

## G9. Cascade Layers + View Transitions = a real opportunity

`globals.scss:11` declares: `@layer frameworks, reset, base, theme, layouts, components, utilities;`

Dark-mode `[data-theme="dark"]` overrides should land in the **theme** layer.
That ensures:

- They take precedence over `base` and `reset` (where the light tokens
  currently live).
- They are *overridable* by `components` and `utilities` for one-off
  exceptions without specificity wars.

`globals.scss:57-82` enables `@view-transition { navigation: auto; }` with
custom slide-in/slide-out keyframes. **Use the same API for theme switching:**

```ts
function toggleTheme(next: 'light' | 'dark') {
  if (!document.startViewTransition) {
    document.documentElement.dataset.theme = next;
    return;
  }
  document.startViewTransition(() => {
    document.documentElement.dataset.theme = next;
  });
}
```

Pair with a `::view-transition-old(root) { animation: fade 200ms }` rule so
the toggle dissolves rather than snaps. That single 4-line addition is what
makes the toggle feel *premium* instead of *technical*.

## G10. Tailwind v4 — wired but unused for theming

`tailwind.config.js` is minimal: `preflight: false` and the content globs.
`globals.scss` imports `tailwindcss/utilities.css` inside the `utilities`
layer. There is no `@theme` block, so Tailwind utilities currently produce
default colors, not brand tokens.

**Decision point for dark mode.** Two paths:

- **Path A (recommended):** Stay outside Tailwind for theming. `[data-theme]`
  drives the cascade, components use `var(--color-*)` semantic tokens. Tailwind
  utilities are used only for layout/spacing (padding, grid). This matches
  the codebase as-is and avoids a Tailwind-config refactor.
- **Path B:** Add `@theme inline` in CSS to mirror the semantic tokens, then
  configure Tailwind v4's variant: `@variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))`. Components then get `dark:bg-surface` style utilities. More power, more migration cost.

Recommend Path A. The codebase's CSS Modules + private custom property
pattern is already doing the same job better.

## G11. Theme-switching architecture (the missing piece from the first pass)

The original Phase B mentioned a `ThemeProvider`. With the global picture, the
specific implementation looks like:

**1. Pre-hydration script** (in `app/layout.tsx`, before children):

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){try{
      var s = localStorage.getItem('db-theme');
      var t = s === 'light' || s === 'dark' ? s
            : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.dataset.theme = t;
    }catch(e){}})();`,
  }}
/>
```

This runs before paint and prevents the white-flash. Required because the
existing `<html lang="en">` is server-rendered.

**2. `color-scheme` on the root** must update with `data-theme`:

```css
:root { color-scheme: light; }
[data-theme="dark"] { color-scheme: dark; }
```

This drives native form chrome (scrollbars, date pickers, autofill yellow)
to match. Without it, scrollbars stay light in dark mode and look amateur.

**3. Section component naming collision.** `Section.module.scss:121-129`
already uses `data-theme="light" | "dark" | "highlight"` as a *section
background* attribute — `data-theme="dark"` there means "light gray bg." This
will conflict the moment you put `data-theme="dark"` on `<html>`.

**Fix before shipping dark mode:** rename Section's variant to `data-variant`
or `data-tone`:

```scss
&[data-tone="surface"] { --_section-bgr: var(--color-grey-light); }
&[data-tone="highlight"] { --_section-bgr: var(--color-blue-light); }
```

This is a non-trivial rename across however many `<Section>` usages exist,
but it must happen — otherwise `[data-theme="dark"]` on `<html>` will cascade
down and inadvertently match every section with `data-theme="dark"`,
producing a mode-flicker effect.

**4. Toggle placement.** The user menu (`ProfileMenu.tsx`) for desktop, the
mobile sheet's settings section for mobile. Three radio options: System /
Light / Dark.

**5. Storage.** `localStorage['db-theme']` with `'system' | 'light' | 'dark'`
as the persisted values. `'system'` means "do not pin"; the pre-hydration
script then falls through to `prefers-color-scheme`.

## G12. Things to fix *before* dark mode (consolidated checklist)

These are blockers, not nice-to-haves:

1. **Resolve the phantom token system** (G6) — `--color-grey-*`, `--color-sapphire`, `--color-ocean`. Ship as light-mode-clean PR first.
2. **Rename Section's `data-theme`** to `data-tone` (G11.3) — naming collision with global theme.
3. **Update `app/layout.tsx`** with the pre-hydration script and verify the dark favicon at `/public/favicon-dark.ico` is correct.
4. **Remove `corner-shape: squircle`** from Navigation and Hero — it does
   nothing for ~98% of users and the 32px radius is already correct.
5. **Migrate components from `--color-white`/`--color-main` to semantic
   `--color-surface`/`--color-text`** during the cleanup sweep. The two should
   ship together — single PR per component file.
6. **Audit hardcoded `rgba(255, 255, 255, X)` in dark surfaces** (footer
   borders, Section toggleBtn) — these are correct in light mode (where they
   render on a dark Section), but in global dark mode they need to become
   `--color-border` / `--color-border-strong` to scale across surfaces.
7. **Add `accent-color` to dark mode root** — currently
   `accent-color: color-mix(in srgb, var(--color-blue), black 25%)` — this
   needs to update to a dark-friendly value, otherwise native form controls
   (checkboxes, radios) read wrong.

## G13. Revised "first move"

The original report recommended starting with footer + static pages. With the
global picture, the better first move is:

> **Ship the phantom-token cleanup + the Section data-attribute rename + the
> `--color-white` → `--color-surface` semantic migration as one
> light-mode-only PR.** Visually it's a no-op. Functionally it's 80% of the
> dark-mode work — and it ships even if dark mode slips.

Then the dark-mode `[data-theme="dark"]` block plus the toggle are the second
PR, and they should be small.

This changes the political shape of the project: dark mode is no longer "a big
visual launch." It's a small flip on top of a refactor that is independently
valuable. That's the version of this project that ships.
