# Contentful "pure-webhook" caching — portable strategy

**Goal:** stop a Next.js + Contentful site from burning CMS API calls on ordinary
traffic and crawlers. After this, Contentful is queried **only** at build time
and **once per cache entry when an editor publishes** — never on a timer, never
per visitor.

Self-contained export. Drop the three files into your project, wrap your
fetchers, add one webhook. Generic — no dependency on the source project.

---

## 1. Why your site burns calls (diagnosis)

I fingerprinted `https://bgmtl.com/` and found:

- **Next.js App Router** (RSC `__next_f` payload present) on **Netlify**.
- **Contentful** (`images.ctfassets.net`).
- Response header **`x-nextjs-stale-time: 300`** + `x-nextjs-prerender: 1`.

That `stale-time: 300` is the smoking gun: pages use **time-based ISR**
(`revalidate ≈ 300s`, or a fetch with `next: { revalidate }`). Every ~5 minutes
the *next* request — including Googlebot and every crawler — triggers a
background regeneration that **re-fetches Contentful**. High traffic × many
pages × every 5 min = a lot of calls, even when nothing changed.

**Confirm in your code** — search for any of these and note them:

```bash
grep -rnE "export const revalidate" app/        # route-segment ISR
grep -rnE "next:\s*\{\s*revalidate" .            # fetch-level ISR
grep -rnE "revalidate:\s*[0-9]" .                # unstable_cache / fetch options
# also: any Contentful fetch in a Client Component / useEffect (worst case —
# fetches on every page load, uncached)
```

Anything with a **numeric** `revalidate` is traffic-driven polling. The fix
replaces it with `revalidate: false` + an on-demand webhook.

---

## 2. The model

```
                         ┌─────────────────────────────────────────┐
ordinary traffic / bots ─┤ cache HIT → 0 Contentful calls           │
                         └─────────────────────────────────────────┘

editor clicks Publish ─▶ Contentful webhook ─▶ POST /api/revalidate
                                                    │ auth check
                                                    ▼
                                          revalidateTag("contentful")
                                                    ▼
                              next request refetches Contentful ONCE, recaches
```

- **`revalidate: false`** on every Contentful fetch → cached forever.
- **One tag** (`"contentful"`) on every entry → one webhook busts everything.
- **No time-based revalidation anywhere** → traffic/crawlers never trigger a
  refetch.
- Calls happen only at **build** and **once per entry after a publish**.

---

## 3. Files in this export

| File | Put it at | What it does |
|---|---|---|
| `lib/contentful-cache.ts` | `lib/` (or `src/lib/`) | `cachedContentful(fn, keyParts)` — wrap your fetchers |
| `lib/contentful-revalidation.ts` | next to the above | auth + `revalidateContentful()` |
| `app/api/revalidate/route.ts` | `app/api/revalidate/` | the webhook endpoint (Node runtime) |
| `.env.example` | merge into yours | `CONTENTFUL_REVALIDATE_SECRET` |

Adjust the `@/lib/...` import paths to match your alias / folder layout.

---

## 4. Integration steps

1. **Copy the files in.** Fix import paths.

2. **Pick the right `revalidateTag` line for your Next version.**
   Check `package.json` → `"next"`:
   - **Next 16+** → `revalidateTag(tag, "max")` (the default in the template).
   - **Next ≤15** → `revalidateTag(tag)` (swap the commented line in
     `contentful-revalidation.ts`).

3. **Wrap every Contentful fetcher** with `cachedContentful` (see the example
   in `lib/contentful-cache.ts`). Make `keyParts` unique per result.

4. **Remove time-based revalidation.** Delete `export const revalidate = N`
   from route segments that render CMS content, and drop `next: { revalidate:
   N }` from Contentful `fetch` calls (replace with the wrapper). If a page must
   stay dynamic for other reasons that's fine — the *data* cache is what spares
   the API calls.

5. **Set the env var.** `CONTENTFUL_REVALIDATE_SECRET` = a long random string,
   in your local `.env` AND in **Netlify → Site settings → Environment
   variables**. Redeploy (env changes only apply to a new build).

6. **Add the Contentful webhook.** Settings → Webhooks → Add:
   - **URL:** `POST https://bgmtl.com/api/revalidate`
   - **Triggers:** Entry → **Publish** and **Unpublish** (add Asset if assets
     render directly).
   - **Header:** `x-revalidate-secret: <the same secret>`
     (or `Authorization: Bearer <secret>`).

7. **Deploy, then verify** (section 6).

---

## 5. Netlify specifics (your host)

- On-demand `revalidateTag` / `revalidatePath` are backed by Netlify's **durable
  cache** (Netlify Blobs). Requires the **Netlify Next.js runtime v5+**
  (`@netlify/plugin-nextjs`). If you're on an older runtime, upgrade — fine-
  grained tag revalidation needs it.
- `export const runtime = "nodejs"` on the route makes it a Node Function (it
  must not be Edge — Edge can't update the cache manifest).
- After deploy, the `x-nextjs-stale-time` header should disappear (or stop
  driving refetches) on pages whose data you moved to `revalidate: false`.

---

## 6. Verify it worked

**Headers** — before: `x-nextjs-stale-time: 300`. After (on a now-static page):
```bash
curl -sI https://bgmtl.com/ | grep -i "x-nextjs\|cache-control\|age"
```

**The real proof — Contentful API usage:** open Contentful → your space →
**Settings → Usage** (or the org usage dashboard). API request volume should
drop sharply within a day. Browsing/crawling the live site should add ~0 calls;
you should see small bumps only around publishes and deploys.

**Webhook smoke test:**
```bash
curl -i -X POST https://bgmtl.com/api/revalidate \
  -H "x-revalidate-secret: <secret>"
# → 200 {"revalidated":true,...}   (401 = bad secret, 500 = secret not configured)
```
Then publish an entry → reload the page → the change appears. (`200` only means
Next accepted it; if content is stale, confirm the deploy includes the route and
hard-refresh — stale-while-revalidate timing.)

---

## 7. Guardrails — don't regress

1. **Never reintroduce a numeric `revalidate`** on CMS data. It silently
   re-enables traffic-driven polling — the exact thing this removes. If editors
   report staleness, fix **webhook delivery**, don't add a TTL.
2. **Keep the tag string identical** in `contentful-cache.ts` and
   `contentful-revalidation.ts` (`"contentful"`).
3. **Keep `export const runtime = "nodejs"`** on the route.
4. **Fail closed:** no secret → 500; bad secret → 401. Never revalidate
   unauthenticated.
5. **`keyParts` must be unique per result.** A shared key serves the wrong
   content from cache.
6. **No client-side Contentful fetching** for content that could be server-
   cached — a `useEffect` fetch runs on every page load and bypasses all of
   this.

---

## 8. Optional extensions (only if you need them)

- **Dev sees changes instantly:** already handled — `cachedContentful` skips the
  cache when `NODE_ENV === "development"`, so local `next dev` always fetches
  fresh.
- **Two domains, one deployment (e.g. prod + a staging mirror) that must
  refresh independently:** use *per-host* tags — tag entries
  `contentful-<env>` based on the request `Host`, and have the webhook bust only
  the staging tag so prod stays cached until redeploy. (More involved; ask if
  this applies — your site looks single-domain, so you don't need it.)
- **Contentful Preview / Draft Mode:** orthogonal to API-call reduction. If you
  want editors to preview drafts, add a `/api/preview` route that enables Draft
  Mode and have your fetchers bypass the cache when draft mode is on.

---

*Exported from the dream-boats / ziboat Next.js + Contentful setup. The source
project's fuller writeups: `docs/on-demand-revalidation.md` (model + guardrails)
and `docs/ssr-architecture.md`.*
