import type { Metadata } from "next"
import { localization } from "@/utils/localization"
import { isIndexableEnv } from "@/utils/seo"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || ""
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || ""

// Used when a page has no Contentful metaData description.
const DEFAULT_DESCRIPTION: Record<string, string> = {
	bg: "Официален сайт на българската общност в Монреал: събития, новини, указател на организации и контакти.",
	en: "Official site of the Bulgarian community in Montreal: events, news, a directory of organizations, and contacts.",
	fr: "Site officiel de la communauté bulgare de Montréal : événements, actualités, répertoire d’organismes et contacts.",
}

interface MetaDataInput {
	pageTitle?: string | null
	pageDescription?: string | null
	keywords?: string | null
	image?: string | null
	imageWidth?: number
	imageHeight?: number
	imageAlt?: string | null
	type?: string
	path?: string
	locale?: string
}

/** Best-effort MIME type for an og:image URL. Facebook recommends og:image:type. */
function ogImageType(url: string): string {
	const path = url.split("?")[0].toLowerCase()
	if (path.endsWith(".png")) return "image/png"
	if (path.endsWith(".webp")) return "image/webp"
	if (path.endsWith(".gif")) return "image/gif"
	// Cloudinary OG transforms force f_jpg, and the local fallback is .jpg.
	return "image/jpeg"
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
	imageAlt,
	type = "website",
	path = "/",
	locale,
}: MetaDataInput): Metadata {
	const title = pageTitle || SITE_NAME
	const description = pageDescription || DEFAULT_DESCRIPTION[locale ?? ""] || DEFAULT_DESCRIPTION.bg
	// Default locale (bg) is served at the root with no prefix; other locales are
	// path-prefixed. Keep this in sync with app/sitemap.ts + the /bg→/ redirects.
	const localePrefix = locale && locale !== localization.defaultLocale ? `/${locale}` : ""
	const url = `${BASE_URL}${localePrefix}${path === "/" ? "" : `/${path}`}`
	// Facebook requires an absolute, https og:image. Force https so a stray
	// http URL (or http BASE_URL fallback) doesn't get rejected by the scraper.
	const ogImage = (image || `${BASE_URL}/static/og-image.jpg`).replace(/^http:\/\//i, "https://")

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
			images: [
				{
					url: ogImage,
					secureUrl: ogImage,
					width: imageWidth ?? 1200,
					height: imageHeight ?? 630,
					alt: imageAlt || title,
					type: ogImageType(ogImage),
				},
			],
			siteName: SITE_NAME,
			locale,
		},
		// Staging / preview environments (e.g. develop.bgmtl.com) emit noindex so
		// individual pages stay out of search results even if crawled directly.
		robots: isIndexableEnv()
			? { index: true, follow: true }
			: { index: false, follow: false },
	}
}
