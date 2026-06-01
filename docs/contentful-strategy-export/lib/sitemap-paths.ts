// lib/sitemap-paths.ts
//
// Data source for app/sitemap.ts: the set of URLs that should appear in the
// sitemap, pulled from Contentful and CACHED via cachedContentful — so
// regenerating the sitemap (hourly, or when a crawler hits it) costs ZERO
// Contentful API calls. The cache is busted only by the publish webhook
// (same `contentful` tag as everything else).
//
// ⚠️ ADAPT the marked section to your Contentful client + content model.

import { cachedContentful } from "./contentful-cache"

export type SitemapPath = {
	/**
	 * App locale prefix, e.g. "en" / "fr". Use "" for a single-locale site that
	 * serves pages without a /locale prefix.
	 */
	locale: string
	/** Path WITHOUT the locale prefix, no leading/trailing slashes. "" = home. */
	pathSegments: string
	/** From the entry's `sys.updatedAt`. */
	lastModified: Date
}

/**
 * Locales to emit. Single-locale site → `[""]`. Bilingual EN/FR → `["en","fr"]`.
 * Keep in sync with app/sitemap.ts.
 */
export const SITEMAP_LOCALES = ["en", "fr"] as const

/** Slugs to exclude from the sitemap (exact match or `${slug}/` prefix). */
const EXCLUDED_SLUGS = ["/media", "/search", "/404"]

// ──────────────────────────────────────────────────────────────────────────
// ADAPT: replace the body with your real Contentful fetch. This mirrors the
// reference implementation (the `contentful` SDK, a `page` content type with a
// string `slug` field). Map your CMS locale codes (e.g. "en-CA") to app
// locales ("en") as needed.
// ──────────────────────────────────────────────────────────────────────────
async function fetchSitemapPaths(): Promise<SitemapPath[]> {
	// import { createClient } from "contentful"
	// const client = createClient({
	//   space: process.env.CONTENTFUL_SPACE_ID!,
	//   accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN!,
	//   environment: process.env.CONTENTFUL_ENVIRONMENT || "master",
	// })

	const out: SitemapPath[] = []

	for (const locale of SITEMAP_LOCALES) {
		// const contentfulLocale = toContentfulLocale(locale) // e.g. "en" → "en-CA"
		// const { items } = await client.getEntries({
		//   content_type: "page",
		//   locale: contentfulLocale,
		//   limit: 1000,
		//   select: ["fields.slug", "sys.updatedAt"],
		// })
		const items: Array<{
			fields?: { slug?: string }
			sys?: { updatedAt?: string }
		}> = [] // ← replace with the line above

		for (const item of items) {
			const slug = item.fields?.slug
			if (!slug) continue
			if (
				EXCLUDED_SLUGS.includes(slug) ||
				EXCLUDED_SLUGS.some((s) => slug.startsWith(`${s}/`))
			) {
				continue
			}

			// "/" → "" (home); else strip leading/trailing slashes.
			const pathSegments =
				slug === "/" ? "" : String(slug).replace(/^\/+|\/+$/g, "")
			const updated = item.sys?.updatedAt

			out.push({
				locale,
				pathSegments,
				lastModified: updated ? new Date(updated) : new Date(),
			})
		}
	}

	return out
}

/**
 * Cached entry point — call this from app/sitemap.ts. The result is cached
 * indefinitely and only refetched after the publish webhook busts the
 * `contentful` tag. So `app/sitemap.ts` can carry `export const revalidate =
 * 3600` (regenerate the XML hourly) at no API cost — the underlying data is a
 * cache hit on every regen except the first after a publish.
 */
export function getSitemapPaths(): Promise<SitemapPath[]> {
	return cachedContentful(fetchSitemapPaths, ["sitemap-paths"])
}
