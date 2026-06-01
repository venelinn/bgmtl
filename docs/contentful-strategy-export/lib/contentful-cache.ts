// lib/contentful-cache.ts
//
// Drop-in cache wrapper for Contentful (App Router). Adjust the import path
// (`@/lib/...`) to your project's alias / folder convention.

import { unstable_cache } from "next/cache"

/**
 * Every Contentful-backed cache entry is tagged with this, so a single webhook
 * call can invalidate ALL of them. Keep this string identical here and in
 * `contentful-revalidation.ts`.
 */
export const CONTENTFUL_TAG = "contentful"

/** Local `next dev` only — Vercel/Netlify deployments are always "production". */
const IS_DEV = process.env.NODE_ENV === "development"

/**
 * Wrap any async Contentful fetch so its result is cached **indefinitely**
 * (`revalidate: false`) and only refetched when the publish webhook busts the
 * `contentful` tag.
 *
 * This is the core of the "pure-webhook" model: ordinary traffic and crawlers
 * hit the cache and spend ZERO Contentful API calls. The CMS is queried only
 * (a) at build time and (b) once per cache entry after an editor publishes.
 *
 * In development the cache is skipped so a published edit shows on the next
 * reload (request volume is just you).
 *
 * USAGE — wrap your existing fetchers, don't rewrite them:
 *
 *   // before:
 *   export async function getLandingPage(slug: string) {
 *     return client.getEntries({ content_type: "page", "fields.slug": slug })
 *   }
 *
 *   // after:
 *   async function fetchLandingPage(slug: string) {
 *     return client.getEntries({ content_type: "page", "fields.slug": slug })
 *   }
 *   export function getLandingPage(slug: string) {
 *     return cachedContentful(() => fetchLandingPage(slug), ["page", slug])
 *   }
 *
 * `keyParts` must uniquely identify the result — include EVERY argument that
 * changes it (slug, locale, content-type, preview flag, …). Two different
 * inputs sharing a key = wrong content served from cache.
 */
export function cachedContentful<T>(
	fn: () => Promise<T>,
	keyParts: string[],
): Promise<T> {
	if (IS_DEV) return fn()
	return unstable_cache(fn, keyParts, {
		revalidate: false, // ← never time-expire; only the webhook tag-bust refetches
		tags: [CONTENTFUL_TAG],
	})()
}
