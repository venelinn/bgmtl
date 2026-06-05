import { draftMode } from "next/headers"
import { redirect } from "next/navigation"

export async function GET(request) {
	const draft = await draftMode()
	draft.disable()

	const { searchParams } = new URL(request.url)
	const path = searchParams.get("path") || "/"
	redirect(path)
}
