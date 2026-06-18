# Reducing Netlify credit usage (Next.js on `@netlify/plugin-nextjs`)

Portable playbook for cutting Netlify's credit-based billing on a Next.js site.
Written from the bgmtl optimization (2026-06-17) so it can be reused in other
projects. The four levers below are ordered by typical impact.

## How to read your bill

Netlify's "Credit usage breakdown" splits into a few lines. On bgmtl a billing
period looked like:

| Line | Credits | What drives it |
|---|---|---|
| **Production deploys** | 180 (12 deploys, ~15 each) | Build minutes per deploy |
| **Bandwidth** | 100.6 | Bytes served — usually image-optimizer output |
| **Web requests** | 17.4 (86,883 reqs) | Edge/function invocations (incl. middleware) |
| **Compute** | 13.7 | Site/DB compute |

Deploys + bandwidth were ~90% of the total. Attack those first.

---

## Lever 1 — Stop nuking Netlify's build cache (biggest deploy win)

**Symptom:** every deploy costs the same high number of build minutes, even for
a one-line change. Netlify restores `.next/cache` (SWC/webpack compile cache +
Next data cache) into the build container **before** running the build command.
If your build command deletes it, every build compiles from scratch.

**The trap:** a `build` script like

```jsonc
"clean": "rm -rf .next",
"build": "pnpm run clean && next build",   // <-- clean wipes the restored cache
```

with `netlify.toml` pointing at `pnpm build`. The `rm -rf .next` runs first and
deletes the cache Netlify just restored.

**Fix:** give CI a build command that does *not* clean. Keep `clean` for local use.

```jsonc
// package.json
"build":    "pnpm run clean && pnpm run build-dictionary && next build",
"build:ci": "pnpm run build-dictionary && next build",
```

```toml
# netlify.toml
[build]
  command = "pnpm build:ci"
```

Each Netlify container is fresh per run, so a CI build doesn't need to clean —
only local incremental builds risk stale artifacts.

> Do **not** set `publish = ".next"` in `netlify.toml` — let the Next.js plugin
> own the output directory.

## Lever 2 — Serve images from their source CDN, not Netlify's optimizer

**Symptom:** high Bandwidth (and some Compute) while your own `public/` assets
are tiny. Cause: with the default loader, **every `next/image` is fetched,
optimized, and served by Netlify's image CDN** — billed bandwidth + compute.

**Fix:** if your images already live on a CDN with on-the-fly transforms
(Cloudinary, Contentful Images API, imgix, …), add a **custom `next/image`
loader** so the browser fetches directly from that CDN and Netlify never touches
the bytes. Unknown hosts pass through untouched (served from origin, still off
Netlify).

```ts
// utils/imageLoader.ts  — plain, dependency-free, runs on server + client
type LoaderArgs = { src: string; width: number; quality?: number };

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  const q = quality || 75;
  const normalized = src.startsWith("//") ? `https:${src}` : src;

  // Contentful Images API
  if (normalized.includes("ctfassets.net")) {
    const [base, existing] = normalized.split("?");
    const params = new URLSearchParams(existing);
    params.set("w", String(width));
    params.set("q", String(q));
    params.set("fm", "webp");
    return `${base}?${params.toString()}`;
  }

  // Cloudinary — inject a transform after /upload/ (transforms chain, so this
  // stays correct even if the URL already carries one).
  if (normalized.includes("res.cloudinary.com") && normalized.includes("/upload/")) {
    return normalized.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
  }

  return normalized; // unknown host → origin
}
```

```js
// next.config.js
images: {
  loader: "custom",
  loaderFile: "./utils/imageLoader.ts",
  remotePatterns: [/* kept as documentation; not enforced with a custom loader */],
}
```

**Verify after `next build`:** the built HTML should contain **zero
`/_next/image`** references, and `<img>` srcsets should point at the source CDN
with a width transform:

```bash
grep -rho '/_next/image' .next/server/app | wc -l         # expect 0
grep -rhoE 'f_auto,q_auto,w_[0-9]+' .next/server/app | sort -u   # loader output
```

## Lever 3 — Add `sizes` so phones don't download desktop-sized images

Compounds Lever 2. Without a `sizes` attribute, `next/image` requests variants
sized to the intrinsic `width` prop (often huge). Add a `sizes` matching the
real layout so the srcset offers small widths on small screens:

- Full-bleed hero / background → `sizes="100vw"`
- Half-width content image → `sizes="(max-width: 48rem) 100vw, 50vw"`
- Card cover in a grid → `sizes="(max-width: 48rem) 100vw, 400px"`

`sizes` is purely additive — it never breaks layout, only changes which srcset
entry the browser picks. Audit the large-image call sites; skip tiny fixed
logos/avatars.

## Lever 4 — Trim the middleware matcher (minor)

Next.js middleware (`proxy.ts` / `middleware.ts`) runs as a Netlify **Edge
Function** — every match is a billed invocation. Even if the body early-returns
for static files, the function still fired. Exclude what never needs middleware
in the **matcher** so the function isn't invoked at all:

```ts
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|avif|css|js|mjs|woff|woff2|ttf|otf|map|json)$).*)",
  ],
};
```

Extensionless content paths still match (locale rewriting etc. keeps working).
Watch out if you intentionally handle dotted paths in the body (e.g. legacy spam
URLs ending in a TLD like `.ca`) — keep those extensions out of the exclusion list.

## Lever 5 — Deploy hygiene (workflow, not code)

Deploy cost = build minutes × **number of deploys**. If content changes already
refresh via on-demand revalidation (webhook), then deploys are *code-only* — so:

- **Batch** code pushes instead of pushing every commit to the production branch.
- Use `[skip ci]` in commit messages for docs/style-only commits.
- Never trigger a churn deploy for a content-only change; use the revalidate
  webhook instead.

## Quick verification checklist

1. `tsc --noEmit` clean.
2. `pnpm build:ci` succeeds, pages generate.
3. `grep -rho '/_next/image' .next/server/app | wc -l` → `0`.
4. Built `<img>` srcsets point at the source CDN with width transforms.
5. Next deploy's build time drops (cache reused); Bandwidth falls over the
   following days as CDN-direct images get served/crawled.
