# Contentful Caching Strategy — "Pure-Webhook" Model

**Created**: 2026-06-06
**Source of truth**: the code, not prose. Key files:
`utils/contentful-cache.ts`, `utils/content.ts`, `utils/revalidation.ts`,
`app/api/revalidate/route.ts`. This doc is a portable export of that strategy
for dropping into another Next.js App Router + Contentful project (e.g.
`searchparty`).

> ⚠️ The older `docs/cms-page-rendering.md` / `docs/on-demand-revalidation.md`
> describe an earlier **time-based ISR** design (`export const revalidate = 60`,
> `revalidatePath`-only). That is superseded. The current code uses the
> pure-webhook model below: **no numeric `revalidate` anywhere**, tag-based
> invalidation as the primary lever.

---

## The idea in one paragraph

Wrap every Contentful read in a cache that **never time-expires**
(`revalidate: false`) and tag all of them with one shared tag (`"contentful"`).
Ordinary visitors and crawlers are served from cache and spend **zero**
Contentful API calls. The CMS is queried only (a) at build time and (b) **once
per cache entry after an editor publishes**, when a Contentful webhook calls
`revalidateTag("contentful", "max")` and busts every entry at once. Preview /
draft reads bypass the cache entirely so editors always see fresh drafts.

```
Visitor / crawler traffic ───▶ Next data cache (revalidate:false) ───▶ HTML
                                      ▲ zero Contentful calls
                                      │
Editor clicks Publish                 │ (only refetch trigger)
   │ Contentful webhook (shared secret header)
   ▼
POST /api/revalidate ─ auth ─▶ revalidateTag("contentful","max")  ← busts ALL entries
                              + revalidatePath(`/${lang}`,"layout") per locale
                              + revalidatePath("/sitemap.xml")
```

### Why this over time-based ISR

Time-based ISR forces a trade-off: a short `revalidate` lets crawlers
(Googlebot etc.) trigger constant CMS refetches and burn the Contentful API
quota; a long `revalidate` makes editors wait to see published changes. The
pure-webhook model removes the trade-off — content is cached **indefinitely**
(cheapest possible read path) yet refreshes **immediately** on publish
(freshest possible editor experience). No timer, no per-visitor cost.

---

## The three pieces

### 1. The cache wrapper (`utils/contentful-cache.ts`)

The whole strategy lives in one small function. Every Contentful fetch goes
through it.

```ts
import { unstable_cache } from "next/cache";
import { IS_DEV } from "./common";

/**
 * Single shared tag. Every Contentful-backed cache entry carries it, so ONE
 * webhook call — revalidateTag(CONTENTFUL_TAG, "max") — invalidates them all.
 * Keep this string identical here and in utils/revalidation.ts.
 */
export const CONTENTFUL_TAG = "contentful";

// In-memory memo for `next dev` only. Keyed by joined keyParts; holds the
// in-flight/resolved promise so concurrent callers dedupe too. Cleared on a
// full process restart (unlike the on-disk data cache, which survives it).
const devMemo = new Map<string, Promise<unknown>>();

export function cachedContentful<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  opts?: { bypass?: boolean },
): Promise<T> {
  // Preview/draft must always read fresh — never cache.
  if (opts?.bypass) return fn();

  if (IS_DEV) {
    // Don't use unstable_cache in dev: it persists to .next/cache on disk and
    // would survive restarts, so freshly-published content never shows up.
    // Memoize in-process instead — repeated requests/hot reloads cost ZERO
    // Contentful calls, and a server restart clears the memo (that's how you
    // pick up newly published content while developing).
    const key = keyParts.join("::");
    const hit = devMemo.get(key) as Promise<T> | undefined;
    if (hit) return hit;

    const pending = fn();
    devMemo.set(key, pending);
    pending.catch(() => devMemo.delete(key)); // don't poison the memo on error
    return pending;
  }

  return unstable_cache(fn, keyParts, {
    revalidate: false, // never time-expire; only the webhook tag-bust refetches
    tags: [CONTENTFUL_TAG],
  })();
}
```

**Contract — read this before using it:**

- `keyParts` **MUST** uniquely identify the result. Include **every** argument
  that changes it: content type, locale, slug, and serialized query params. Two
  different inputs sharing a key serve the wrong content from cache.
- `revalidate: false` is load-bearing. Do **not** add a number. A number
  re-enables traffic-driven polling and defeats the entire model.
- `opts.bypass` is for preview/draft only.

### 2. Routing reads through the wrapper (`utils/content.ts`)

There are two Contentful clients — delivery (published, `cdn.contentful.com`)
and preview (drafts, `preview.contentful.com`) — and a single choke point,
`getEntries`, that every public fetch funnels through. That choke point is
where caching is applied, so you wrap once and the whole app inherits it.

```ts
const deliveryClient = createClient({
  accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN || "",
  space: process.env.CONTENTFUL_SPACE_ID || "",
  environment: process.env.CONTENTFUL_ENVIRONMENT || "master",
  host: "cdn.contentful.com",
});

const previewClient = process.env.CONTENTFUL_PREVIEW_TOKEN
  ? createClient({ /* …same, host: preview.contentful.com */ })
  : null;

async function getEntries(content_type, queryParams, options) {
  const client = options?.preview && previewClient ? previewClient : deliveryClient;
  const params = { ...queryParams, locale: contentfulLocale, include: 10 };
  const preview = options?.preview ?? false;

  // Cache the delivery fetch indefinitely under the shared "contentful" tag.
  // Ordinary traffic hits this cache (zero Contentful calls); the publish
  // webhook is the only thing that refetches. Preview bypasses the cache.
  return cachedContentful(
    () => client.getEntries({ content_type, ...params }),
    [content_type, JSON.stringify(params), String(preview)], // <- unique key
    { bypass: preview },
  );
}
```

Note the `keyParts`: `[content_type, JSON.stringify(params), String(preview)]`.
`params` already includes `locale`, slug filters, limits, etc., so the
serialized params string makes the key unique per distinct query.

**Two layers of dedupe stack on top of the data cache:**

- **React `cache()`** wraps per-request entry points (e.g.
  `getPageBySlug = cache(fetchPageBySlug)`, and the BG-headings map). It
  collapses the multiple calls a single request makes — `generateMetadata` +
  the page body, or the nav + page sharing one all-pages fetch — into one. This
  matters most in **preview**, where the data cache is bypassed and both calls
  would otherwise hit Contentful.
- **The "fetch-all then resolve in memory" pattern** (`getPages` →
  `fetchPageBySlug`): instead of one cached all-pages query **plus** N per-slug
  queries, the page body reuses the already-cached `getPages(locale)` result
  and finds its slug in memory. The nav (layout) and every page body share
  **one** Contentful call per publish cycle. A targeted single-page fetch
  remains as a not-found fallback for nested/edge-case slugs.

### 3. The webhook endpoint (`utils/revalidation.ts` + route)

`utils/revalidation.ts` — logic, kept separate from the route so it's
unit-testable and reusable:

```ts
import { revalidatePath, revalidateTag } from "next/cache";
import { CONTENTFUL_TAG } from "@/utils/contentful-cache";
import { localization } from "@/utils/localization";

export function isRevalidationConfigured(): boolean {
  return Boolean(process.env.CONTENTFUL_REVALIDATE_SECRET);
}

/** Accept `Authorization: Bearer <secret>` or `x-revalidate-secret: <secret>`. */
export function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CONTENTFUL_REVALIDATE_SECRET;
  if (!secret) return false; // fail closed when unset
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  const headerSecret = req.headers.get("x-revalidate-secret")?.trim();
  return bearer === secret || headerSecret === secret;
}

export function revalidateAllLocales(): string[] {
  const paths: string[] = [];

  // PRIMARY lever: bust the Contentful data cache. Every cached fetch shares
  // this tag, so this one call invalidates all of them. The "max" profile arg
  // is REQUIRED in Next 16+ (a bare one-arg call is deprecated).
  revalidateTag(CONTENTFUL_TAG, "max");
  paths.push(`tag:${CONTENTFUL_TAG}`);

  // Safety net: also clear the rendered localized HTML subtrees. "layout" (not
  // "page") so a stale homepage/listings under app/[lang]/layout.tsx and any
  // host durable cache (Netlify) are refreshed too.
  for (const lang of localization.locales) {
    revalidatePath(`/${lang}`, "layout");
    paths.push(`/${lang} (layout)`);
  }

  // Sitemap is static (no time-based revalidate); its data cache is busted by
  // the tag above, but the rendered XML needs an explicit path revalidation.
  revalidatePath("/sitemap.xml");
  paths.push("/sitemap.xml");

  return paths;
}
```

`app/api/revalidate/route.ts` — thin orchestration: configured → authorized →
revalidate → respond.

```ts
import type { NextRequest } from "next/server";
import { isAuthorized, isRevalidationConfigured, revalidateAllLocales } from "@/utils/revalidation";

/** Node runtime: revalidation must run where Next can update the ISR manifest (not Edge). */
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isRevalidationConfigured()) {
    return Response.json({ error: "Revalidation is not configured" }, { status: 500 });
  }
  if (!isAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const paths = revalidateAllLocales();
    return Response.json({ revalidated: true, paths });
  } catch (err) {
    console.error("revalidate error:", err);
    return Response.json({ error: "Revalidation failed" }, { status: 500 });
  }
}
```

---

## Preview / draft mode

A separate route (`app/api/preview/route.js`) validates a secret, enables Next's
`draftMode()`, and redirects to the entry being previewed. From then on, pages
read `const { isEnabled } = await draftMode()` and thread `isEnabled` down as the
`preview` flag, which becomes `cachedContentful(..., { bypass: true })`. So:

- **Published traffic** → delivery client, cached forever, busted only on publish.
- **Preview traffic** → preview client, cache bypassed, always fresh drafts.

`draftMode()` reading a cookie makes those routes dynamic for that visitor only;
it does not add a numeric `revalidate` and does not change cost for normal
traffic.

---

## Environment

```bash
CONTENTFUL_SPACE_ID=
CONTENTFUL_ENVIRONMENT=master
CONTENTFUL_DELIVERY_TOKEN=
CONTENTFUL_PREVIEW_TOKEN=
CONTENTFUL_PREVIEW_SECRET=
CONTENTFUL_HOST=                      # preview.contentful.com (optional override)
# Shared secret for POST /api/revalidate (Contentful webhook).
# Send as Authorization: Bearer <value> or x-revalidate-secret: <value>.
CONTENTFUL_REVALIDATE_SECRET=
```

Set the same `CONTENTFUL_REVALIDATE_SECRET` in the host (Netlify/Vercel) env.
Never commit the real value.

## Contentful webhook

Settings → Webhooks → add one:

- **URL**: `POST https://<your-domain>/api/revalidate`
- **Triggers**: Entry → **Publish** and **Unpublish** (add Asset → Publish/
  Unpublish if assets render directly).
- **Header**: `x-revalidate-secret: <the same secret>` (or
  `Authorization: Bearer <secret>`).

---

## Guardrails — do not regress

1. **No numeric `revalidate` on CMS routes or the sitemap.** It re-enables
   traffic-driven polling and burns the Contentful quota — the exact thing this
   model exists to avoid. Every CMS route file carries a comment saying so.
2. **`revalidateTag(CONTENTFUL_TAG, "max")` is the primary lever.** The
   per-locale `revalidatePath(..., "layout")` and the sitemap path are a safety
   net for rendered HTML / host durable caches, not the main mechanism.
3. **Use `"layout"`, not `"page"`, in `revalidatePath`.** `"page"` alone can
   leave a stale homepage/listings rendered by `app/[lang]/layout.tsx`.
4. **Keep `export const runtime = "nodejs"` on the route.** It's a route-level
   export (can't move into the util). ISR manifest updates need Node, not Edge.
5. **Fail closed.** No secret configured → `500`; bad/missing secret → `401`.
   Never revalidate on an unauthenticated request.
6. **`keyParts` must be fully unique.** Include every argument that changes the
   result. A collision serves wrong content.
7. **Don't use `unstable_cache` in `next dev`.** It persists to `.next/cache` on
   disk and would survive restarts, hiding freshly published content. The
   in-process `devMemo` is intentional — restart the dev server to pick up
   newly published content.
8. **Deploy before wiring the webhook.** The route + env var must exist in
   production first. A `200 { revalidated: true }` only means Next accepted the
   request; if content still looks old, confirm the deploy includes the handler,
   then hard-refresh (stale-while-revalidate timing).

---

## Porting to `searchparty` — checklist

1. Copy `utils/contentful-cache.ts` verbatim (it has no project-specific deps
   beyond `IS_DEV = process.env.NODE_ENV === "development"`).
2. Create the delivery + preview clients and a single `getEntries` choke point;
   route **every** public Contentful read through `cachedContentful`. Wrap any
   read that doesn't go through `getEntries` (single-entry-by-id, etc.) directly
   — see `getContentItem` for the pattern.
3. Make `keyParts` unique per query (content type + serialized params +
   preview flag).
4. Add `utils/revalidation.ts` + `app/api/revalidate/route.ts`.
   - **Single-locale site?** Replace the `localization.locales` loop with one
     `revalidatePath("/", "layout")`.
   - **No sitemap yet?** Drop the `revalidatePath("/sitemap.xml")` line.
5. Wrap per-request entry points in React `cache()` to dedupe
   `generateMetadata` + body (and any layout/page shared fetch).
6. Add the env vars and the Contentful Publish/Unpublish webhook.
7. Thread `draftMode()` → `preview` → `{ bypass: preview }` for preview support
   (optional but recommended).
8. Grep the new repo to confirm **no** `export const revalidate = <number>` on
   any CMS-backed route.

The auth shape is CMS-agnostic: any provider that can send a header on publish
works, so this same recipe ports to non-Contentful CMSes by swapping only the
client and `getEntries`.
