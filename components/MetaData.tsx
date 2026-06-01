import type { Metadata } from "next"
import { localization } from "@/utils/localization"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || ""
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || ""

interface MetaDataInput {
	pageTitle?: string | null
	pageDescription?: string | null
	keywords?: string | null
	image?: string | null
	imageWidth?: number
	imageHeight?: number
	type?: string
	path?: string
	locale?: string
}

/**
 * Builds a Next.js Metadata object from Contentful metaData fields.
 * Use in `generateMetadata` exports from page/layout files.
 */
export function buildMetadata({
	pageTitle,
	pageDescription,
	keywords,
	image,
	imageWidth,
	imageHeight,
	type = "website",
	path = "/",
	locale,
}: MetaDataInput): Metadata {
	const title = pageTitle || SITE_NAME
	const description = pageDescription || `${SITE_NAME} — Boat rentals, Captain-led trips, & on-the-water experiences`
	// Default locale (bg) is served at the root with no prefix; other locales are
	// path-prefixed. Keep this in sync with app/sitemap.ts + the /bg→/ redirects.
	const localePrefix = locale && locale !== localization.defaultLocale ? `/${locale}` : ""
	const url = `${BASE_URL}${localePrefix}${path === "/" ? "" : `/${path}`}`
	const ogImage = image || `${BASE_URL}/static/og-image.jpg`

	return {
		title,
		description,
		keywords: keywords ?? undefined,
		alternates: {
			canonical: url,
		},
		openGraph: {
			title,
			description,
			url,
			type: type as "website" | "article",
			images: [{ url: ogImage, width: imageWidth, height: imageHeight }],
			siteName: SITE_NAME,
			locale,
		},
		robots: {
			index: true,
			follow: true,
		},
	}
}
