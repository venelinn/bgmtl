# On-Demand Revalidation (Contentful → Next.js App Router)

**Created**: 2026-05-15

A portable recipe for refreshing an ISR Next.js site the moment CMS content
changes, instead of relying only on time-based `revalidate` or a full redeploy.
Written for this repo but kept generic enough to lift into another Next.js +
Contentful project.

## Related

- Route handler: `app/api/revalidate/route.ts`
- Logic module: `utils/revalidation.ts`
- Locale list: `utils/localization.ts`
- Env template: `.env.example` — `CONTENTFUL_REVALIDATE_SECRET`

## Why

Time-based ISR forces a trade-off: short `revalidate` means crawlers
(Googlebot etc.) trigger constant CMS refetches and burn the Contentful API
quota; long `revalidate` means editors wait hours to see published changes. A
deploy refreshes everything but rebuilds many paths against the CMS.

On-demand revalidation breaks the trade-off: keep a **long** baseline
`revalidate` (low crawler-driven traffic) and add a **targeted** webhook that
invalidates only what changed, only when an editor publishes.

## How It Works

```
Contentful entry Publish/Unpublish
        │  (webhook, with shared-secret header)
        ▼
POST /api/revalidate   ── auth check ──▶ revalidatePath(`/${lang}`, "layout")
        │                                  for every locale
        ▼
Next.js marks the localized subtree stale → next request regenerates it
```

### 1. The logic module (`utils/revalidation.ts`)

Kept separate from the route so it is unit-testable and reusable (e.g. a
future per-slug variant).

```ts
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { localization } from "@/utils/localization";

/** Revalidation is only usable when the shared secret is configured. */
export function isRevalidationConfigured(): boolean {
  return Boolean(process.env.CONTENTFUL_REVALIDATE_SECRET);
}

/** Accept `Authorization: Bearer <secret>` or `x-revalidate-secret: <secret>`. */
export function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CONTENTFUL_REVALIDATE_SECRET;
  if (!secret) return false; // fail closed when unset

  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : null;
  const headerSecret = req.headers.get("x-revalidate-secret")?.trim();

  return bearer === secret || headerSecret === secret;
}

/** Invalidate the localized subtree for every locale; return the paths hit. */
export function revalidateAllLocales(): string[] {
  const paths: string[] = [];
  for (const lang of localization.locales) {
    revalidatePath(`/${lang}`, "layout");
    paths.push(`/${lang} (layout)`);
  }
  return paths;
}
```

### 2. The route handler (`app/api/revalidate/route.ts`)

Thin orchestration only: configured → authorized → revalidate → respond.

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

### 3. Environment

```bash
# .env.example — set the same value in the host (Netlify/Vercel) env, never commit the real one
CONTENTFUL_REVALIDATE_SECRET=
```

### 4. Contentful webhook

Settings → Webhooks → add one:

- **URL**: `POST https://<your-domain>/api/revalidate`
- **Triggers**: Entry → **Publish** and **Unpublish** (add Asset if assets render directly)
- **Header**: `x-revalidate-secret: <the same secret>` (or `Authorization: Bearer <secret>`)

## Guardrails — do not regress

1. **Use `revalidatePath(path, "layout")`, not `"page"`.** `"page"` alone can
   leave a stale homepage / listings rendered by `app/[lang]/layout.tsx` and
   any host durable cache (Netlify). `"layout"` refreshes the whole subtree.
2. **Keep `export const runtime = "nodejs"` on the route.** It is a
   route-level export and cannot move into the util. ISR manifest updates need
   Node, not Edge.
3. **Fail closed.** No secret configured → `500`; bad/missing secret → `401`.
   Never revalidate on an unauthenticated request.
4. **This does not replace a long baseline `revalidate`.** It adds targeted
   refreshes; it does not justify lowering global `revalidate` to minutes.
5. **Deploy first.** The route and env var must exist in production before the
   webhook does anything useful. A `200 { revalidated: true }` only means Next
   accepted the request — if content is still old, confirm the deploy includes
   the handler, then hard-refresh (stale-while-revalidate timing).

## Adapting to another project

- Replace the `localization.locales` loop with that project's locales — or, if
  the site is single-locale, just `revalidatePath("/", "layout")`.
- Rename `CONTENTFUL_REVALIDATE_SECRET` to whatever the CMS is (the auth shape
  is CMS-agnostic; any provider that can send a header on publish works).
- Per-slug variant: parse the webhook body and call
  `revalidatePath(`/${lang}/${slug}`)` for just the affected entry when the
  full layout sweep is too heavy.
