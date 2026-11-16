import { getCommunityDirectory } from "@/utils/content"
import { getLocalePrefix } from "@/utils/localization"
import { HomeDirectory } from "./HomeDirectory"

type HomeDirectoryConnectorProps = {
	locale: string
	limit?: number
	preview?: boolean
}

/** Directory city the homepage section shows (matches the hero search). */
const DIRECTORY_CITY = "montreal"

/**
 * Homepage community-directory section. Fetches every listing in the city
 * (newest first) plus the category taxonomy, and hands them to the client
 * HomeDirectory, which filters by category in place. Renders nothing when there
 * are no listings.
 */
export async function HomeDirectoryConnector({
	locale,
	limit = 6,
	preview = false,
}: HomeDirectoryConnectorProps) {
	const { items, categories } = await getCommunityDirectory(
		DIRECTORY_CITY,
		locale,
		preview,
	)
	if (!items.length) return null

	const localePrefix = getLocalePrefix(locale)

	return (
		<HomeDirectory
			items={items}
			categories={categories}
			directoryPath={`${localePrefix}/community`}
			contactsPath={`${localePrefix}/contacts?topic=directory#contact-form`}
			limit={limit}
		/>
	)
}
