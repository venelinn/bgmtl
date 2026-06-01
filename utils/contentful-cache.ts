import { unstable_cache } from "next/cache";
import { IS_DEV } from "./common";

/**
 * Pure-webhook Contentful caching (see docs/contentful-strategy-export).
 *
 * Every Contentful-backed cache entry is tagged with this single tag, so one
 * webhook call (`revalidateTag(CONTENTFUL_TAG, "max")` on publish) invalidates
 * ALL of them at once. Keep this string identical here and in
 * `utils/revalidation.ts`.
 */
export const CONTENTFUL_TAG = "contentful";

/**
 * Wrap any async Contentful fetch so its result is cached **indefinitely**
 * (`revalidate: false`) and only refetched when the publish webhook busts the
 * `contentful` tag.
 *
 * This is the core of the "pure-webhook" model: ordinary traffic and crawlers
 * hit the cache and spend ZERO Contentful API calls. The CMS is queried only
 * (a) at build time and (b) once per cache entry after an editor publishes —
 * never on a timer (no numeric `revalidate` anywhere), never per visitor.
 *
 * The cache is bypassed when:
 * - `opts.bypass` is set — used for preview / draft mode, which must always read
 *   fresh draft content.
 *
 * In `next dev` we DON'T use `unstable_cache` (it persists to `.next/cache` on
 * disk and would survive restarts). Instead we memoize in-process for the
 * lifetime of the dev server: repeated requests and hot reloads cost ZERO
 * Contentful calls, and a full server restart clears the memo — so restarting
 * is how you pick up freshly published content while developing.
 *
 * `keyParts` MUST uniquely identify the result — include EVERY argument that
 * changes it (content type, locale, slug, query params). Two different inputs
 * sharing a key would serve the wrong content from cache.
 */

// In-memory memo for `next dev` only. Keyed by the joined keyParts; holds the
// in-flight/resolved promise so concurrent callers dedupe too. Cleared on a
// full process restart (not preserved across it like the on-disk data cache).
const devMemo = new Map<string, Promise<unknown>>();

export function cachedContentful<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  opts?: { bypass?: boolean },
): Promise<T> {
  // Preview/draft must always read fresh — never cache.
  if (opts?.bypass) return fn();

  if (IS_DEV) {
    const key = keyParts.join("::");
    const hit = devMemo.get(key) as Promise<T> | undefined;
    if (hit) return hit;

    const pending = fn();
    devMemo.set(key, pending);
    // Don't poison the memo with a rejected fetch — let the next call retry.
    pending.catch(() => devMemo.delete(key));
    return pending;
  }

  return unstable_cache(fn, keyParts, {
    revalidate: false, // never time-expire; only the webhook tag-bust refetches
    tags: [CONTENTFUL_TAG],
  })();
}
