// app/api/preview/route.js
import { draftMode } from "next/headers"
import { redirect } from "next/navigation"
import { getPreviewPathForEntry } from "@/utils/content"

export async function GET(request) {
	const { searchParams } = new URL(request.url)
	const secret = searchParams.get("secret")
	const id = searchParams.get("id")
	const locale = searchParams.get("locale") || "en"

	// 1. Validate
	if (secret !== process.env.CONTENTFUL_PREVIEW_SECRET || !id) {
		return new Response("Invalid token or missing ID", { status: 401 })
	}

	// 2. Enable Draft Mode
	const draft = await draftMode()
	draft.enable()

	// 3. Redirect to the page being previewed (or homepage if we can't resolve it)
	const path = await getPreviewPathForEntry(id, locale)
	redirect(path || `/${locale}`)
}
