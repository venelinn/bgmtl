import type { Metadata } from "next"
import { draftMode } from "next/headers"
import { notFound } from "next/navigation"
import { EventsCalendarConnector } from "@/components/Calendar"
import { EventsBrowser } from "@/components/Events/EventsBrowser"
import { EventsPageHeader } from "@/components/Events/EventsPageHeader"
import { Join } from "@/components/Join"
import { JsonLd } from "@/components/JsonLd"
import { buildMetadata } from "@/components/MetaData"
import { Sidebar } from "@/components/Sidebar"
import { DonateWidget, OrganizeEventWidget } from "@/components/Widgets"
import {
	getAllEvents,
	getFallbackImageUrl,
	getPageBySlug,
	getSiteConfig,
} from "@/utils/content"
import { getMessages } from "@/utils/getMessages"
import {
	getContentfulLocale,
	getLocalePrefix,
	localization,
} from "@/utils/localization"
import { buildEventsItemListJsonLd } from "@/utils/structuredData"

// No numeric `revalidate`: Contentful data is cached indefinitely under the
// "contentful" tag (utils/contentful-cache.ts) and busted on publish via the
// webhook. A numeric revalidate here would re-enable traffic-driven polling.

type Params = Promise<{ lang: string }>

export async function generateMetadata(props: {
	params: Params
}): Promise<Metadata> {
	const { lang } = await props.params
	const { isEnabled } = await draftMode()
	const messages = getMessages(lang) as { Events?: { sectionTitle?: string } }

	// This route is built in code, but its Contentful `events` page entry still
	// carries the SEO texts (metaData); the section title is the fallback.
	const page = await getPageBySlug(
		"events",
		getContentfulLocale(lang),
		isEnabled,
	).catch(() => null)
	const meta = (page as { metaData?: Record<string, string> } | null)?.metaData

	return buildMetadata({
		pageTitle: meta?.pageTitle || messages.Events?.sectionTitle || "Events",
		pageDescription: meta?.pageDescription ?? null,
		keywords: meta?.keywords ?? null,
		path: "events",
		locale: lang,
	})
}

export default async function EventsPage(props: { params: Params }) {
	const { lang } = await props.params
	const { isEnabled } = await draftMode()

	if (!localization.locales.includes(lang)) return notFound()

	const [events, siteConfig] = await Promise.all([
		getAllEvents(lang, isEnabled),
		getSiteConfig(lang, isEnabled),
	])

	const fallbackImage =
		getFallbackImageUrl(siteConfig?.fallbackEvents) ?? undefined
	const eventsPerPage = siteConfig?.eventsPerPage ?? 9
	const eventsItemList = buildEventsItemListJsonLd(events, lang)
	const localePrefix = getLocalePrefix(lang)

	// Light page header (no full-width photo hero), so the navigation renders solid.
	return (
		<>
			<JsonLd data={eventsItemList} />
			<EventsPageHeader localePrefix={localePrefix} />
			<EventsBrowser
				events={events}
				locale={lang}
				fallbackImage={fallbackImage}
				eventsPerPage={eventsPerPage}
				sidebar={
					<Sidebar>
						<EventsCalendarConnector locale={lang} />
						<OrganizeEventWidget contactsPath={`${localePrefix}/contacts?topic=event#contact-form`} />
						<DonateWidget />
					</Sidebar>
				}
			/>
			<Join />
		</>
	)
}
