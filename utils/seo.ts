// Whether the current deployment may be indexed by search engines.
// Staging / preview environments (e.g. develop.bgmtl.com) must be blocked so
// they don't compete with production in search results.

// Host fragments that mark a non-production environment. Matched case-insensitively
// against the NEXT_PUBLIC_BASE_URL host.
const NON_INDEXABLE_MARKERS = ["develop.", "staging.", "preview.", "localhost", ".vercel.app"];

export function isIndexableEnv(baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""): boolean {
	const host = baseUrl
		.replace(/^https?:\/\//i, "")
		.replace(/\/+$/, "")
		.toLowerCase();
	return !NON_INDEXABLE_MARKERS.some((marker) => host.includes(marker));
}
