import type { NextRequest } from "next/server"
import { processNewsletterEntry } from "@/utils/newsletter"

/**
 * In-Contentful preview of a newsletter entry. The entry's "Open preview" button
 * opens this in the browser and shows the actual rendered email (including
 * unpublished edits, since it reads the entry via the Management API).
 *
 * Setup: Contentful → Settings → Content preview → add a platform with URL
 *   https://bgmtl.com/api/newsletter/preview?id={entry.sys.id}&secret=<NEWSLETTER_WEBHOOK_SECRET>
 * applied to the `newsletter` content type.
 *
 * Read-only: never touches Brevo (dryRun).
 */
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
	const secret = process.env.NEWSLETTER_WEBHOOK_SECRET
	const url = new URL(req.url)
	const id = url.searchParams.get("id")
	const given = url.searchParams.get("secret")

	if (!secret) {
		return Response.json(
			{ error: "Preview is not configured" },
			{ status: 500 },
		)
	}
	if (given !== secret) {
		return Response.json({ error: "Unauthorized" }, { status: 401 })
	}
	if (!id) {
		return Response.json({ error: "Missing ?id" }, { status: 400 })
	}

	try {
		const { html } = await processNewsletterEntry(id, { dryRun: true })
		return new Response(html, {
			status: 200,
			headers: { "Content-Type": "text/html; charset=utf-8" },
		})
	} catch (err) {
		console.error("newsletter preview error:", err)
		return Response.json({ error: "Failed to render preview" }, { status: 500 })
	}
}
