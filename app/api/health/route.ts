import { isRevalidationConfigured } from "@/utils/revalidation"

/**
 * Liveness, plus one thing that is otherwise invisible: whether this deployment
 * can refresh its content at all.
 *
 * Contentful responses are cached with `revalidate: false` (see
 * `utils/contentful-cache.ts`), so nothing expires on a timer — the publish
 * webhook to `/api/revalidate` is the only thing that refetches. And
 * `isRevalidationConfigured()` is checked *before* auth in that route, so when
 * `CONTENTFUL_REVALIDATE_SECRET` is unset it answers
 * `500 "Revalidation is not configured"` to every caller, the Contentful
 * webhook included, and nothing surfaces it. A sibling project ran that way for
 * months: production silently served whatever it first cached, and an
 * unpublished page stayed live.
 *
 *     curl -s https://bgmtl.com/api/health
 *     → {"ok":true,"revalidation":"configured"}
 *
 * Only presence is reported, never the value. `ok` stays true either way so the
 * endpoint remains usable as a plain liveness probe on a machine without the
 * secret.
 */
export function GET() {
	return Response.json({
		ok: true,
		revalidation: isRevalidationConfigured() ? "configured" : "missing",
	})
}
