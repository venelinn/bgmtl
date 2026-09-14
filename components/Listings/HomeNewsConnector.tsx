import { GridCollection } from "@/components/Collection"
import { News } from "@/components/News"
import { Section } from "@/components/Section"
import type { NewsItem } from "@/types/news"
import { getFallbackImageUrl, getListingsData } from "@/utils/content"
import { getLocalePrefix } from "@/utils/localization"
import { HomeSectionHeader } from "./HomeSectionHeader"

type HomeNewsConnectorProps = {
	locale: string
	limit?: number
	preview?: boolean
}

/**
 * Homepage news teaser. Built the same way as the events and directory teasers
 * — one `HomeSectionHeader` with an inline "view all", then a one-per-row
 * `GridCollection` of cards — rather than routing through `ListingsConnector`,
 * which gave news a differently-styled heading and a centred link underneath.
 *
 * Renders nothing when there is no news, so the page doesn't show an empty
 * padded section.
 */
export async function HomeNewsConnector({
	locale,
	limit = 3,
	preview = false,
}: HomeNewsConnectorProps) {
	const { sections, siteConfig } = await getListingsData(["news"], locale, {
		limit,
		preview,
	})
	const section = sections.find((s) => s.type === "news")
	if (!section?.cards.length) return null

	const fallbackImage =
		getFallbackImageUrl(siteConfig?.fallbackNews) ?? undefined
	const cards = section.cards as unknown as NewsItem[]

	const items = cards.map((news) => ({
		id: news.id,
		content: (
			<News
				key={news.id}
				news={news}
				locale={locale}
				fallbackImage={fallbackImage}
			/>
		),
	}))

	return (
		<Section padding="medium">
			<HomeSectionHeader
				icon="Newspaper"
				namespace="News"
				titleKey="latestNews"
				href={`${getLocalePrefix(locale)}/news`}
				showViewAll={section.hasMore}
			/>
			<GridCollection items={items} itemsPerRow={1} />
		</Section>
	)
}
