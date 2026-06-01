// app/api/revalidate/route.ts
//
// Contentful publish webhook target. Adjust the import path to your alias.

import type { NextRequest } from "next/server"
import {
	isAuthorized,
	isRevalidationConfigured,
	revalidateContentful,
} from "@/lib/contentful-revalidation"

// Node runtime: on-demand revalidation must run where Next can update its cache
// manifest (NOT Edge). On Netlify this deploys as a Node Function automatically.
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
	if (!isRevalidationConfigured()) {
		return Response.json(
			{ error: "Revalidation is not configured" },
			{ status: 500 },
		)
	}

	if (!isAuthorized(req)) {
		return Response.json({ error: "Unauthorized" }, { status: 401 })
	}

	try {
		const targets = revalidateContentful()
		return Response.json({ revalidated: true, targets })
	} catch (err) {
		console.error("revalidate error:", err)
		return Response.json({ error: "Revalidation failed" }, { status: 500 })
	}
}
