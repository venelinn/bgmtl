# Navigation Links — Header & Footer

**Created**: 2026-02-25

How menu links flow from Contentful to the rendered Header and Footer. This guide covers the full pipeline so you can replicate it in another project.

## Architecture Overview

```
Contentful CMS
    │
    ▼
┌─────────────────────────────────┐
│ getHeader() / getFooter()       │  ← utils/content.ts (server)
│ Returns { menuLinks, logo, … }  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ extractMenuColumns(             │  ← utils/menuHelpers.ts
│   menuLinks, locale, mode       │
│ )                               │
│ Returns MenuColumn[]            │
└────────────┬────────────────────┘
             │
     ┌───────┴────────┐
     ▼                ▼
  Header           Footer
  (NavigationInner)  (Footer)
```

## Files Involved

| File | Role |
|------|------|
| `utils/localization.ts` | Locale config: `locales`, `defaultLocale`, `getContentfulLocale()` |
| `utils/linkHelpers.ts` | `LinkItem` type, `contentfulItemToLink()`, `buildPageUrl()`, `inferIconFromUrl()` |
| `utils/menuHelpers.ts` | `MenuColumn` type, `extractMenuColumns()`, `processMenu()`, `processMenuItem()` |
| `components/Navigation/Navigation.tsx` | Server component wrapper |
| `components/Navigation/NavigationInner.tsx` | Client component, renders header links |
| `components/Footer/Footer.tsx` | Client component, renders footer columns |

---

## Step 1: Contentful Data Shape

The CMS stores menus in **Header** and **Footer** content types. Both have a `menuLinks` field — an array of menu containers.

### Contentful Content Types

```
header / footer
  └── menuLinks: Reference[] (to headerMenu entries)

headerMenu
  ├── title: String          ("About", "Social")
  ├── displayTitle: String   (localized display name)
  └── menuItems: Reference[] (to link or page entries)

link
  ├── name: String           ("Facebook", "Contact Us")
  ├── url: String            ("https://facebook.com/...")
  ├── target: String         ("_blank" or undefined)
  └── iconName: String       ("Facebook" — Lucide icon name)

page
  ├── slug: String           ("mission")
  ├── parent: String         ("about-us")
  └── pageName: Reference    (to heading entry with .heading field)
```

### Example Raw Data

```json
{
  "menuLinks": [
    {
      "id": "abc",
      "type": "headerMenu",
      "title": "About",
      "displayTitle": "About Us",
      "menuItems": [
        { "id": "1", "type": "page", "slug": "mission", "parent": "about-us" },
        { "id": "2", "type": "page", "slug": "history", "parent": "about-us" },
        { "id": "3", "type": "link", "name": "Facebook", "url": "https://facebook.com/..." }
      ]
    }
  ]
}
```

---

## Step 2: Link Normalization (`linkHelpers.ts`)

### `LinkItem` — The Normalized Shape

Every menu item is converted to this shape, regardless of whether it's an external link or internal page:

```typescript
type LinkItem = {
  id: string;
  url: string;        // "/about-us/mission" or "https://..."
  title: string;       // Display text
  name?: string;       // Alias for title
  target?: string;     // "_blank" for external
  icon: string | null; // Lucide icon name
  highlight?: boolean; // Visual emphasis flag
};
```

### `contentfulItemToLink(item, locale)`

Converts a raw Contentful item to a `LinkItem`:

- **`type: "link"`** → Uses `item.url` directly. Sets `icon` from `item.iconName` or `inferIconFromUrl(url)`.
- **`type: "page"`** → Builds URL from `parent` + `slug` via `buildPageUrl()`. Gets title from `pageName.heading`.

### `buildPageUrl(parent, slug, locale)`

Constructs internal URLs with locale prefixing:

```
buildPageUrl("about-us", "mission", "bg")  → "/about-us/mission"      (default locale, no prefix)
buildPageUrl("about-us", "mission", "en")  → "/en/about-us/mission"   (non-default, gets prefix)
buildPageUrl(undefined, undefined, "en")   → "#"                      (no slug at all)
```

Only the **non-default locale** gets a URL prefix. The default locale (`"bg"`) has clean URLs.

### `inferIconFromUrl(url)`

Fallback icon detection for social links when `iconName` isn't set in Contentful:

```
"facebook.com"   → "Facebook"
"instagram.com"  → "Instagram"
"youtube.com"    → "Youtube"
"linkedin.com"   → "Linkedin"
"twitter.com"    → "Twitter"
```

---

## Step 3: Menu Processing (`menuHelpers.ts`)

### `MenuColumn` — The Rendering Shape

```typescript
type MenuColumn = {
  id: string;
  title: string;       // Column heading ("About Us", "Follow Us")
  titleID?: string;     // Raw title for detection (e.g. "Social")
  links: LinkItem[];    // Items within the column
};
```

### `extractMenuColumns(menuLinks, locale, mode)`

Main entry point. Iterates through all menu containers and returns `MenuColumn[]`.

**Two modes** produce different column structures from the same data:

### Header Mode

Each container is **expanded** — its items become individual columns or grouped sections:

```
Container: { title: "Navigation", menuItems: [Home, About{Mission,History}, Sponsors] }
                                         │
                                         ▼
           ┌─────────────────────────────────────────────────┐
           │ Column 1: { title: "Home", links: [Home] }     │  ← single link = plain link
           │ Column 2: { title: "About", links: [M, H] }    │  ← nested items = dropdown group
           │ Column 3: { title: "Sponsors", links: [Sp] }   │  ← single link = plain link
           └─────────────────────────────────────────────────┘
```

**Rendering rule**: If `column.links.length === 1`, render as a plain `<Link>`. If multiple links, render as a titled dropdown/group.

### Footer Mode

Each container becomes **one column** — the container title is the heading, its items are the links:

```
Container: { title: "About", displayTitle: "About Us", menuItems: [Mission, History, Charter] }
                                         │
                                         ▼
           ┌─────────────────────────────────────────────────┐
           │ Column: { title: "About Us", links: [M, H, C] }│
           └─────────────────────────────────────────────────┘
```

### Processing Pipeline

```
extractMenuColumns(menuLinks, locale, mode)
    │
    ├── for each menuLink container:
    │   └── processMenu(container, locale, mode)
    │       │
    │       ├── Footer mode: map all container.menuItems → links, return one column
    │       │
    │       └── Header mode: for each item in container.menuItems:
    │           └── processMenuItem(item, locale, "header")
    │               │
    │               ├── Has nested menuItems? → recurse, return column with title + links
    │               └── Leaf item? → contentfulItemToLink() → column with single link
    │
    └── return all columns[]
```

---

## Step 4: Rendering

### Header (`NavigationInner.tsx`)

```typescript
const menuColumns = extractMenuColumns(menuLinks, pageLocale, "header");
```

```
menuColumns.map(column => {
    if column.links.length === 1 → plain <Link>
    if column.links.length > 1  → <span>{title}</span> + <ul> dropdown
})
```

Active link detection uses `usePathname()`:

```typescript
const isActive = link.url === "/" ? pathname === "/" : pathname?.startsWith(link.url);
```

### Footer (`Footer.tsx`)

```typescript
const menuColumns = extractMenuColumns(menuLinks, pageLocale, "footer");
```

```
menuColumns.map(column => {
    if isSocialColumn(column.title) → <Social items={...} />  (icon-only links)
    else                            → <h3>{title}</h3> + <ul> text links
})
```

Social column detection checks `column.titleID` for "social", "follow us", or "connect with us".

---

## How to Replicate

### Minimum files needed:

1. **`linkHelpers.ts`** — Copy `LinkItem`, `contentfulItemToLink()`, `buildPageUrl()`
2. **`menuHelpers.ts`** — Copy `MenuColumn`, `extractMenuColumns()`
3. **`localization.ts`** — Adapt `locales`, `defaultLocale` to your project

### Adapt for your CMS:

- If not using Contentful, rewrite `contentfulItemToLink()` to convert your CMS's item shape to `LinkItem`
- The `type` field (`"link"` vs `"page"`) is Contentful-specific — map your CMS's equivalent
- The `menuItems` nesting pattern may differ — adjust `processMenu()` accordingly

### Key patterns:

- **Normalize early**: Convert CMS data to `LinkItem` at the utility layer, not in components
- **Mode parameter**: Use the same data source for header and footer with different processing modes
- **Locale-aware URLs**: Only prefix non-default locales in `buildPageUrl()`
- **Active state**: Compare `usePathname()` against `link.url` with `startsWith` for nested routes
