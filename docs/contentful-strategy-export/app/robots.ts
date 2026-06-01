// app/robots.ts
//
// Minimal robots that advertises the sitemap. Native Next.js metadata route —
// delete next-sitemap's robots.txt generation if you adopt this (don't ship two).

import type { MetadataRoute } from "next"

function siteUrl(): string {
	return (
		process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") ||
		"https://example.com"
	)
}

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				// Add private/app routes you don't want crawled, e.g.:
				disallow: ["/api", "/api/*"],
			},
		],
		sitemap: `${siteUrl()}/sitemap.xml`,
	}
}
