#!/usr/bin/env node
/**
 * Manually refresh the Contentful cache on a deployed site.
 *
 * Why this is ever needed: Contentful responses are cached with
 * `revalidate: false` (see `utils/contentful-cache.ts`), so nothing expires on
 * a timer. The publish webhook → `/api/revalidate` is the only thing that
 * refetches. Normally that is enough — but if the webhook is misconfigured,
 * rate-limited, or fires before an edit finishes saving, the deployed site
 * keeps serving stale content with no obvious way to shift it. Unpublishing an
 * entry can appear to do nothing at all.
 *
 * Check first whether the deployment can revalidate at all:
 *
 *   curl -s https://bgmtl.com/api/health      → {"revalidation":"configured"}
 *
 * Usage — NOTE the default target is PRODUCTION:
 *
 *   pnpm purge-cache                              # https://bgmtl.com
 *   PURGE_URL=http://localhost:3020 pnpm purge-cache
 *
 * Local `next dev` does not need this: `utils/contentful-cache.ts` skips
 * `unstable_cache` entirely in development, so every reload is already fresh.
 *
 * Exits non-zero on failure so CI (or a human) sees it fail rather than
 * assuming success.
 */
require("dotenv").config()

const base = (
	process.env.PURGE_URL ||
	process.env.NEXT_PUBLIC_BASE_URL ||
	""
).replace(/\/+$/, "")
const secret = process.env.CONTENTFUL_REVALIDATE_SECRET

async function main() {
	if (!base) {
		console.error(
			"✗ Set PURGE_URL (or NEXT_PUBLIC_BASE_URL) to the deployed site",
		)
		process.exit(1)
	}
	if (!secret) {
		console.error("✗ CONTENTFUL_REVALIDATE_SECRET is not set (check .env)")
		process.exit(1)
	}

	const url = `${base}/api/revalidate`
	let res
	try {
		res = await fetch(url, {
			method: "POST",
			headers: { "x-revalidate-secret": secret },
		})
	} catch (err) {
		console.error(`✗ could not reach ${url}: ${err.message}`)
		process.exit(1)
	}

	const body = await res.text()

	if (!res.ok) {
		console.error(`✗ purge failed: ${res.status} ${body.slice(0, 200)}`)
		if (res.status === 500 && body.includes("not configured")) {
			console.error(
				"  → CONTENTFUL_REVALIDATE_SECRET is missing on the DEPLOYMENT " +
					"(not just locally). Set it in every environment that serves the " +
					"site, then redeploy.",
			)
		}
		if (res.status === 401) {
			console.error("  → the local secret does not match the deployment's.")
		}
		process.exit(1)
	}

	console.log(`✓ purged ${base}`)
	console.log(`  ${body.slice(0, 300)}`)
}

main()
