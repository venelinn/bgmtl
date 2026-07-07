import { GridCollection } from "@/components/Collection"
import { DirectoryCard } from "@/components/Directory/DirectoryCard"
import { Section } from "@/components/Section"
import { getLatestDirectoryEntries } from "@/utils/content"
import { getLocalePrefix } from "@/utils/localization"
import { HomeDirectoryHeader } from "./HomeDirectoryHeader"

type HomeDirectoryConnectorProps = {
	locale: string
	limit?: number
	preview?: boolean
}

/**
 * Homepage community-directory teaser: the latest few directoryEntry cards
 * (Montreal, newest first) under a single header with a "View all" link to the
 * full filterable directory. Renders nothing when there are no entries.
 */
export async function HomeDirectoryConnector({
	locale,
	limit = 3,
	preview = false,
}: HomeDirectoryConnectorProps) {
	const entries = await getLatestDirectoryEntries(locale, limit, preview)
	if (!entries.length) return null

	const localePrefix = getLocalePrefix(locale)

	const items = entries.map((entry) => ({
		id: entry.id,
		content: (
			<DirectoryCard
				key={entry.id}
				tags={entry.tags.map((tag) => ({
					label: tag.label,
					href: `${localePrefix}/community/${tag.slug}`,
				}))}
				title={entry.title}
				logo={entry.logo}
				address={entry.address}
				phone={entry.phone}
				email={entry.email}
				website={entry.website}
				note={entry.note}
			/>
		),
	}))

	return (
		<Section padding="medium">
			<HomeDirectoryHeader href={`${localePrefix}/community`} showViewAll />
			<GridCollection items={items} itemsPerRow={items.length >= 3 ? 3 : 2} />
		</Section>
	)
}
