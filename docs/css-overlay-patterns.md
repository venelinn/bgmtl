# CSS Overlay Patterns: Grid Pile & `border-image`

How we stack images and text in this codebase **without `position: absolute` or `z-index`**.
Two techniques, when to reach for each, and the gotchas we hit along the way.

- [Grid Pile](#grid-pile) — stack any elements in one grid cell; stacking order = DOM order
- [`border-image` overlay](#border-image-overlay) — a gradient/scrim with no pseudo-element
- [Gotchas & decision guide](#gotchas--decision-guide)

Used in:
- `src/components/Section/Section.module.scss` — full-bleed hero (image + heading)
- `src/components/Cards/CategoryCard/CategoryCard.module.scss` — image card + centered title
- `src/components/Header/Header.module.scss` — gradient scrim behind the nav

---

## Grid Pile

### The idea

Put `display: grid` on a container, give it a single named cell, and place every child
into that same cell. They stack on top of each other like a pile of cards.

```scss
.pile {
  display: grid;
  grid-template-areas: "pile";
  > * {
    grid-area: pile;
  }
}
```

**Why this beats `position: absolute`:**

| | `position: absolute` | Grid pile |
|---|---|---|
| Stacking order | needs `z-index` | **DOM order** (last child wins) |
| Element sizing | taken out of flow | each item still sizes the cell |
| Centering | manual offsets | `align-self` / `justify-self` |

The big win: **stacking order is just source order.** The image comes first in the DOM,
the text comes last, so the text paints on top — no `z-index` to manage.

### Example: the Section hero

A `size="full-width"` section already inherits the page's bleed-grid columns, so we keep
that and pin the children to one row. The image spans the full bleed; the content keeps
its centered `content` column.

```scss
&:has(.section__image) {
  display: grid;
  grid-template-areas: "pile";
  grid-template-columns: 1fr;

  // fixed height so the image can't inflate the row (see gotcha #2)
  @media (min-width: $md) {
    grid-template-rows: var(--_section-bgr-min-height, 767px);
  }

  > * {
    grid-area: pile;
  }

  .section__inner {
    align-self: center;        // centered in the cell
    justify-self: center;
    width: min(100% - 2 * var(--padding-inline, 1rem), var(--content-max-width));
    color: var(--color-white); // text paints over the image by DOM order — no z-index
  }
}
```

### Scrim overlay inside a pile (no extra element)

A pseudo-element of the grid **container** is always the first (`::before`) or last
(`::after`) child — never between the image and the text. So to scrim _just_ the image,
make the image's own box a mini-pile and stack a pseudo over it:

```scss
// Section hero — image wrapper is its own pile
&__image {
  display: grid;
  grid-template: 1fr / 1fr;
  > *,
  &::after {
    grid-area: 1 / 1;          // <img> and scrim share one cell
  }
  img {
    place-self: stretch;       // grid stretches the image to the cell (see gotcha #3)
    min-width: 0;
    min-height: 0;
    object-fit: cover;         // crop to cover
  }
  &::after {                   // ::after comes after <img> → paints on top
    content: "";
    background-color: rgba(0, 0, 0, 0.3);
  }
}
```

When the image is a bare `<img>` with **no wrapper** (like `CategoryCard`), pile inside
whatever element already wraps the text — here the `<a>` — and use `::before` so the scrim
lands _under_ the heading:

```scss
// CategoryCard — link is its own pile
a {
  display: grid;
  grid-template-areas: "pile";
  > *,
  &::before {
    grid-area: pile;
  }
  &::before {                  // ::before → under the heading, over the image
    content: "";
    border-radius: var(--spacing-2); // match the image corners
    background-color: rgba(0, 0, 0, 0.1);
  }
}
```

Rule of thumb: **`::before` to sit under the following content, `::after` to sit over the
preceding content.**

---

## `border-image` overlay

### The idea

`border-image: fill 0 <gradient>` paints a gradient across an element's **whole interior**,
with **no pseudo-element, no positioning, no z-index**. Credit: Temani Afif / Kevin Powell
([23 CSS features](https://www.youtube.com/watch?v=opHu7HvFM60)).

- `0` — zero-width border slices, so it works with **no `border-width`**
- `fill` — paints the image's middle region across the padding box

### Example: the header gradient scrim

```scss
.main {
  // Gradient scrim behind the nav so white links read over a hero.
  // Unset --_header-gradient (non-hero pages) → invalid value → no gradient,
  // so it stays conditional for free.
  border-image: fill 0 var(--_header-gradient);
}
```

This replaced an absolutely-positioned `::after` with `z-index: -1`, `width/height: 100%`,
and a `content:` toggle — all gone.

### ⚠️ It does NOT work on `<img>` tags

`border-image` paints **under** an element's replaced content. On a real `<img>` the photo
paints on top of the border-image, hiding it. It only works on elements with a
**`background-image`** or whose content sits above the border layer (a `<div>`, `<header>`,
etc.).

| Target | `border-image` overlay works? |
|---|---|
| `<div>` / `<header>` with `background-image` | ✅ yes |
| `<img>` element (e.g. `next/image`) | ❌ no — use a grid-pile scrim instead |

That's why the **header** uses `border-image` but the **hero/card images** use a grid-pile
`::after`/`::before` scrim.

---

## Gotchas & decision guide

**1. `border-image` vs grid-pile scrim**
Real element with a background → `border-image`. An actual `<img>` → grid-pile pseudo.

**2. An in-flow image inflates the grid row.**
A piled `<img>` is in normal flow, so its intrinsic aspect ratio drives the row height
(e.g. a 3:2 image became 960px tall instead of the intended 767). Fix: give the pile a
**fixed row** (`grid-template-rows: <height>`) so the row owns the height and the image
fills it.

**3. `height: 100%` on a piled `<img>` resolves to `auto`.**
Because the `<img>` has an `aspect-ratio` from its width/height attrs and the grid area
isn't always a "definite" height, `height: 100%` falls back to `auto` and the image
overflows. Fix: **don't set width/height** — use `place-self: stretch` + `min-width/height: 0`
and let the grid stretch the image to the cell, then `object-fit: cover` crops it.
(With this, `overflow: hidden` is unnecessary — nothing overflows.)

**4. Mixing positioned and non-positioned items in a pile.**
If one piled item is `position: relative` (e.g. to anchor something) and another isn't, the
positioned one paints on top regardless of DOM order — reintroducing the z-index problem.
Keep all piled items either all-positioned or all-static. The cleanest pile uses **no
positioning at all**.

**5. A single auto grid column blows out to the image's intrinsic width.**
`width: 100%` on an `<img>` in an `auto` column makes the column size to the image's natural
width and overflow the card. Fix: pin the column — `grid-template-columns: minmax(0, 1fr)`.

### Quick decision tree

```
Need to stack image + text?
├─ Yes → Grid pile (grid-template-areas: "pile", children in same cell)
│        Stacking = DOM order. No z-index.
│
Need a dark scrim/overlay?
├─ On a <div>/<header> with a background  → border-image: fill 0 <gradient>
└─ On an <img>                            → grid-pile pseudo (::after over / ::before under)
```
