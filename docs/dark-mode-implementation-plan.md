# Dark Mode — bgmtl Implementation Plan

> Concrete, repo-grounded plan for adding dark mode to **bgmtl**, with a simple
> Moon/Sun toggle in the header before the language switcher.
>
> Companion to `dark-mode-design-exploration.md` (the Dream Boats design
> direction). That doc is the *aesthetic*; this doc is the *how*, mapped to the
> files that actually exist in this repo.
>
> **Scope decision:** the visible control is a single icon toggle. The real work
> is a thin semantic-token layer + a component sweep so surfaces respond to it.
> **Last updated:** 2026-06-05

---

## 0. TL;DR

- The toggle itself is ~1 hour. The *theme* is ~1–2 days, almost all of it a
  mechanical token sweep that is independently valuable.
- bgmtl is in **much better shape than the Dream Boats doc assumes**: small flat
  HSL palette, no phantom-token system to clean up, footer + nav already render
  on deep navy (a working dark surface to calibrate against).
- **Two hard blockers** unique to this repo, both must land before
  `[data-theme="dark"]` goes on `<html>`:
  1. `data-theme="dark"` is already used as a *local* prop in `Section` and
     `Pagination` — naming collision.
  2. No semantic token layer — components bind straight to `--color-white`,
     `--color-main`, `--color-black`.

Recommended: ship as **two PRs** — a no-visible-change refactor, then the dark
override + toggle.

> **Conventions in §3–4 are lifted verbatim from boats-web (dream-boats),** which
> already shipped this: the `data-theme` → `data-tone` rename, the Material 3
> semantic token names, the `tokens/semantic.json` + smart-knob
> `styles/_theme-dark.scss` split. bgmtl's token build is structurally identical,
> so the pattern drops in. Keeping the names aligned means one mental model across
> both repos.

---

## 1. What already exists (assets we get for free)

| Asset | Where | Why it matters |
|---|---|---|
| Pre-paint inline script pattern | `app/layout.tsx:41-46` | Copy it to set `data-theme` before first paint → no flash of light. |
| Cascade layers incl. `theme` | `styles/globals.scss:9` | `[data-theme="dark"]` overrides belong in `@layer theme` — clean precedence, no specificity wars. |
| `color-scheme` hook (commented) | `styles/globals.scss:191` | `// color-scheme: light dark;` — someone started this. We drive it per-theme instead. |
| View Transitions | `styles/globals.scss:63-88` | `document.startViewTransition` can wrap the theme flip for a premium cross-fade. |
| Lucide icon set | `components/Icon/Icon.tsx` | `Moon` / `Sun` available by name — `<Icon name="Moon" />`. Zero new deps. |
| Toggle slot | `components/Navigation/NavigationInner.tsx:108` | `<LocaleSwitcher />` sits here; drop `<ThemeToggle />` immediately before it. |
| Dark islands already shipped | `Footer.module.scss:7`, `Navigation.module.scss:31` (`--color-main`) | Footer + nav already render light text on deep navy — a calibrated dark surface to copy. |

---

## 2. Current token system

`styles/_css-variables.css` is style-dictionary output from `tokens/*.json`. One
flat tier, all HSL (good — re-mappable). Key values:

| Token | Value | Role today |
|---|---|---|
| `--color-main` | `hsl(209, 94%, 14%)` | Deep navy — primary text + nav/footer bg |
| `--color-blue` | `hsl(203, 98%, 42%)` | UI accent — links, buttons, swiper |
| `--color-blue-dark` | `hsl(214, 62%, 16%)` | Barely used — natural dark-canvas anchor |
| `--color-white` | `#fff` | Page + card surface (double duty) |
| `--color-grey-dark` | `hsl(0, 0%, 27%)` | Body text (`--ui-body-color`) |
| `--color-grey-light` | `hsl(0, 0%, 95%)` | Tints / section bg |
| `--color-grey-border` | `hsl(0, 0%, 80%)` | Hairlines |
| `--ui-body-font-weight` | `300` (light) | **Bump to 400 in dark** (line 104) |

**Gap:** there is no `--color-surface` / `--color-text` / `--color-border`
semantic layer. Components bind directly to the raw tokens above. Dark mode needs
that abstraction so one override block re-skins everything.

---

## 3. The two blockers (do these first)

### 3.1 `data-theme` naming collision — BLOCKER

> **This is already solved in boats-web (dream-boats).** Mirror it exactly.
> There, both `Section` and `Pagination` were renamed to `data-tone`, and the
> global dark mode owns `[data-theme="dark"]` on `<html>` alone.

`data-theme="dark"` is currently a *component-local* attribute meaning something
else. Putting `data-theme="dark"` on `<html>` would cascade into these:

- `components/Section/Section.module.scss:124` — `&[data-theme="dark"]` sets a
  **light-grey** bg; `:130` `data-theme="highlight"`. Prop at `Section.tsx:56`
  (`theme?: "light" | "dark" | "highlight" | "transparent"`), emitted at
  `Section.tsx:116` (`data-theme={theme}`).
- `components/Pagination/Pagination.module.scss:11,18,40,…` — `data-theme="dark"`
  + `"light"`. Prop at `Pagination.tsx:20`, emitted at `:93`.

**Fix — copy boats-web's convention:**

| Component | New attr | Value rename | boats-web reference |
|---|---|---|---|
| `Section` | `data-tone` | `dark` → `muted`; `light` → `surface`; keep `highlight`, `transparent` | `components/Section/Section.{tsx,module.scss}` |
| `Pagination` | `data-tone` | keep `dark` / `light` | `components/Pagination/Pagination.{tsx,module.scss}` |

In boats-web, Section uses the **fallback-chain** pattern so DevTools shows one
un-overridden declaration — each tone sets `--_section-bgr` once, and dark mode
sets only the inner `--_tone-*-bg`:

```scss
// Section.module.scss
&[data-tone="surface"]   { --_section-bgr: var(--_tone-surface-bg, var(--color-white)); }
&[data-tone="muted"]     { --_section-bgr: var(--_tone-muted-bg, var(--color-grey-light)); }
&[data-tone="highlight"] { --_section-bgr: var(--_tone-highlight-bg, var(--color-blue-light)); }

[data-theme="dark"] & {            // global dark sets only the inner knobs
  --_tone-surface-bg:   var(--surface-container);
  --_tone-muted-bg:     var(--surface-container-low);
  --_tone-highlight-bg: var(--primary-container);
}
```

**Call sites to update** (pass `tone=` instead of `theme=`, `dark`→`muted` for
Section):
- `components/Collection/CollectionConnector.tsx:95` (`theme="dark"`)
- `components/Hero/Hero.tsx:193` (`theme="dark"`)
- `components/Events/EventsConnector.tsx:107` (`theme="dark"`)
- `components/Pagination/Pagination.stories.tsx:47,70`

Mechanical, but must be 100% before the global attribute ships.

### 3.2 No semantic layer — the bulk of the work

boats-web uses a **Material 3 semantic naming scheme** (`--surface`,
`--on-surface`, `--primary`, `--outline`…). Adopt the same names so the two
codebases stay aligned. Raw-token usage across bgmtl `components/` (counts are
references, not files):

| Raw token | Refs | Maps to (M3 semantic) |
|---|---|---|
| `--color-white` | 59 | `--surface-container` (cards/nav) **or** `--background` (page) — split per use |
| `--color-main` | 37 | `--on-surface` (as text) / a surface token (as bg-fill) |
| `--color-grey` | 20 | `--outline` |
| `--color-blue` | 20 | `--primary` |
| `--color-grey-border` | 18 | `--outline-variant` |
| `--color-black` | 16 | `--on-surface` |
| `--color-grey-light` | 12 | `--surface-container-high` |
| `--color-grey-dark` | 6 | `--on-surface-variant` |

The `--color-white` and `--color-main` split is the only judgement-heavy part:
the same raw token means "surface" in some rules and "text/bg-fill" in others.
Decide per declaration during the sweep.

**Files needing the sweep** (have `--color-white` and/or `--color-main`):

```
Button, Calendar/EventCalendar, Cards/MemberCard, Cards/PrimaryCard,
Directory/DirectoryCard, Directory/FilterableDirectory, Events/Event,
Footer, Forms/Input, Forms/Select, Headings/Heading, Hero, Join, Modal,
Navigation, Navigation/LocaleSwitcher, News, Pagination, Section,
Widgets/Donate, Widgets/Membership
```

### 3.3 Hardcoded hex (won't respond to any token swap)

These bypass the token system entirely and will render light-on-light in dark
mode. Highest-risk first:

- **`Calendar/EventCalendar.module.scss`** — ~30 hardcoded hex
  (`#f0f0f0`, `#333`, `#0b57d0`, `#e3f2fd`, `#1565c0`, status pills…). This is
  the single biggest dark-mode liability. Migrate to tokens during the sweep.
- `Search/Search.module.scss`, `Search/Dropdown.module.scss`,
  `Forms/Input.module.scss`, `Table/Table.module.scss`,
  `Contacts`, `CookieConsent`, `Join`, `Events/Event`,
  `Cards/MemberCard` — spot-fix as encountered.
- `Footer.module.scss:57` `rgba(255,255,255,0.2)` and
  `Section.module.scss:118` `rgba(0,0,0,0.3)` overlays — fine in light (they sit
  on dark sections) but should become `--color-border` / a scrim token to scale.

(`components/Icons/*.jsx` hardcode fills inside SVG markup — handle case by case;
most are `currentColor`-able.)

---

## 4. The semantic token layer — mirror boats-web exactly

boats-web splits this into **two files**, and bgmtl's token build supports the
exact same setup (`tokens/config.js` already globs `./tokens/**/*.json` with
`outputReferences: true`):

1. **Light layer → `tokens/semantic.json`** (new file). style-dictionary
   compiles it into `_css-variables.css` alongside the existing tokens. It just
   aliases the M3 names onto bgmtl's current raw colors → a pure no-op visually.
2. **Dark layer → `styles/_theme-dark.scss`** (new file, hand-maintained).
   Imported via `@use "theme-dark";` near the top of `globals.scss` (boats-web
   has it at `globals.scss:7`).

### 4.1 `tokens/semantic.json` (light — adapted to bgmtl's colors)

bgmtl has no `grey-lighter` (boats-web does); substitute `grey-light`. Otherwise
identical names so both repos share the same component vocabulary:

```json
{
  "surface":                  { "value": "{color.grey-light}" },
  "surface-dim":              { "value": "{color.grey-light}" },
  "surface-bright":           { "value": "{color.white}" },
  "surface-container-lowest": { "value": "{color.white}" },
  "surface-container-low":    { "value": "{color.grey-light}" },
  "surface-container":        { "value": "{color.white}" },
  "surface-container-high":   { "value": "{color.grey-light}" },
  "surface-container-highest":{ "value": "{color.grey-mid}" },
  "on-surface":               { "value": "{color.main}" },
  "on-surface-variant":       { "value": "{color.grey-dark}" },
  "inverse-surface":          { "value": "{color.main}" },
  "inverse-on-surface":       { "value": "{color.white}" },
  "outline":                  { "value": "{color.grey}" },
  "outline-variant":          { "value": "{color.grey-border}" },
  "primary":                  { "value": "{color.blue}" },
  "on-primary":               { "value": "{color.white}" },
  "primary-container":        { "value": "{color.blue-light}" },
  "on-primary-container":     { "value": "{color.blue-dark}" },
  "error":                    { "value": "{system.error}" },
  "on-error":                 { "value": "{color.white}" },
  "background":               { "value": "{surface}" },
  "on-background":            { "value": "{on-surface}" }
}
```

Run `pnpm run build-dictionary` to regenerate `_css-variables.css` with these.

### 4.2 `styles/_theme-dark.scss` (dark — smart-knob model from boats-web)

boats-web derives the whole surface ladder from three knobs (`--dark-h/s/l`) so
there's one color to tune. Reuse verbatim, just re-anchor the hue to bgmtl's
`--color-main` family (bgmtl main = `#022443` ≈ `hsl(209 94% 14%)`; boats-web
uses 215°). bgmtl already ships `--color-blue-dark: #0f2541` — the *same* token
boats-web uses for `--primary-container`.

```scss
// Midnight Blue — bgmtl dark theme. Activated by [data-theme="dark"] on <html>.
[data-theme="dark"] {
  --dark-h: 209;   // ← bgmtl brand hue (color-main)
  --dark-s: 40%;
  --dark-l: 13%;

  --surface:                   hsl(var(--dark-h) var(--dark-s) var(--dark-l));
  --surface-dim:               hsl(var(--dark-h) var(--dark-s) calc(var(--dark-l) - 2%));
  --surface-bright:            hsl(var(--dark-h) var(--dark-s) calc(var(--dark-l) + 9%));
  --surface-container-lowest:  hsl(var(--dark-h) var(--dark-s) calc(var(--dark-l) - 7%));
  --surface-container-low:     hsl(var(--dark-h) var(--dark-s) calc(var(--dark-l) - 3%));
  --surface-container:         hsl(var(--dark-h) var(--dark-s) var(--dark-l));
  --surface-container-high:    hsl(var(--dark-h) var(--dark-s) calc(var(--dark-l) + 2%));
  --surface-container-highest: hsl(var(--dark-h) var(--dark-s) calc(var(--dark-l) + 6%));

  --on-surface:         hsl(20, 4%, 89%);
  --on-surface-variant: hsl(225, 6%, 79%);
  --inverse-surface:    hsl(20, 4%, 89%);
  --inverse-on-surface: hsl(0, 1%, 19%);

  --outline:         hsl(var(--dark-h) 14% 58%);
  --outline-variant: hsl(var(--dark-h) var(--dark-s) 30%);

  --primary:              hsl(203, 88%, 70%);   // vivid sky-blue (bgmtl blue, lifted)
  --on-primary:           hsl(209, 50%, 14%);
  --primary-container:    var(--color-blue-dark);   // #0f2541, already in palette
  --on-primary-container: hsl(203, 70%, 78%);

  --error:    hsl(7, 100%, 84%);
  --on-error: hsl(357, 100%, 21%);

  --background:    var(--surface);
  --on-background: var(--on-surface);

  color-scheme: dark;
  accent-color: var(--primary);

  --ui-body-font-weight: 400;   // Raleway 300 smears on dark
}

:root { color-scheme: light; }
```

> boats-web also re-tints its 8 InfoCard pastels in dark and has an experimental
> `@supports (contrast-color())` block — bgmtl has no InfoCard pastels, so skip
> that; keep the `contrast-color()` block only if you want the one-knob text too.

### 4.3 Footer must invert relationship

`Footer.module.scss:7` is `--color-main` (navy). In dark mode, if the page
becomes `--surface` (darker navy) and the footer stays `--color-main` (lighter),
the footer becomes the *brightest* band — backwards. Map footer bg to
`--surface-container-lowest` (or `--background`) so it stays the anchor, not a
highlight. (boats-web sets footer's private vars only under `[data-theme="dark"]`
— see its `Footer.module.scss:10`.)

---

## 5. The toggle component

New: `components/Navigation/ThemeToggle.tsx` (+ `.module.scss`), mirroring the
`LocaleSwitcher` shape (client component, lives in `navigation__right`).

Behavior:
- Three states preferred (`system` / `light` / `dark`) but a 2-state Sun↔Moon is
  acceptable for "keep it simple." Persist to `localStorage['bgmtl-theme']`.
- On click, set `document.documentElement.dataset.theme`. Optionally wrap in
  `document.startViewTransition(...)` (guard for support) for a cross-fade,
  reusing the View Transitions already enabled in `globals.scss`.
- Render `<Icon name="Moon" />` / `<Icon name="Sun" />`. Match the
  `Button variant="link" size="sm"` styling LocaleSwitcher uses so the two sit
  visually consistent.

Wiring in `NavigationInner.tsx`:

```tsx
<div className={styles.navigation__right}>
  <div className={styles.navigation__menu} …>…</div>
  <ThemeToggle />            {/* ← new, before LocaleSwitcher */}
  <LocaleSwitcher pageLocale={pageLocale} />
</div>
```

### 5.1 Pre-paint bootstrap (no flash)

Add a second inline script in `app/layout.tsx` (next to the existing
home-intro one at `:41`), running before paint:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){try{
      var s=localStorage.getItem('bgmtl-theme');
      var t=(s==='light'||s==='dark')?s:
        matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
      document.documentElement.dataset.theme=t;
    }catch(e){}})();`,
  }}
/>
```

`<html suppressHydrationWarning>` is already set (`layout.tsx:30`), so mutating
the attribute pre-hydration is safe.

---

## 6. Sequencing

### PR 1 — refactor, no visible change
1. Rename `Section` + `Pagination` `data-theme` → `data-tone` (`.tsx` +
   `.scss` + the call sites in §3.1). Adopt boats-web's tone values
   (`dark`→`muted` for Section). Verify nothing else reads them.
2. Add `tokens/semantic.json` (§4.1) and run `pnpm run build-dictionary` — all
   aliases resolve to current values → true no-op.
3. Sweep the §3.2 file list from raw → M3 semantic tokens.
4. De-hardcode `EventCalendar.module.scss` (and spot-fix other hex offenders).
5. Visual regression check: should be pixel-identical in light.

### PR 2 — dark mode
1. Add `styles/_theme-dark.scss` (§4.2) and `@use "theme-dark";` in
   `globals.scss` (boats-web has it at `globals.scss:7`).
2. Add `ThemeToggle` + wire into `NavigationInner` (§5).
3. Add the bootstrap script to `layout.tsx` (§5.1).
4. Invert the footer relationship (§4.3).
5. Walk each surface in both themes and tune. Order: Footer/Nav (already dark) →
   Cards → Forms → Buttons → Hero → Modal/Search → Calendar.

---

## 7. Risks / long tail

- **EventCalendar** — biggest single risk; ~30 hardcoded colors. Budget real
  time here, not a token swap.
- **Forms autofill** — `Forms/Input.module.scss:24`
  `box-shadow: 0 0 0 1000px #000 inset` is an autofill hack; verify it reads
  correctly (or invert) in dark.
- **Stripe / embeds** — if any payment/iframe widget exists (`Widgets/Donate`,
  `Widgets/Membership`), token swaps don't reach inside iframes; needs their own
  appearance config.
- **Images with white backgrounds** (Contentful uploads, logos) — may print as
  white rectangles on dark. Audit hero/logo assets; a `favicon-dark` already
  isn't set up here (light-only favicons in `layout.tsx:12-18`).
- **Hero scrim** — `Hero.module.scss` darkens images for legibility; verify the
  light-text-on-image still works once the page around it is also dark.

---

## 8. Effort

| Block | Estimate |
|---|---|
| PR 1 — rename collisions | 1–2 h |
| PR 1 — semantic tokens + sweep | 0.5–1 day |
| PR 1 — EventCalendar de-hardcode | 2–4 h |
| PR 2 — toggle + bootstrap + dark block | ~0.5 day |
| PR 2 — per-surface tuning | 0.5–1 day |
| **Total** | **~2–3 days** |

The toggle is the cheap part. The value (and the time) is the semantic layer and
the Calendar cleanup — both of which improve the codebase whether or not dark
mode ever ships.
