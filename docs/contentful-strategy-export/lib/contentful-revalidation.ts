// lib/contentful-revalidation.ts
//
// Webhook-driven cache invalidation. Kept separate from the route handler so
// it's unit-testable. Adjust the import path to your project's alias.

import { revalidatePath, revalidateTag } from "next/cache"
import type { NextRequest } from "next/server"
import { CONTENTFUL_TAG } from "./contentful-cache"

/** Revalidation is only usable when the shared secret is configured. */
export function isRevalidationConfigured(): boolean {
	return Boolean(process.env.CONTENTFUL_REVALIDATE_SECRET)
}

/**
 * Accept either `Authorization: Bearer <secret>` or `x-revalidate-secret:
 * <secret>`. Returns false when the secret is unset, so callers fail closed.
 */
export function isAuthorized(req: NextRequest): boolean {
	const secret = process.env.CONTENTFUL_REVALIDATE_SECRET
	if (!secret) return false

	const auth = req.headers.get("authorization")
	const bearer = auth?.startsWith("Bearer ")
		? auth.slice("Bearer ".length).trim()
		: null
	const headerSecret = req.headers.get("x-revalidate-secret")?.trim()

	return bearer === secret || headerSecret === secret
}

/**
 * Bust the Contentful data cache on publish. Returns the targets hit (for the
 * response body / logging).
 *
 * ⚠️ NEXT.JS VERSION — `revalidateTag` signature changed:
 *   • Next 16+ : revalidateTag(tag, "max")   ← second "profile" arg is REQUIRED
 *                (a bare one-arg call is deprecated; `updateTag` is
 *                 Server-Action-only and throws inside a route handler)
 *   • Next ≤15 : revalidateTag(tag)          ← single arg
 * Check your installed version (`package.json` → "next") and use the matching
 * line below.
 */
export function revalidateContentful(): string[] {
	const hit: string[] = []

	// --- Next 16+ ---
	revalidateTag(CONTENTFUL_TAG, "max")
	// --- Next ≤15 (comment out the line above, use this instead) ---
	// revalidateTag(CONTENTFUL_TAG)
	hit.push(`tag:${CONTENTFUL_TAG}`)

	// Optional safety net: also clear the rendered route / host durable HTML
	// cache. Single-locale site → just "/". For i18n, loop your locales:
	//   for (const lang of ["en", "fr"]) revalidatePath(`/${lang}`, "layout")
	revalidatePath("/", "layout")
	hit.push("/ (layout)")

	return hit
}
