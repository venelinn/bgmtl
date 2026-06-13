# Adding / enabling a UI locale

The site supports `bg`, `en`, `fr` (config in [`utils/localization.ts`](../utils/localization.ts)):

```ts
locales: ["bg", "en", "fr"],
contentfulLocales: ["bg-BG", "en-CA", "fr-CA"],
defaultLocale: "bg",   // served at the root; others are path-prefixed (/fr/...)
```

Enabling a locale (or adding a new one) means touching **three** files. Each one
**fails silently** by falling back to another locale instead of erroring, so a
missing entry looks like "translations aren't working".

| # | File | What to add | Symptom if missing |
|---|------|-------------|--------------------|
| 1 | [`utils/getMessages.ts`](../utils/getMessages.ts) | `import` the `messages/<locale>.json`, add it to the `messages` map and the `Locale` type | UI strings fall back to `messages.bg` (e.g. French showed Bulgarian text) |
| 2 | [`utils/DateFormat.js`](../utils/DateFormat.js) | Add the date-fns locale to the `locales` map (e.g. `frCA`) | Dates fall back to `enCA` ("20 June 2026" instead of "20 juin 2026") |
| 3 | [`components/Calendar/EventCalendar.tsx`](../components/Calendar/EventCalendar.tsx) | Same date-fns `locales` map (weekday/month names) | Calendar month/day names stay English |

Notes:
- date-fns ships Canadian variants: `enCA`, `frCA` (import from `date-fns/locale`).
- **Message-key parity matters**: a key present in `bg.json` but missing in
  `<locale>.json` renders nothing for that string. Quick check (flattens nested
  keys like `Gallery.viewAll`):
  ```bash
  node -e 'const F=(o,p="")=>Object.entries(o).flatMap(([k,v])=>v&&typeof v=="object"&&!Array.isArray(v)?F(v,p+k+"."):[p+k]);const g=x=>new Set(F(require(`./messages/${x}.json`)));const bg=g("bg"),fr=g("fr");console.log("missing in fr:",[...bg].filter(k=>!fr.has(k)))'
  ```
- Translations for Contentful content (event/news titles, etc.) are a separate
  concern — see [facebook-events-scraper.md](facebook-events-scraper.md) (DeepL).
