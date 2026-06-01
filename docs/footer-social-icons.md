# Footer Social Icons

**Created**: 2026-02-17

## Related

- Footer component: `components/Footer/Footer.tsx`
- Menu extraction: `utils/menuHelpers.ts` — `extractMenuColumns()`
- Link helpers: `utils/linkHelpers.ts` — `contentfulItemToLink()`, `inferIconFromUrl()`

## Overview

Footer menu columns with social-style titles (e.g. "Connect with us", "Follow us") are rendered as icon-only links using the `Social` component instead of the standard text link list.

## When the Social Column Renders

A column is treated as a social column when:

1. **Title matches** — Column title (case-insensitive) is one of:
   - `social`
   - Contains `social` (e.g. "Social Media")
   - `follow us`
   - `connect with us`

2. **Has links** — The column has at least one link.

## Icon Resolution

Icons are resolved in this order:

1. **Contentful `iconName`** — If the link has `iconName` (or `icon`) set in Contentful, that value is used.
2. **URL inference** — If no icon is set, the icon is inferred from the link URL:
   - `facebook.com` → Facebook
   - `instagram.com` → Instagram
   - `youtube.com` / `youtu.be` → Youtube
   - `linkedin.com` → Linkedin
   - `twitter.com` / `x.com` → Twitter
   - `tiktok.com` → TikTok
   - `pinterest.com` → Pinterest
3. **Fallback** — `Link` (generic lucide icon) when neither applies.

## Contentful Setup

### Menu column

- Create a menu column with title **"Connect with us"**, **"Follow us"**, or **"Social"**.
- Add link items as `menuItems` (type `link`).

### Link items

- **Optional**: Set `iconName` on each link (e.g. `Instagram`, `Facebook`) for explicit control.
- **Otherwise**: Icons are inferred from the URL — ensure links point to known social domains.

## API

### `inferIconFromUrl(url: string): string | null`

In `utils/linkHelpers.ts`. Returns a lucide-compatible icon name based on URL patterns.

### Components

- **Footer** — Detects social columns and renders `Social` for them.
- **Social** — Renders icon-only links with `Icon` from lucide-react.

## Files

| File | Purpose |
|------|---------|
| `components/Footer/Footer.tsx` | Social column detection, Social component wiring |
| `components/Footer/Footer.module.scss` | `.footer__column__social` styles |
| `components/Social/Social.tsx` | Icon-only link list |
| `utils/linkHelpers.ts` | `contentfulItemToLink()`, `inferIconFromUrl()` |
| `utils/menuHelpers.ts` | `extractMenuColumns()` — builds columns from Contentful menu |
