import { Section } from "@/components/Section"
import { getListingsData } from "@/utils/content"
import { ListingsConnector } from "./ListingsConnector"

type HomeNewsConnectorProps = {
	locale: string
	limit?: number
	preview?: boolean
}

/**
 * Homepage news teaser wrapped in its own Section. Renders nothing when there
 * is no news, so the page doesn't show an empty padded section.
 */
export async function HomeNewsConnector({
	locale,
	limit = 3,
	preview = false,
}: HomeNewsConnectorProps) {
	const { sections } = await getListingsData(["news"], locale, {
		limit,
		preview,
	})
	const hasNews =
		(sections.find((s) => s.type === "news")?.cards.length ?? 0) > 0
	if (!hasNews) return null

	return (
		<Section padding="medium">
			<ListingsConnector
				listings={["news"]}
				locale={locale}
				limit={limit}
				preview={preview}
			/>
		</Section>
	)
}
