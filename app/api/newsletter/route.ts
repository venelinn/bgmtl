import type { NextRequest } from "next/server"
import {
	buildNewsletter,
	type NewsletterMode,
	NEWSLETTER_MODES,
	processNewsletterEntry,
} from "@/utils/newsletter"

/**
 * Contentful webhook → Brevo (draft or send), driven entirely by the entry.
 *
 * Fired when a `newsletter` entry is published. Reads the entry fresh (Management
 * API), builds the HTML with the shared renderer, then per the entry's `status`:
 *   - draft → (create/update) a Brevo DRAFT campaign
 *   - send  → email the whole list (sendNow), guarded so it never double-sends
 * See utils/newsletter.ts → processNewsletterEntry and docs/newsletter.md.
 *
 * Setup: Contentful → Settings → Webhooks → POST /api/newsletter, header
 * `x-newsletter-secret: <NEWSLETTER_WEBHOOK_SECRET>`, filter content type =
 * `newsletter`, trigger = Entry Publish.
 *
 * Testing: POST `/api/newsletter?dryRun=1` with the secret header and a body of
 * `{ "sys": { "id": "<entryId>" } }` → returns the HTML, never touches Brevo.
 * Or entry-less: `?dryRun=1&mode=upcomingEvents`.
 */
export const runtime = "nodejs"

function isConfigured(): boolean {
	return Boolean(process.env.NEWSLETTER_WEBHOOK_SECRET)
}

/** Accept either `Authorization: Bearer <secret>` or `x-newsletter-secret: <secret>`. */
function isAuthorized(req: NextRequest): boolean {
	const secret = process.env.NEWSLETTER_WEBHOOK_SECRET
	if (!secret) return false
	const auth = req.headers.get("authorization")
	const bearer = auth?.startsWith("Bearer ")
		? auth.slice("Bearer ".length).trim()
		: null
	const headerSecret = req.headers.get("x-newsletter-secret")?.trim()
	return bearer === secret || headerSecret === secret
}

function htmlResponse(html: string, itemCount: number) {
	return new Response(html, {
		status: 200,
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"X-Item-Count": String(itemCount),
		},
	})
}

export async function POST(req: NextRequest) {
	if (!isConfigured()) {
		return Response.json(
			{ error: "Newsletter webhook is not configured" },
			{ status: 500 },
		)
	}
	if (!isAuthorized(req)) {
		return Response.json({ error: "Unauthorized" }, { status: 401 })
	}

	const url = new URL(req.url)
	const dryRun = url.searchParams.get("dryRun") === "1"

	try {
		const payload = await req
			.json()
			.catch(() => ({}) as Record<string, unknown>)
		const entryId = (payload as any)?.sys?.id as string | undefined

		// Entry-less dry run: quick render of a mode, no CMS entry / no Brevo.
		if (!entryId) {
			const modeParam = url.searchParams.get("mode") as NewsletterMode | null
			if (dryRun && modeParam && NEWSLETTER_MODES.includes(modeParam)) {
				const { html, total } = await buildNewsletter({ mode: modeParam })
				return htmlResponse(html, total)
			}
			return Response.json(
				{ error: "Missing entry id in payload (sys.id)" },
				{ status: 400 },
			)
		}

		const result = await processNewsletterEntry(entryId, { dryRun })

		if (dryRun) return htmlResponse(result.html, result.total)

		return Response.json({
			ok: true,
			action: result.action, // draft | sent | skipped-already-sent
			status: result.status,
			items: result.total,
			campaignId: result.campaignId,
		})
	} catch (err) {
		console.error("newsletter webhook error:", err)
		return Response.json(
			{ error: "Failed to process newsletter" },
			{ status: 500 },
		)
	}
}
