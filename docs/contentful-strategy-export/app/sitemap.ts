// app/sitemap.ts
//
// Native Next.js App Router sitemap, driven by Contentful and CACHED (the data
// comes from getSitemapPaths → cachedContentful, so regeneration costs ~0 CMS
// API calls). Emits hreflang alternates for multilingual sites + lastModified
// from Contentful `updatedAt`.
//
// Adjust the import paths to your alias / folder convention.

import type { MetadataRoute } from "next"
import { getSitemapPaths, SITEMAP_LOCALES } from "@/lib/sitemap-paths"

// Regenerate the XML hourly. Cheap: the underlying Contentful data is cached
// (revalidate:false), so each hourly regen is a cache hit — a fresh CMS fetch
// happens only after the publish webhook busts the `contentful` tag.
export const revalidate = 3600

function siteUrl(): string {
	return (
		process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") ||
		"https://example.com" // ← set NEXT_PUBLIC_BASE_URL or hardcode your domain
	)
}

/** Build an absolute URL. `locale === ""` → no locale prefix (single-locale). */
function absoluteUrl(locale: string, pathSegments: string): string {
	const base = siteUrl()
	const prefix = locale ? `/${locale}` : ""
	const tail = pathSegments ? `/${pathSegments}` : ""
	return `${base}${prefix}${tail}` || base
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const rows = await getSitemapPaths()
	const locales = [...SITEMAP_LOCALES]

	// Group every locale variant of the same page so they share hreflang.
	type Group = { lastModified: Date; urls: Record<string, string>; byLocale: Record<string, Date> }
	const groups = new Map<string, Group>()

	for (const row of rows) {
		let g = groups.get(row.pathSegments)
		if (!g) {
			g = { lastModified: row.lastModified, urls: {}, byLocale: {} }
			groups.set(row.pathSegments, g)
		}
		g.urls[row.locale] = absoluteUrl(row.locale, row.pathSegments)
		g.byLocale[row.locale] = row.lastModified
		if (row.lastModified > g.lastModified) g.lastModified = row.lastModified
	}

	const entries: MetadataRoute.Sitemap = []

	for (const [pathSegments, g] of groups) {
		const languages: Record<string, string> = {}
		for (const loc of locales) if (g.urls[loc]) languages[loc] = g.urls[loc]
		// Only emit hreflang when the page exists in more than one locale.
		const alternates =
			Object.keys(languages).length > 1 ? { languages } : undefined

		for (const loc of locales) {
			const url = g.urls[loc]
			if (!url) continue
			entries.push({
				url,
				lastModified: g.byLocale[loc] ?? g.lastModified,
				changeFrequency: pathSegments === "" ? "daily" : "weekly",
				priority: pathSegments === "" ? 1 : 0.8,
				...(alternates ? { alternates } : {}),
			})
		}
	}

	// Fallback: never ship an empty sitemap — at least list each locale home.
	if (entries.length === 0) {
		for (const loc of locales) {
			entries.push({
				url: absoluteUrl(loc, ""),
				lastModified: new Date(),
				changeFrequency: "daily",
				priority: 1,
			})
		}
	}

	return entries.sort((a, b) => a.url.localeCompare(b.url))
}
