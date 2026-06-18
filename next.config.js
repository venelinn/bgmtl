// const localization = require("./utils/localization")

// Master View Transitions toggle, mirrored in utils/common.ts
// (VIEW_TRANSITIONS_ENABLED). Set NEXT_PUBLIC_VIEW_TRANSITIONS=false to disable.
const viewTransitionsEnabled =
	process.env.NEXT_PUBLIC_VIEW_TRANSITIONS !== "false";

/** @type {import('next').NextConfig} */
const nextConfig = {
	// i18n: {
	// 	locales: localization.locales,
	// 	defaultLocale: localization.defaultLocale,
	// 	localeDetection: false,
	// },
	reactStrictMode: true,
	trailingSlash: false,
	experimental: {
		// Wrap App Router soft navigations in document.startViewTransition() so the
		// ::view-transition-*(root) animations + shared-element morphs in globals.scss
		// actually fire on <Link> clicks (otherwise they'd only run on MPA navigations).
		viewTransition: viewTransitionsEnabled,
	},
	images: {
		// dangerouslyAllowSVG: true,
		// Serve images straight from the Contentful/Cloudinary CDNs instead of
		// Netlify's billed image optimizer (see utils/imageLoader.ts). With a
		// custom loader, remotePatterns is no longer enforced, but it's kept as
		// living documentation of the allowed sources.
		loader: "custom",
		loaderFile: "./utils/imageLoader.ts",
		remotePatterns: [
			{
				protocol: "https",
				hostname: "downloads.ctfassets.net",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "images.ctfassets.net",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "res.cloudinary.com",
				pathname: "**",
			},
			{
				protocol: "http",
				hostname: "res.cloudinary.com",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "i.ytimg.com",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "*.cdninstagram.com",
				pathname: "**",
			},
			{
				protocol: "https",
				hostname: "images.unsplash.com",
				pathname: "**",
			},
		],
	},
	async rewrites() {
		return [
			{
				source: "/storybook/:path*",
				destination: "/_next/storybook/:path*",
			},
		]
	},
	async redirects() {
		return [
			{
				source: "/:lang/contact-us{/}?",
				destination: "/:lang/about-us/contacts",
				permanent: true,
			},
			{
				source: "/:lang/community-support/bg-foundation{/}?",
				destination: "/:lang/foundation/foundation-board-of-directors",
				permanent: true,
			},
			{
				source: "/:lang/about-us/founding-chapter{/}?",
				destination: "/:lang/about-us/founding-charter",
				permanent: true,
			},
			{
				source: "/:lang/financial-overview{/}?",
				destination: "/:lang/foundation/orbf-financial-statements",
				permanent: true,
			},

			// ── Legacy WordPress URLs (no locale prefix) → canonical pages. ──
			// These run BEFORE proxy.ts prefixes the path with /bg, so the
			// `source` must be the BARE legacy path. Destinations use the BARE
			// canonical slug (what sitemap.xml emits and Contentful stores — the
			// leaf-slug fallback in utils/content.ts resolves it); the proxy
			// rewrites them to /bg internally. Targets verified against the live
			// nav + sitemap on 2026-06-01.
			{ source: "/home{/}?", destination: "/", permanent: true },
			{ source: "/front_page{/}?", destination: "/", permanent: true },
			{ source: "/index.php", destination: "/", permanent: true },
			// NOTE: the old WordPress "ugly permalink" /?page_id=482 (the
			// now-removed membership page) is handled in proxy.ts, not here — a
			// query-based redirect to "/" would re-forward the query and loop.
			{ source: "/about-us/management-team{/}?", destination: "/board-of-directors", permanent: true },
			{ source: "/about-us/other-info{/}?", destination: "/about-policies", permanent: true },
			{ source: "/history-2{/}?", destination: "/history", permanent: true },
			{ source: "/contact-us-2{/}?", destination: "/contacts", permanent: true },
			{ source: "/events/upcoming-events{/}?", destination: "/events", permanent: true },
			{ source: "/events/archive{/}?", destination: "/events", permanent: true },
			{ source: "/blog{/}?", destination: "/news", permanent: true },
			{ source: "/archive{/}?", destination: "/news", permanent: true },
			{ source: "/community-support/community-news{/}?", destination: "/news", permanent: true },
			{ source: "/community-support/bg-community-in-canada{/}?", destination: "/bg-community-in-ottawa", permanent: true },
			{ source: "/category/:rest*", destination: "/news", permanent: true },
			{ source: "/author/:rest*", destination: "/news", permanent: true },
			{ source: "/sponsors{/}?", destination: "/sponsors", permanent: true },

			// NOTE: do NOT add a `/bg → /` redirect here. On Netlify the proxy
			// (proxy.ts) rewrites `/` → `/bg/` FIRST, so such a redirect bounces
			// `/bg/` back to `/` and loops infinitely (memory.md guardrail #4).
			// The unprefixed-bg canonical is enforced via <link rel=canonical>
			// in buildMetadata instead — no redirect needed.
		]
	},
}

module.exports = nextConfig
