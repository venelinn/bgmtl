# Root layout, `<html lang>`, and why it lives under `[lang]`

**Created**: 2026-09-14

## The structure

```
app/[lang]/layout.tsx   ← THE ROOT LAYOUT: renders <html>/<body>, reads lang from params
app/ClientLayout.tsx    ← client boundary: providers, NextIntlClientProvider
app/not-found.tsx       ← global 404 for paths proxy.ts does not rewrite
app/robots.ts
app/sitemap.ts
```

**There is deliberately no `app/layout.tsx`.** Next permits the root layout to
live under a dynamic segment as long as that file does not exist.

## Why

`<html lang>` is how search engines and screen readers decide what language a
page is in, and it has to be correct **in the served markup** — crawlers read
HTML, they do not run your effects.

A root layout above `[lang]` has no route params. It therefore cannot know the
language, and the old one hardcoded:

```tsx
<html lang="en">   // app/layout.tsx — could not do better
```

…with a `useEffect` in `ClientLayout` patching
`document.documentElement.lang` after hydration. The result: **every page
declared itself English**, including Bulgarian — which is the *default* locale,
so the site's primary language was the one being mislabelled.

Moving the root layout into `app/[lang]/` makes `lang` an ordinary route param:

```tsx
export default async function LangLayout({ params }) {
  const { lang } = await params;
  return <html lang={lang}>…</html>;
}
```

Correct in the markup, no client correction, and nothing read per request.

Measured after the change — prerendered files *and* served responses:

```
/     lang="bg"      /en   lang="en"      /fr   lang="fr"
```

## What made it safe

- **`proxy.ts` rewrites locale-less paths** to `/{defaultLocale}` (`/bg`), so
  every request reaches the `[lang]` segment. That rewrite is load-bearing: the
  structure does not work without it.
- That same rewrite had already made **`app/page.tsx` unreachable** — it was a
  `redirect("/")` self-loop — so it was deleted with the move.
- **`app/not-found.tsx` needs no root layout.** Next prerenders it as
  `/_not-found` on its own; verified `○ /_not-found` in the build.

## Side effect: double the prerendered surface

`generateStaticParams` on the layout let routes without their own static params
prerender for the first time:

```
prerendered HTML   21 → 44
static routes      23 → 46
```

## Rules for editing `app/[lang]/layout.tsx`

1. **Never call `headers()` or `cookies()` here.** Any Dynamic API in a render
   tree opts that route into dynamic rendering — and in the *root* layout it
   opts in **every route in the app**. That would cost the site its
   `cache-status: "Netlify Durable"; hit` responses. A per-request read is
   exactly what this change removed.
   `draftMode()` is present and currently does not prevent caching here; do not
   add more on that basis without re-measuring.
2. **`import "@/styles/globals.scss"` must stay above every component import.**
   Global styles have to enter the CSS bundle before any CSS Module, or the
   cascade inverts and globals start overriding component styles. The old root
   layout had no component imports, so this ordering used to be accidental.
3. **The two pre-paint `<script>` tags must stay raw and inline.**
   `next/script` with `strategy="beforeInteractive"` looks correct but Next
   injects it through its own runtime queue (`self.__next_s.push(...)`), which
   runs during hydration — *after* first paint — reintroducing the theme and
   home-intro flashes the scripts exist to prevent.
4. **A soft navigation that changes `lang` re-renders `<html>`/`<head>`**, and
   React refuses to execute an inline `<script>` during a client render,
   logging *"Encountered a script tag while rendering React component"*. It is a
   dev-only warning and harmless — the scripts already ran. If it becomes
   noisy, the fix is to make internal links locale-prefixed (see below), not to
   move the scripts.

## Known remaining issue: locale-less default URLs

`utils/localization.ts` returns `""` as the prefix for the default locale, so
Bulgarian pages are unprefixed (`/about`) while English and French are
(`/en/about`). Two consequences:

- Each Bulgarian page has two working URLs (`/about` and `/bg/about`), relying
  on canonical tags to consolidate them.
- A client-side navigation to an unprefixed link changes the `[lang]` param —
  which triggers the warning in rule 4, and drops a French or English visitor
  back into Bulgarian, because `proxy.ts` only rewrites server-side.

Fixing it means always prefixing (including `bg`) and keeping the rewrite for
backwards compatibility. Not done here — it is a separate, wider change.

## Verifying after any change to this file

```bash
pnpm build
# lang correct in the PRERENDERED output, per locale
for loc in bg en fr; do
  grep -oE '<html lang="[a-z]{2}"' \
    "$(find .next/server/app/$loc -name '*.html' | head -1)"
done

npx next start -p 3070
curl -s http://localhost:3070/  | grep -oE '<html lang="[a-z]{2}"'   # bg
curl -s http://localhost:3070/fr | grep -oE '<html lang="[a-z]{2}"'  # fr

# scripts still inline (not queued through the Next runtime)
curl -s http://localhost:3070/ | grep -c '__next_s'   # expect 0 near the scripts
```

And on production, confirm caching did not regress:

```bash
curl -sI https://bgmtl.com/ | grep -i cache-status
# want: "Netlify Durable"; hit … "Next.js"; hit
```

## Related

- [i18n-locales.md](./i18n-locales.md) — adding a UI locale (three files)
- [metadata-and-ssr.md](./metadata-and-ssr.md) — metadata, OG images
- [netlify-cost-reduction.md](./netlify-cost-reduction.md) — build cache, images
- `proxy.ts` — locale rewrite, spam 410s, redirect handling
